"""Gemini integration service.

Wraps the existing google.generativeai integration so views stay thin,
errors are handled consistently, and secrets are never logged.
"""

import logging
import re

from django.conf import settings

import google.generativeai as genai

logger = logging.getLogger('uniguide.ai')

MODEL_NAME = 'gemini-2.5-flash'
REQUEST_TIMEOUT_SECONDS = 90
TITLE_REQUEST_TIMEOUT_SECONDS = 10


class GeminiError(Exception):
    """Raised when Gemini cannot produce a reply."""


class GeminiService:
    """Thin wrapper around the Gemini API for UniGuide chat."""

    def __init__(self, api_key=None, model_name=MODEL_NAME):
        self.api_key = api_key or getattr(settings, 'GEMINI_API_KEY', '')
        self.model_name = model_name
        if not self.api_key:
            logger.error('GEMINI_API_KEY is not configured')
            raise GeminiError('Gemini API key is not configured on the server')

    def _build_model(self, system_instruction):
        genai.configure(api_key=self.api_key)
        return genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=system_instruction,
        )

    def generate_reply(self, message, history, system_instruction):
        """Send a message to Gemini with the given history and return text."""
        if not message or not message.strip():
            raise GeminiError('Message cannot be empty')

        request_options = {'timeout': REQUEST_TIMEOUT_SECONDS}

        try:
            model = self._build_model(system_instruction)
            chat = model.start_chat(history=history or [])
            response = chat.send_message(
                message,
                request_options=request_options,
            )
        except GeminiError:
            raise
        except Exception as exc:
            # Log the failure type only; never log API keys or full payloads.
            logger.warning(
                'Gemini request failed for model=%s error=%s:%s',
                self.model_name,
                type(exc).__name__,
                exc,
            )
            raise GeminiError('Gemini is unavailable right now. Please try again.') from exc

        try:
            text = (response.text or '').strip()
        except Exception as exc:
            logger.warning(
                'Gemini returned an unusable response error=%s:%s',
                type(exc).__name__,
                exc,
            )
            raise GeminiError('Gemini returned an empty response. Please try again.') from exc

        if not text:
            raise GeminiError('Gemini returned an empty response. Please try again.')
        return text

    def generate_title(self, user_message, ai_reply):
        """Generate a short 3-5 word title for a new conversation.

        Uses the same Gemini integration with a lightweight, single-turn
        prompt so the full conversation is never sent. Returns None (never
        raises) when a title cannot be produced so chat is never blocked.
        """
        if not user_message or not ai_reply:
            return None

        prompt = (
            'Write a concise title of 3 to 5 words that summarizes this '
            'student guidance conversation.\n\n'
            f'Student: {user_message}\n'
            f'UniGuide AI: {ai_reply}\n\n'
            'Reply with only the title. Do not add quotes, punctuation, or '
            'any explanation.'
        )
        request_options = {'timeout': TITLE_REQUEST_TIMEOUT_SECONDS}

        try:
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(model_name=self.model_name)
            response = model.generate_content(
                prompt,
                request_options=request_options,
            )
            text = (response.text or '').strip()
        except Exception as exc:
            logger.warning(
                'Gemini title generation failed error=%s:%s',
                type(exc).__name__,
                exc,
            )
            return None

        if not text:
            return None
        text = re.sub(r'["\'\*]', '', text).strip()
        words = text.split()
        if len(words) > 8:
            text = ' '.join(words[:8])
        return text[:120]
