"""Isolated settings for the Phase 4A integration-test server.

This module intentionally never reads ``DATABASE_URL``. Importing it runs the
normal settings module (which computes a ``DATABASE_URL``-based default), but
the resulting ``DATABASES`` value is discarded and fully replaced below, so a
production ``DATABASE_URL`` can never leak into an integration run.

The dedicated local MySQL database ``uniguide_ai_e2e`` is the ONLY database
this settings module may ever touch. The development database
``uniguide_ai`` and any production database are off limits. Every database
operation is guarded by the ``e2e_preflight`` management command.
"""
import os

from .settings import *  # noqa: F401,F403
from .settings import BASE_DIR, env  # noqa: F401

# ─── Core ───────────────────────────────────────────────────────────
DEBUG = True
ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 'testserver']

# ─── Isolated test database ────────────────────────────────────────
# Explicit, hard-coded local test target. No OPTIONS.ssl here: the normal
# dev MySQL fallback points at a certs/ca.pem that does not exist in this
# repository, and SSL is not needed for a local socket/loopback connection.
E2E_DB_NAME = 'uniguide_ai_e2e'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': E2E_DB_NAME,
        'USER': env('DB_USER', default='root'),
        'PASSWORD': env('DB_PASSWORD', default='1234'),
        'HOST': '127.0.0.1',
        'PORT': '3307',
        'OPTIONS': {'charset': 'utf8mb4'},
        'TEST': {'NAME': E2E_DB_NAME},
    }
}

# ─── Test-only app that stubs external service boundaries ──────────
INSTALLED_APPS = list(INSTALLED_APPS) + ['e2e.apps.E2EConfig']  # noqa: F405

# ─── Email: file-based only, never SMTP ────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
EMAIL_FILE_PATH = os.environ.get('E2E_MAIL_DIR', str(BASE_DIR / 'e2e_mailbox'))

# ─── Frontend origin used by the integration dev server ────────────
FRONTEND_URL = 'http://127.0.0.1:5175'
for _origin in ('http://127.0.0.1:5175', 'http://localhost:5175'):
    if _origin not in CORS_ALLOWED_ORIGINS:  # noqa: F405
        CORS_ALLOWED_ORIGINS.append(_origin)  # noqa: F405
    if _origin not in CSRF_TRUSTED_ORIGINS:  # noqa: F405
        CSRF_TRUSTED_ORIGINS.append(_origin)  # noqa: F405
