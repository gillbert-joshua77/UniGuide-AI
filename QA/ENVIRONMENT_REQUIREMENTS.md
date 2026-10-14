# UniGuide AI - Test Environment Requirements (Phase 1)

Purpose: reproduce the exact environment used for this audit and lay out what the test suite needs so it is **isolated, deterministic, and safe** (never touches production).

## 1. Mandatory toolchain (already present — verified)

| Tool | Version | Notes |
|---|---|---|
| Python | 3.13.5 | Only inside `Project Source\.venv` (`Project Source\.venv\Scripts\python.exe`) — no system `python` on PATH |
| Django | 6.1 | In the venv |
| Node.js | v24.14.1 | `node -v` |
| npm | 11.11.0 | |
| MySQL server | (local dev) | Listening on **127.0.0.1:3307**; schema `uniguide_ai`; DB user `root` (has CREATE/DROP — required) |
| Google Chrome/Chromium | — | Needed only if Playwright E2E is added |

All Django commands below assume:
- Working directory: `C:\Users\User\Desktop\College\UniGuide-AI\Project Source\Backend`
- Interpreter: `& "..\.venv\Scripts\python.exe"`

## 2. Backend test environment

### Database
- Use Django's built-in test DB: `manage.py test` auto-creates `test_uniguide_ai_1` against the same MySQL instance and drops it afterwards (verified today).
- **Never** run tests with `DATABASE_URL` pointing at production. Recommended file `.env.test` used via `os.environ` before loading settings, or a run wrapper that exports:
  - `DB_ENGINE=django.db.backends.mysql`, `DB_NAME=uniguide_ai_test`, `DB_USER/DB_PASSWORD/DB_HOST=localhost/DB_PORT=3307`
- Allowed: `--keepdb` for faster iterations (keeps `test_uniguide_ai_*`), then drop manually. Do **not** share this DB between test runs if `--keepdb` is not used.

### Email
- Override `EMAIL_BACKEND=django.core.mail.backends.locmem.EmailBackend` for automation (inspect `django.core.mail.outbox`).
- Real Gmail SMTP is reserved for **manual smoke tests only** and must use a **disposable address** (never real student emails). Gmail also rate-limits; the app must tolerate SMTP failure (currently it does the opposite in spots — see INITIAL_FINDINGS).

### External services — must be stubbed in automation
| Service | Key in `.env` | Rule |
|---|---|---|
| Gemini | `GEMINI_API_KEY` | Patch `ai.services.gemini_client.GeminiService` (pre-made fakes exist in `ai/tests.py`). No live calls — cost/nondeterminism. |
| NewsAPI | `NEWS_API_KEY` | Patch `requests.get` in `ai/views.py`. Live call worked during audit but depends on quota and network. |
| Devpost | (none, public) | Patch `requests.get`. |
| Google OAuth | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Mock `/auth/google/` (stub response), or E2E-intercept the GSI script + credential post. Real Google only for manual smoke. |

### Settings noise to expect
- `.env` currently sets DEBUG → SQL is logged at DEBUG and `manage.py check` prints a `FutureWarning` from `google.generativeai` (deprecated; migrate to `google.genai`).
- Caches (`LOCMEM`) are **per-process**; tests must clear `NEWS_CACHE`/`HACKATHON_CACHE` and the rate-limit cache between test cases or state leaks.

### Known infrastructure quirks to encode in the runner (not bugs in tests)
- `ALLOWED_HOSTS` (settings.py:17) = `['127.0.0.1','localhost']` — add `'testserver'` or set `HTTP_HOST='localhost'` on every API test client call, otherwise every request exits with `DisallowedHost` (first-hand today).
- Media uploads require a working `default` storage (currently missing — F6). After the STORAGES fix, tests must point `MEDIA_ROOT` to a per-run temp dir and clean it.

## 3. Frontend test environment

- Dev server: `npm run dev` → :5173, proxies `/api` → `http://127.0.0.1:8000` (vite.config.js) — E2E can run against it with Django on :8000.
- **`.env` (dev)**: `VITE_API_BASE_URL` — keep unset/`http://localhost:8000/api/v1/` for local E2E; the Vercel dist requires `VITE_API_BASE_URL` be set to the Render URL at build time (vercel.json has no `/api` rewrite).
- Unit tests (to be added): Vitest + RTL + `jsdom`; `axiosInstance.js` tests should mock `localStorage`, `jwt-decode` expiry, and `axios.post(auth/token/refresh/)`.
- E2E: `@playwright/test`. Must:
  - Start `webServer`s: `npm run dev` (frontend) **and** Django (backend, with test DB + stubs).
  - Route-mock `/uniguide/news/*`, `/uniguide/hackathons/*`, `/uniguide/batch/*` and Gemini endpoints via `page.route`.
  - Use Chromium with SwiftShader for the WebGL landing/login canvas (`--use-gl=swiftshader`) or force `prefers-reduced-motion` (GuidanceCore then renders plain SVG — deterministic).
  - Provide a clean `localStorage` per test (`storageState`).
  - Create users via `globalSetup` hitting the public API + OTP row from DB.

## 4. Production vs test isolation checklist

- [ ] `DATABASE_URL` unset during any local test run (or pointed at local MySQL).
- [ ] Test DB names always start with `test_`; never `uniguide_ai`.
- [ ] No real student emails/passwords in fixtures; use `qa_*@example.dev`.
- [ ] External APIs stubbed in CI; live keys only in local manual smoke.
- [ ] `DEBUG=False` + `SECRET_KEY`/JWT secrets only in Render env, never in the repo or the frontend bundle.
- [ ] Nothing installs scripts into the outer git repo; the QA deliverables stay under `Project Source\QA\`.

## 5. Recommended CI (future)

- GitHub Actions (repo: `gillbert-joshua77/UniGuide-AI`), jobs:
  1. **backend**: setup python 3.13 + venv → `pip install -r requirements.txt` → service `mysql:8` on 3307 → `manage.py check` → `manage.py makemigrations --check --dry-run` → `manage.py test` (with `.env.test`).
  2. **frontend lint+build**: `npm ci` → `npm run lint` → `npm run build` → (future) `vitest run`.
  3. **e2e (later)**: same as backend job + `npm ci` + Playwright with mocked third parties.
- Secrets: `DEBUG`, `SECRET_KEY`, `DB_*`, `EMAIL_*`, `GOOGLE_*`, `GEMINI_API_KEY`, `NEWS_API_KEY` via GitHub Environments, scoped to `main`.