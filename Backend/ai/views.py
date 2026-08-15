import time
import re
import requests

from django.shortcuts import render
from .models import *
# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
import google.generativeai as genai  # ✅ Add this    
from django.conf import settings

SYSTEM_PROMPT = """You are UniGuide AI, an intelligent, friendly, and motivating assistant helping students navigate their education, career, and study abroad journeys.

🎯 Your Core Responsibilities:
- Suggest universities based on budget, skills, and country preferences.
- Provide clear, step-by-step guidance for studying abroad.
- Recommend scholarships, internships, and hackathons.
- Assist with SOPs, resumes, and career roadmaps.

✨ Communication Rules (Strictly Follow):
- Bite-Sized Delivery: Avoid long walls of text. If the user asks for a complex roadmap, provide a brief, high-level summary of the steps first, then ask which specific step they want to dive deeper into.
- Clean Formatting: Use bullet points and short sections. Use properly indented markdown for nested lists (e.g., use '-' with spaces for sub-bullets) so it renders perfectly on the frontend. 
- Emoji Integration: Format responses using emojis for visual structure (e.g., 🎓 Universities, 💰 Fees, 📍 Location, 📌 Requirements, 🚀 Next Steps).
- Personalization: Tailor your advice contextually based on the user's profile and previous messages.
- The Conversational Engine: ALWAYS end your response with a single, specific, and engaging follow-up question to keep the conversation moving forward (e.g., "What year of your degree are you currently in?" or "Does that budget align with what you were planning?")."""

class UniGuideChatView(APIView):

    def post(self, request):
        messages  = request.data.get('messages', [])
        user_msg  = request.data.get('message', '')
        session_id = request.data.get('session_id', None)

        if not user_msg:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Retrieve or create chat session for persistence
            if session_id:
                session, _ = ChatSession.objects.get_or_create(id=session_id)
            else:
                session = ChatSession.objects.create()

            # Save user message
            ChatMessage.objects.create(
                session=session,
                role='user',
                content=user_msg
            )

            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(
                model_name='gemini-2.5-flash',
                system_instruction=SYSTEM_PROMPT
            ) 


            history = []
            for msg in messages:
                if msg.get('role') == 'user':
                    history.append({
                        'role': 'user',
                        'parts': [msg.get('content', '')]
                    })
                elif msg.get('role') in ['assistant', 'model']:
                    history.append({
                        'role': 'model',
                        'parts': [msg.get('content', '')]
                    })

            chat = model.start_chat(history=history)
            response = chat.send_message(user_msg)
            reply = response.text

            # Save assistant reply
            ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=reply
            )

            return Response(
                {
                    'session_id': str(session.id),
                    'reply': reply,
                    'status': 200,
                    'message': 'Success'
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ChatHistoryView(APIView):
    def get(self, request, session_id):
        try:
            session = ChatSession.objects.get(id=session_id)
            messages = session.chat_messages.all()
            data = [{"role": m.role, "content": m.content, "timestamp": m.timestamp} for m in messages]
            return Response(data, status=status.HTTP_200_OK)
        except ChatSession.DoesNotExist:
            return Response({"error": "Chat session not found"}, status=status.HTTP_404_NOT_FOUND)

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