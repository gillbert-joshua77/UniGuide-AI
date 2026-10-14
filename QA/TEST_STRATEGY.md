# UniGuide AI - Test Strategy (Phase 1)

## 1. Goals

1. Ship a regression suite that catches the defects already found (media 500s, smart-title/red suite, saved-opportunity int crash, chat-history duplication).
2. Cover the uncovered high-risk area: **authentication** (register → OTP → login → refresh → logout blacklist → password reset/change).
3. Establish an isolated, repeatable environment (never production).
4. Provide an E2E layer once the API contract is green (Playwright), because the frontend has **zero** automated tests today.

## 2. Testing layers (in priority order)

### Layer A — DRF API tests (fast, existing infrastructure) — **first**

- Runner: Django's own `DiscoverRunner` (`manage.py test`), already proven working against local MySQL (it creates/drops `test_uniguide_ai_1` per run; the local MySQL user has CREATE privilege — verified today).
- Style: `django.test.APIClient` with `content_type='application/json'`, `HTTP_HOST='localhost'`.
  - **Note**: `ALLOWED_HOSTS` does not include `testserver`; either `APIClient(SERVER_NAME='localhost')` or set `HTTP_HOST='localhost'` (found empirically during this audit — without it every request returns a `DisallowedHost` 500).
- Location: `Backend/<app>/tests*.py` (follows existing convention; `authentication/tests.py` is an empty stub waiting to be filled).
- Rules:
  - Every test creates its own user (random email) and verifies it (`is_verified=True` or via `POST /auth/otp/verify/` with the `OneTimePassword` row fetched from the DB, never from SMTP).
  - Cross-user isolation assertions on every CRUD endpoint (two users A/B).
  - Never assert against real external services: patch `GeminiService` (`FakeGeminiService` already exists in `ai/tests.py`), patch `requests.get`, patch `send_code_to_user`/`send_normal_email` (or use `django.core.mail.outbox` with `EMAIL_BACKEND` override).
  - Expected-status table per endpoint (200/201/204/400/401/403/404/409/429/500) documented in TEST_CASES.md.

### Layer B — Frontend unit tests (new, optional-to-A)

- Tooling: Vitest + React Testing Library (must be added — nothing exists today). Coverage targets:
  - `axiosInstance.js` refresh/subscriber logic (the hang race at `axiosInstance.js:73-82` is unit-testable with a fake timer + mocked `axios.post`).
  - `AuthContext` reducers (profile load failure → `isAuthed=false`, saved-opportunities array shape).
  - Small pure helpers (`lib/motion.js`, skill percentage mapping in `Profile.jsx`).
- **Blocked on**: adding vitest to `package.json` (a code change; out of scope for the audit phase).

### Layer C — E2E (Playwright, browser) — **after A is green**

- Install `@playwright/test` + a `webServer` config that boots:
  - `npm run dev` (:5173, proxy `/api` → :8000 works out of the box), and
  - `python manage.py runserver 8000` with a **separate test DB** and mock layer.
- Mock policy: `page.route()` for `*/uniguide/news/*`, `*/uniguide/hackathons/*`, `*/auth/google/*`, and `*/uniguide/chat/*` (Gemini) — never call real third parties from CI.
- Test users created through the public API in `globalSetup` with random emails (`qa+<uuid>@example.dev`); password reset/OTP flows read the `OneTimePassword` row / `django.core.mail.outbox` rather than real mail.
- Browser config must account for the **WebGL login/landing canvas** (`GuidanceCore`): run Chromium with `--use-gl=swiftshader` or rely on its built-in software renderer, and honor `prefers-reduced-motion` (the component falls back to an SVG when set — an easy, deterministic hook for tests).

## 3. Environment isolation rules (hard requirements)

| Concern | Rule |
|---|---|
| Database | Always the auto-created `test_uniguide_ai_*` on local MySQL; never the dev `uniguide_ai` schema, never the Render/Postgres `DATABASE_URL` — unset `DATABASE_URL` or point it at local MySQL for all test runs. |
| Email | Override `EMAIL_BACKEND` to `django.core.mail.backends.console.EmailBackend` (or `locmem`) in tests; Gmail SMTP is only for manual smoke tests with a disposable address. |
| Gemini | Always patch `ai.services.gemini_client.GeminiService` (existing fake classes in `ai/tests.py`). Real key usage costs money and is non-deterministic. |
| News / Devpost | Always patch `requests.get`; also note in-process caches (`NEWS_CACHE`, `HACKATHON_CACHE`, rate-limit cache) must be cleared between tests or results leak across cases. |
| Users | Synthetic accounts only (`qa_*@example.dev`); no real student identities, no production data. |
| Frontend storage | E2E tests must start from a clean `localStorage` (accessToken/refreshToken/`uniguide_*`). |
| Production | Nothing ever points at `uni-guide-ai.vercel.app` or the Render URL. |

## 4. What is manual / exploratory

- Visual layout, typography, responsive behavior at 375/768/1440.
- Real Gmail delivery and Google One-tap consent screens (needs real OAuth client + browser session).
- WebGL rendering quality (`GuidanceCore`), `prefers-reduced-motion` fallback.
- Accessibility pass (axe.io can be automated later; keyboard-only navigation for the OTP boxes is manual now).
- LLM response quality/drift (prompt correctness cannot be asserted by unit tests).

## 5. Entry/exit criteria

- **Entry**: `manage.py check` clean; local MySQL up; test DB user has CREATE/DROP.
- **Exit for the API suite**: all existing 27 tests green + new auth suite green; zero 500s on documented error paths.
- **Exit for E2E**: critical journeys pass 3 consecutive runs with no console errors (except known external-service messages).

## 6. Test priorities (risk-weighted)

1. **P0**: register/verify/login/refresh/logout-blacklist, profile GET/PUT, saved-opportunities create/delete + isolation, media upload (currently broken).
2. **P1**: password reset + change password, OTP expiry/resend, chat session ownership + rollback on Gemini failure + rate limit, skills upsert/delete/isolation.
3. **P2**: news/hackathons proxy (mocked), guided-question flow (mocked), journey aggregation, settings UX, loading/empty/error states.
4. **P3**: cross-browser/a11y/performance, lint/build gates in CI.
