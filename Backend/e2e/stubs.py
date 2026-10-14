"""Deterministic replacements for external service boundaries.

These are installed only under ``config.settings_e2e`` (via
``E2EConfig.ready``). They replace module-level symbols that ``ai.views``
already references, so no real network call can happen during an integration
run. The Phase 4A journey does not exercise chat or news at all; these
stubs exist purely so incidental requests (e.g. the My Journey page's
recommended-opportunities fetch) can never leave the machine.
"""
import json

_DISABLED_URL = 'http://127.0.0.1:0/e2e-disabled'


class FakeGeminiService:
    """Stand-in for ``ai.services.gemini_client.GeminiService``."""

    def __init__(self, *args, **kwargs):
        pass

    def generate_reply(self, message, history, system_instruction):
        return 'Deterministic E2E reply from the fake Gemini service.'

    def generate_guided_question(self, prompt):
        return json.dumps({'status': 'complete', 'question': None})

    def generate_title(self, user_message, ai_reply):
        return 'E2E Chat'


class _FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


class FakeRequests:
    """Stand-in for the ``requests`` module used by ``ai.views``."""

    def get(self, url, *args, **kwargs):
        if 'hackathons' in url:
            return _FakeResponse({'hackathons': []})
        if 'news' in url or 'everything' in url:
            return _FakeResponse({'status': 'ok', 'articles': []})
        return _FakeResponse({})


def install_stubs():
    from ai import views as ai_views

    ai_views.GeminiService = FakeGeminiService
    ai_views.requests = FakeRequests()
    ai_views.NEWSAPI_BASE = _DISABLED_URL
    ai_views.DEVPOST_API = _DISABLED_URL
