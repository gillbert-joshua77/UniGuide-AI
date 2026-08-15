import time
import re
import requests

import logging

from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings

from .models import ChatSession, ChatMessage
from .serializers import (
    ChatSessionSerializer,
    ChatSessionDetailSerializer,
    ChatSessionCreateSerializer,
    ChatRenameSerializer,
    ChatSendSerializer,
)
from .services.context_builder import build_system_instruction, build_chat_history
from .services.gemini_client import GeminiService, GeminiError
from .services.rate_limit import check_chat_rate_limit, RateLimitExceeded

logger = logging.getLogger('uniguide.ai')


def _owned_session(user, session_id):
    return get_object_or_404(ChatSession, id=session_id, user=user)


def _rollback_failed_message(session, user_msg, is_new_session):
    """Undo a message that could not be answered by Gemini.

    Removes the unsaved user message and, for a brand new session that
    never produced a reply, removes the session itself so no empty
    conversation is left behind.
    """
    user_msg.delete()
    if is_new_session and not session.chat_messages.exists():
        session.delete()


class UniGuideChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Send a message. Continues the owned session when session_id is
        provided, otherwise creates a new ChatSession."""
        serializer = ChatSendSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            check_chat_rate_limit(request.user)
        except RateLimitExceeded as exc:
            return Response(
                {'error': str(exc), 'retry_after': exc.retry_after},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        message = serializer.validated_data['message']
        session_id = serializer.validated_data.get('session_id')
        is_new_session = session_id is None

        if session_id:
            session = _owned_session(request.user, session_id)
        else:
            session = ChatSession.objects.create(user=request.user)

        user_msg = ChatMessage.objects.create(
            session=session,
            role='user',
            content=message,
        )

        if session.title == 'New Chat':
            session.title = message[:60]
            session.save(update_fields=['title', 'updated_at'])

        try:
            service = GeminiService()
            system_instruction = build_system_instruction(request.user)
            history = build_chat_history(session)
            reply = service.generate_reply(message, history, system_instruction)
        except GeminiError as exc:
            _rollback_failed_message(session, user_msg, is_new_session)
            return Response(
                {'error': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as exc:
            logger.exception('Unexpected error while sending chat message')
            _rollback_failed_message(session, user_msg, is_new_session)
            return Response(
                {'error': 'Something went wrong. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        ChatMessage.objects.create(
            session=session,
            role='assistant',
            content=reply,
        )

        return Response(
            {
                'session_id': str(session.id),
                'title': session.title,
                'reply': reply,
            },
            status=status.HTTP_200_OK,
        )

    def get(self, request):
        """List the current user's chat sessions, newest first."""
        sessions = ChatSession.objects.filter(user=request.user)
        return Response(
            ChatSessionSerializer(sessions, many=True).data,
            status=status.HTTP_200_OK,
        )


class ChatSessionCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatSessionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        session = ChatSession.objects.create(
            user=request.user,
            title=serializer.validated_data['title'],
        )
        return Response(
            ChatSessionSerializer(session).data,
            status=status.HTTP_201_CREATED,
        )


class ChatSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session = _owned_session(request.user, session_id)
        return Response(
            ChatSessionDetailSerializer(session).data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, session_id):
        session = _owned_session(request.user, session_id)
        serializer = ChatRenameSerializer(session, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(
            ChatSessionSerializer(session).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, session_id):
        session = _owned_session(request.user, session_id)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── IT NEWS ─────────────────────────────────────────────────────────────────

NEWS_CACHE = {}
NEWS_CACHE_TTL = 30 * 60  # seconds

NEWSAPI_BASE = "https://newsapi.org/v2/everything"

NEWS_CATEGORY_QUERIES = {
    "ai": '"artificial intelligence" OR "machine learning" OR OpenAI OR ChatGPT OR "deep learning" OR "AI model"',
    "software": '"software development" OR "software engineer" OR "open source" OR "programming language" OR "app developer"',
    "cybersecurity": 'cybersecurity OR "data breach" OR ransomware OR "cyber attack" OR malware OR "security vulnerability"',
    "cloud": '"cloud computing" OR AWS OR "Microsoft Azure" OR "Google Cloud" OR Kubernetes OR "cloud infrastructure"',
    "startups": '"tech startup" OR "venture capital" OR "startup funding" OR "seed round" OR "startup IPO" OR "Series B"',
    "jobs": '"tech jobs" OR "software engineer salary" OR "tech layoffs" OR "IT hiring" OR "fresher hiring" OR "tech recruitment"',
    "research": '"AI research" OR "machine learning research" OR "computer science research" OR "research paper" OR "university research"',
}

NEWS_CATEGORY_LABELS = {
    "ai": "AI",
    "software": "Software",
    "cybersecurity": "Cybersecurity",
    "cloud": "Cloud",
    "startups": "Startups",
    "jobs": "Jobs",
    "research": "Research",
}


def _clean_text(text):
    """Strip NewsAPI's broken unicode replacement characters."""
    if not text:
        return ""
    return re.sub(r"[\ufffd]+", "'", text)


def _estimate_read_time(text):
    if not text:
        return 1
    words = len(re.findall(r"\S+", text))
    return max(1, round(words / 200))


class NewsView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        category = (request.query_params.get("category", "all") or "all").strip().lower()

        if category != "all" and category not in NEWS_CATEGORY_QUERIES:
            return Response(
                {"error": f"Unknown category '{category}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        api_key = getattr(settings, "NEWS_API_KEY", "")
        if not api_key:
            return Response(
                {"error": "News API key is not configured on the server"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            if category == "all":
                articles = []
                for cat in NEWS_CATEGORY_QUERIES:
                    articles.extend(self._fetch_category(cat, api_key))

                seen, deduped = set(), []
                for a in articles:
                    url_key = (a.get("url") or "").strip().lower()
                    title_key = (a.get("title") or "").strip().lower()
                    if not url_key or url_key in seen or title_key in seen:
                        continue
                    seen.add(url_key)
                    seen.add(title_key)
                    deduped.append(a)
                deduped.sort(key=lambda x: x.get("publishedAt") or "", reverse=True)

                return Response(
                    {"category": "all", "total": len(deduped), "articles": deduped, "source": "NewsAPI.org"},
                    status=status.HTTP_200_OK,
                )

            articles = self._fetch_category(category, api_key)
            return Response(
                {"category": category, "total": len(articles), "articles": articles, "source": "NewsAPI.org"},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": f"Could not load news right now: {e}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

    @staticmethod
    def _fetch_category(category, api_key):
        cached = NEWS_CACHE.get(category)
        if cached and time.time() - cached[0] < NEWS_CACHE_TTL:
            return cached[1]

        try:
            resp = requests.get(
                NEWSAPI_BASE,
                params={
                    "q": NEWS_CATEGORY_QUERIES[category],
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": 12,
                    "apiKey": api_key,
                },
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            if cached:
                return cached[1]
            raise

        if data.get("status") != "ok":
            if cached:
                return cached[1]
            raise RuntimeError(f"NewsAPI error ({data.get('code', 'unknown')}): {data.get('message', 'unknown')}")

        label = NEWS_CATEGORY_LABELS[category]
        raw_articles = data.get("articles") or []

        articles = _normalize_articles(raw_articles, category, label)

        NEWS_CACHE[category] = (time.time(), articles)
        return articles


def _normalize_articles(raw_articles, category, label):
    articles = []
    for idx, art in enumerate(raw_articles or []):
        title = _clean_text(art.get("title") or "").strip()
        if not title:
            continue

        summary = _clean_text(art.get("description") or "").strip()
        if not summary:
            summary = _clean_text(art.get("content") or "").strip()

        published_at = art.get("publishedAt") or None
        articles.append({
            "id": f"{category}-{idx}",
            "title": title,
            "summary": summary,
            "category": label,
            "source": (art.get("source") or {}).get("name") or "Unknown",
            "author": _clean_text(art.get("author") or "").strip(),
            "image": (art.get("urlToImage") or "").strip() or None,
            "url": (art.get("url") or "").strip(),
            "publishedAt": published_at,
            "readTime": _estimate_read_time(f"{summary} {art.get('content') or ''}"),
        })
    return articles
