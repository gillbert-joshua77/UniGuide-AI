"""Deterministic replacements for external service boundaries.

These are installed only under ``config.settings_e2e`` (via
``E2EConfig.ready``). They replace module-level symbols that ``ai.views``
already references, so no real network call can happen during an integration
run. They also provide deterministic fixtures: the hackathon proxy returns a
fixed list of hackathons so the Opportunities and My Journey pages exercise
the real backend normalization without ever contacting Devpost.
"""
import json

from ai.services.gemini_client import GeminiError

# Local, unreachable sentinels. ``ai.views`` uses these constants to build the
# upstream URL; because the whole ``requests`` module is replaced below, no
# network call is ever made. The path fragments are what ``FakeRequests``
# matches on, so they must stay distinct per upstream service.
_NEWS_URL = 'http://127.0.0.1:0/e2e-news'
_HACKATHON_URL = 'http://127.0.0.1:0/e2e-hackathons'

# Raw Devpost-shaped hackathons. ``ai.views.HackathonView`` normalizes these
# into the {total, page, hackathons:[...]} contract the frontend consumes, so
# the fixtures must use the upstream field names (organization_name,
# open_state, displayed_location, submission_period_dates, prize_amount,
# registrations_count, themes, thumbnail_url, featured). At least one open,
# one upcoming, and one ended example; ids deliberately mix numeric (27282)
# and string ("ocean-2027") types to exercise id normalization downstream.
_HACKATHONS = [
    {
        'id': 27282,
        'title': 'Genesis AI Hackathon',
        'url': 'https://genesis-ai.devpost.com',
        'organization_name': 'Genesis Labs',
        'open_state': 'open',
        'displayed_location': {'location': 'Online'},
        'submission_period_dates': 'Jan 15, 2027',
        'prize_amount': '$10,000',
        'registrations_count': 1200,
        'themes': [{'name': 'AI'}, {'name': 'Machine Learning'}],
        'thumbnail_url': 'https://genesis-ai.devpost.com/thumb.png',
        'featured': True,
    },
    {
        'id': 'ocean-2027',
        'title': 'Hack the Ocean',
        'url': 'https://hack-the-ocean.devpost.com',
        'organization_name': 'Ocean Network',
        'open_state': 'upcoming',
        'displayed_location': {'location': 'Hybrid'},
        'submission_period_dates': 'Feb 1, 2027',
        # Includes markup on purpose so the real HTML-stripping normalization
        # in HackathonView is exercised (-> "$5,000 pool").
        'prize_amount': '$5,000 <span>pool</span>',
        'registrations_count': 340,
        'themes': [{'name': 'Sustainability'}],
        'thumbnail_url': '',
        'featured': False,
    },
    {
        'id': '33001',
        'title': 'Code for Good',
        'url': 'https://code-for-good.devpost.com',
        'organization_name': 'Good Corps',
        'open_state': 'ended',
        'displayed_location': {'location': 'Offline'},
        'submission_period_dates': 'Dec 1, 2026',
        # Empty upstream prize -> the normalized "TBA" default.
        'prize_amount': '',
        'registrations_count': 80,
        'themes': [{'name': 'Social Impact'}],
        'thumbnail_url': 'https://code-for-good.devpost.com/thumb.png',
        'featured': False,
    },
]


# Any message containing this sentinel makes the fake provider behave like an
# unavailable Gemini: ``generate_reply`` raises the real ``GeminiError`` so the
# genuine 502 + rollback path in ``ai.views`` is exercised. Test-only.
FAILURE_SENTINEL = '__e2e_gemini_failure__'


class FakeGeminiService:
    """Stand-in for ``ai.services.gemini_client.GeminiService``.

    The reply is a deterministic, parseable function of the exact inputs the
    view passes in, so an integration test can assert both the rendered answer
    and (via ``history_turns``/``repeated_current``) that the just-sent user
    turn was not duplicated inside the conversation history.
    """

    def __init__(self, *args, **kwargs):
        pass

    def generate_reply(self, message, history, system_instruction):
        if FAILURE_SENTINEL in (message or ''):
            raise GeminiError('E2E injected Gemini failure')

        history = history or []
        history_parts = [
            part for turn in history for part in turn.get('parts', [])
        ]
        repeated = message in history_parts
        return (
            f'E2E test answer to "{message}". '
            f'[history_turns={len(history)} '
            f'repeated_current={str(repeated).lower()}]'
        )

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
    """Stand-in for the ``requests`` module used by ``ai.views``.

    Returns deterministic payloads for the hackathon proxy and an empty news
    feed. It never performs I/O.
    """

    def get(self, url, *args, **kwargs):
        if 'hackathons' in url:
            return _FakeResponse({'hackathons': _HACKATHONS})
        if 'news' in url or 'everything' in url:
            return _FakeResponse({'status': 'ok', 'articles': []})
        return _FakeResponse({})


def install_stubs():
    from ai import views as ai_views

    ai_views.GeminiService = FakeGeminiService
    ai_views.requests = FakeRequests()
    # Local sentinels keep the URL-routing above unambiguous while remaining
    # unreachable, so even if a stub were bypassed nothing could leave the box.
    ai_views.NEWSAPI_BASE = _NEWS_URL
    ai_views.DEVPOST_API = _HACKATHON_URL
