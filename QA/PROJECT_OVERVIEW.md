# UniGuide AI - Project Overview (Phase 1 QA Audit)

> Supersedes the Phase 0 overview. All facts below were independently verified against the repository during the Phase 1 audit (safe, read-only checks; no secrets printed).

## Repository layout

- **Outer git repo** (`C:\Users\User\Desktop\College\UniGuide-AI`): single commit `bdb60e7 "Add UniGuide AI project"`, tracks `Project Source/` as a **nested git repo** (gitlink).
  - There is **no `.gitmodules`** mapping for `Project Source` (`git submodule status` → `fatal: no submodule mapping`). `git status` shows `modified: Project Source (new commits, untracked content)`.
  - Remote of the nested repo: `https://github.com/gillbert-joshua77/UniGuide-AI.git`.
  - The nested repo has `.git`, `.venv`, `Backend`, `Frontend`, `QA/` (untracked; this audit's output lives here).
- Inner repo tip: `01644b0 "Enhance profile, AI chat, My Journey and landing UI; add auth modal"`.

## System snapshot (verified 2026-10-10)

| Component | Value |
|---|---|
| Node / npm | v24.14.1 / 11.11.0 |
| Python (venv only: `Project Source\.venv`) | 3.13.5 |
| Django / DRF / SimpleJWT | 6.1 / 3.18.0 / 5.5.1 |
| React / Vite / react-router-dom | 19.2.4 / 8.0.1 (rolldown) / 7.13.2 |
| Local DB | MySQL (`uniguide_ai` schema, 127.0.0.1:3307, root) — reachable |
| Prod DB / host | PostgreSQL via `DATABASE_URL` (Render) — not reachable from this machine |
| Serving | No Django on :8000, no Vite on :5173 during audit |
| Deploy | Backend: Render (gunicorn + whitenoise); Frontend: Vercel (SPA rewrites only) |

## Backend (Django REST Framework)

- Custom user: `authentication.User` (email login, `is_verified`, JWT) + `OneTimePassword` (5-min expiry).
- INSTALLED_APPS: admin, auth, contenttypes, sessions, messages, staticfiles, `rest_framework`, `rest_framework_simplejwt.token_blacklist`, `corsheaders`, `authentication`, `social_authentication`, `students`, `ai`.
- JWT: access 60 min, refresh 1 day, Bearer auth, no rotation, blacklist app installed.
- Email: Gmail SMTP (TLS 587); `DEFAULT_FROM_EMAIL` and typo-alias `DEFAULTS_FROM_EMAIL` both set (settings.py:160-161).
- Rate limiting: `ai/services/rate_limit.py` — in-memory cache, 30 msgs/hr/user, 3 s min gap; counts posts only.
- Gemini: `ai/services/gemini_client.py` — `gemini-3.5-flash`, 90 s timeout, raises `GeminiError` without key; uses the **deprecated `google.generativeai` SDK** (FutureWarning raised by Django during `manage.py check`; guidance: migrate to `google.genai`).
- Signal `students/signals.py` auto-creates a `StudentProfile` on `User` creation.
- Cache: Django default LocMemCache (per-process) — News/Hackathon in-memory caches similarly per-process.

### API surface (config/urls.py → /api/v1/)

- **auth** (`authentication/urls.py`):
  - `auth/register/` (POST), `auth/verify-email/` (POST, OTP), `auth/login/` (POST, returns tokens+`full_name` property form), `auth/profile/` (GET protected test view), `auth/token/refresh/`, `auth/logout/` (POST blacklist), `auth/resend-otp/`, `auth/otp/resend/`, `auth/otp/verify/`, `auth/change-password/` (POST, protected), `auth/password-reset/` (GET confirm, POST request), `auth/password-reset-confirm/<uidb64>/<token>/`, `auth/set-new-password/` (PATCH).
- **social** (`social_authentication/urls.py`): `auth/google/` (POST access_token; returns JWT pair in body).
- **students** (`students/urls.py`): `students/me/` (GET), `students/profile/` (GET/PUT), `students/skills/` (GET), `students/skills/add/` (POST upsert by name), `students/skills/<pk>/` (DELETE only), `students/saved-opportunities/` (GET/POST), `students/saved-opportunities/<pk>/` (DELETE only), `students/journey/` (GET).
- **ai** (`ai/urls.py`): `uniguide/chat/` (POST send / GET list), `uniguide/chat/sessions/` (POST create), `uniguide/chat/sessions/<uuid>/` (GET/PATCH rename/DELETE), `uniguide/chat/guided-question/` (POST), `uniguide/chat/geographic-data/` (GET, public data, protected), `uniguide/news/` (GET, **public**), `uniguide/hackathons/` (GET, **public**, Devpost proxy).
- `health/` liveness endpoint; `/admin/`.

## Frontend (React + Vite)

- Rooted at `src/`; entry `src/main.jsx` (StrictMode) → `src/App.jsx`.
- **Public routes**: `/`, `/home` (redirect), `/about`, `/login`, `/register`, `/otp/verify`, `/forgetpassword`, `/password-reset-confirm/:uid/:token`, `/auth/callback`.
- **Protected routes** (guarded by `RequireAuth` → opens `AuthModal` when unauthenticated): `/profile`, `/settings`, `/guidance`, `/opportunities`, `/hackathon`, `/news`, `/my-journey`.
- HTTP via `src/Utils/axiosInstance.js` (baseURL from `VITE_API_BASE_URL`; proactive refresh on expiry in the request interceptor; 401 → refresh + retry-once in the response interceptor; FormData keeps browser boundary).
- State: `AuthContext` (auth/profile/skills/saved opportunities), `ThemeContext` (persisted to localStorage `uniguide_theme`, sets `data-theme`).
- Google One-tap: GSI script in `index.html` + `SocialAuthentication.jsx` posts the credential to `/auth/google/`.
- UI: custom `src/Components/ui/*`, framer-motion, react-toastify; login/landing render a **WebGL scene** (`GuidanceCore`, react-three-fiber + drei `<Environment preset>` which fetches an HDR from the network).

## Environment & configuration

- **Frontend `.env` keys**: `VITE_GOOGLE_CLIENT_ID`, `VITE_API_BASE_URL` (present on disk; values not printed here).
- **Backend `.env` keys** (present; values not printed): `SECRET_KEY, DEBUG, ALLOWED_HOSTS, LOG_LEVEL, CORS_ALLOW_ALL_ORIGINS, CORS_ALLOWED_ORIGINS, CSRF_TRUSTED_ORIGINS, FRONTEND_URL, DB_ENGINE, DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, DEFAULT_FROM_EMAIL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SOCIAL_AUTH_PASSWORD, GEMINI_API_KEY, NEWS_API_KEY`.
- `settings.py` defaults: `ALLOWED_HOSTS=['127.0.0.1','localhost']`; CORS allowed: localhost:5173, 127.0.0.1:5173, localhost:3000, `https://uni-guide-ai.vercel.app`; `DEBUG = env('DEBUG', default=False)`.
- Local `.env` enables DEBUG (SQL queries logged at DEBUG), `LOG_LEVEL` drives root+django loggers (default INFO).
- **STORAGES** (settings.py:106-110) defines **only `staticfiles`** — there is **no `default`** storage. Proven defect (see INITIAL_FINDINGS).

## Testing infrastructure (verified)

- **Backend**: 27 Django/DRF tests exist (`students/tests.py` 7, `ai/tests.py` 14 chat + 6 context-builder). Suite is currently **RED** (1 failure + 1 error).
- `authentication/tests.py` and `social_authentication/` have **no tests** (auth, OTP, password reset are uncovered — largest risk area).
- **Frontend**: `npm run lint` (currently 36 errors + 1 warning), `dev`, `build`, `preview` only. **No test script, no Playwright/Vitest/Jest** anywhere outside node_modules; `scripts/color-lint.mjs` only.
- **No CI** config in either repo (no `.github/workflows`).
- `strict`-mode facts: `manage.py check` → clean; `npm run build` → OK (4.46 s, chunk warning: 1.64 MB JS / 466 KB gzip + 2.2 MB PNG).