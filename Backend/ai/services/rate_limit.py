"""Simple per-user rate limiting for chat requests.

Uses Django's default in-memory cache. No extra infrastructure needed.
Suitable for single-process development; note limits are per process.

Limits can be tuned with settings:
  CHAT_MAX_MESSAGES        - messages allowed per window (default 30)
  CHAT_RATE_WINDOW_SECONDS - window length (default 3600)
  CHAT_MIN_GAP_SECONDS     - minimum gap between messages (default 3)
"""

import time

from django.conf import settings
from django.core.cache import cache


class RateLimitExceeded(Exception):
    def __init__(self, message, retry_after):
        super().__init__(message)
        self.retry_after = retry_after


def _limits():
    return (
        int(getattr(settings, 'CHAT_MAX_MESSAGES', 30)),
        int(getattr(settings, 'CHAT_RATE_WINDOW_SECONDS', 3600)),
        int(getattr(settings, 'CHAT_MIN_GAP_SECONDS', 3)),
    )


def check_chat_rate_limit(user):
    """Raise RateLimitExceeded if the user is above their chat quota."""
    if not user or not user.is_authenticated:
        return

    max_messages, window_seconds, min_gap_seconds = _limits()

    user_key = f'uniguide_chat_count_{user.id}'
    last_key = f'uniguide_chat_last_{user.id}'
    start_key = f'{user_key}_start'

    now = time.time()
    count = cache.get(user_key, 0)
    last = cache.get(last_key, 0)

    if last and (now - last) < min_gap_seconds:
        retry_after = int(min_gap_seconds - (now - last))
        raise RateLimitExceeded(
            'You are sending messages too quickly. Please slow down.',
            retry_after,
        )

    if count >= max_messages:
        start = cache.get(start_key, now)
        retry_after = int(window_seconds - (now - start))
        raise RateLimitExceeded(
            'You have reached your chat message limit for this hour. Please try again later.',
            max(1, retry_after),
        )

    cache.set(last_key, now, timeout=window_seconds)

    if count == 0:
        cache.set(start_key, now, timeout=window_seconds)
    cache.set(user_key, count + 1, timeout=window_seconds)
