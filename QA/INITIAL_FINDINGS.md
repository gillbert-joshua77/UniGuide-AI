# UniGuide AI - Initial Findings (Phase 1 QA Audit)

Audit date: 2026-10-10 · Auditor mode: read-only/safe checks only · No application code modified.

This audit supersedes/corrects `INITIAL_STATE_REPORT.txt` (Phase 0). Notably, Phase 0 claimed "testing infrastructure: none" — **27 backend tests exist and run** (a red suite), and `npm run lint`/`npm run build` are wired (lint is red, build is green).

---

## 1. Evidence collected (exact commands + outcomes)

| Command | Outcome |
|---|---|
| `manage.py check` (venv 3.13.5, Backend/) | `System check identified no issues (0 silenced).` + `FutureWarning: All support for the google.generativeai package has ended...` → migrate to `google.genai`. Runs against local MySQL (issued `SELECT VERSION()`). |
| `manage.py test --verbosity=2` | 27 tests discovered, migrations applied to `test_uniguide_ai_1`, **suite RED**: 1 FAILURE + 1 ERROR. |
| `npm run lint` (Frontend/) | **36 errors + 1 warning** (unused imports `motion`/`fadeIn`/`slideInLeft`/`i`, react-refresh export rules in `AuthContext.jsx:201` and `ThemeContext.jsx:40`). |
| `npm run build` | Success (4.46 s). Warning: `index-*.js` 1,640.69 kB (gzip 466.29 kB) + PNG 2,245.78 kB — chunk >500 kB, no code-splitting. |
| `grep playwright|vitest|jest|cypress` (repo-wide, excluding node_modules/dist/`.venv`) | **None.** No frontend unit or E2E tooling. |
| Git: `submodule status` / `.gitmodules` | Inner `Project Source\` is a **nested git repo** with **no `.gitmodules` mapping** (outer `git status` → `modified: Project Source (new commits, untracked content)`). |
| Isolated API probe (throwaway `test_uniguide_ai_1` DB, temp script — dropped after) | See §3 GREEN/FAIL rows. Never touches dev/prod data. |

## 2. Confirmed defects (reproduced / proven by execution)

Priority: **P1 = blocks users, needs fix + regression test first.**

| # | Priority | Defect | Evidence / Root cause |
|---|---|---|---|
| 1 | **P1** | **Profile picture upload → 500** | Existing test `students.tests.StudentProfileAPITests.test_profile_picture_persists_after_form_save` ERRORED: `InvalidStorageError: Could not find config for 'default' in settings.STORAGES`. Root cause: `config/settings.py:106-110` defines `STORAGES` with only `staticfiles`, no `default`. Affects any media write (`ProfilePictureField` in `students/serializers.py:6-26`). |
| 2 | **P1** | **First API request after token expiry hangs forever** | `Frontend/src/Utils/axiosInstance.js:73-82`: the request that initiates a refresh subscribes (line 79-81) **after** `onTokenRefreshed(newAccess)` flushed subscribers (line 77), so its Promise never resolves → request never sent, UI spinner hangs; the 401/retry path can't rescue it. Same class of risk at axiosInstance.js:104-106. Unit-testable; needs runtime reproduction in Phase 2. |
| 3 | **P1** | **Saving an opportunity can 500** | Reproduced in isolated probe: `POST /students/saved-opportunities/` with `opportunity_id` as number → `AttributeError: 'int' object has no attribute 'strip'` (@ `students/views.py:125`). Frontend currently wraps with `String(h.id)` (Opportunities.jsx:107), so today's UI path is safe — but any int payload 500s. |
| 4 | **P2** | **Every user turn is sent to Gemini twice** | `ai/views.py:86-100` persists `user_msg`, then `build_chat_history()` includes it AND `generate_reply(message…)` → `chat.send_message(message)` appends it again. Docstring `ai/services/context_builder.py:712-718` claims the opposite and is stale. Wasteful tokens + degrading responses. |
| 5 | **P2** | **Existing test suite is red** | `ai.tests.ChatAPITests.test_send_message_creates_session`: `AssertionError: 'Smart title' != 'hello'` — test written for pre-smart-title behavior; not updated when the title feature shipped. Also #1 (the ERROR). |
| 6 | **P2** | **Frontend lint is red (36 errors + 1 warning)** | Unused imports and `react-refresh/only-export-components` (`AuthContext.jsx`, `ThemeContext.jsx` export non-component values). Blocks adding lint as a CI gate until fixed. |
| 7 | **P3** | **UI logout does not blacklist the refresh token** | `AuthContext.logout()` (AuthContext.jsx:157-166) only clears localStorage; never calls `POST /api/v1/auth/logout/`. The refresh token stays valid for up to 1 day — logout is cosmetic at the API layer. |
| 8 | **P3** | **OTP endpoint enables unauthenticated brute force** | `authentication/views.py:50-56`: `verify-email`/`otp/verify` accept a **code with no email and no auth** (global `OneTimePassword.objects.get(code=…)`). No attempt throttling/lockout. Codes come from `random.randint(1,9)` (utils.py) → 9^6=531,441 guesses in the 5-min TTL; `random` not `secrets`. |
| 9 | **P3** | **Password-reset email claims 10-minute expiry; token actually lasts 3 days** | `authentication/serializers.py:137` ("expire in 10 minutes") vs Django default `PASSWORD_RESET_TIMEOUT` = 3 days. Claim is stricter than reality. |
| 10 | **P3** | **SMTP failure handling is inconsistent** | register: `except Exception: pass` yet responds "a passcode was sent" (views.py:25-33) — false success. `resend-otp/` (views.py:188) and `password-reset/` (serializer `send_normal_email`, serializers.py:146) are **uncovered → 500** when SMTP fails. |
| 11 | **P3** | **`/uniguide/hackathons/?page=abc` → 500** | `ai/views.py:471` `int(query_params.get('page'))` executes before the try/except; `ValueError` uncaught. |
| 12 | **P3** | **Dead code / misleading surface** | `social_authentication/pipeline.py` `redirect_with_token` + frontend `/auth/callback` (`AuthCallback.jsx`) are unreachable: no social-auth app installed; GoogleSignInView returns tokens in the POST body. If ever wired, it would place access+refresh tokens in the URL query string. |
| 13 | **P3** | **`Application` feature has no write API** | `students.models.Application` + serializer exist; journey returns `applications` but **no endpoint creates/updates them** → MyJourney "Applications" is always empty. |
| 14 | **P3** | **Deprecated Gemini SDK in use** | `ai/services/gemini_client.py` imports `google.generativeai` (deprecated; FutureWarning at check). Model `gemini-3.5-flash`, 90 s timeout. |
| 15 | **P3** | **Repo hygiene** | `Project Source` is an unmapped nested git repo; `QA/` untracked inside it. Root `Project Source/manage.py` sets `config.settings` which is only importable from `Backend/` (untested — likely fails from repo root). |

### Bundle/performance note
- JS chunk 1.64 MB + 2.2 MB PNG; `Build chunk >500 kB` warning. Worth manual route-level code-splitting later (not a correctness defect).

## 3. Verified working today (so the suite has regression anchors)

Probes executed live against an isolated throwaway DB with a real auth flow:

- Register → 201 and message about the passcode; login before verification → 401 `"Email is not verified"` (Phase 0 claim confirmed); verify with correct OTP (200) / wrong OTP (404); login after verification → 200 with tokens and `full_name` (the `get_full_name` value is a `@property`, so serialization is fine).
- `TestAuthenticationView` (protected `/auth/profile/`) → 200 with token, 401 without.
- Students: `me/` 200 (profile auto-created, `profile_completion`), unauthenticated `me/` → 401. `profile/` PUT 200 (incl. name write-through). Skills add 201; duplicate (case-insensitive) 200 upsert single row; cross-user skill delete (real pk) → 404. Saved opportunities delete-by-other → 404; change-password wrong old → 400; set-new-password garbage token → 401; password-reset for nonexistent email → 200 (no enumeration); resend-otp for verified user → 400 `"User already verified"`; journey → 200.
- News: live `GET /api/v1/uniguide/news/` → 200, 82 deduped articles (key + network available). News/hackathon caches are in-process and must be purged in tests.
- Existing green tests cover: profile CRUD + isolation, chat auth/ownership/session CRUD/rollback/rate-limit/empty-message/system-instruction, context-builder mapping.

## 4. Coverage gaps (no tests today)

| Area | Risk |
|---|---|
| `authentication/` whole app (register, login, OTP, change/reset password, logout blacklist, resend) | **Highest** — every auth endpoint untested |
| `social_authentication/` (Google) | Untested (also dead pipeline) |
| Saved-opportunities create/list/isolation (only delete verified) | Medium |
| News / hackathons (mocked + error paths) | Medium |
| Guided-question / geographic-data | Medium |
| Frontend unit + E2E | **Zero today** |
| CI | None |

## 5. Recommended immediate next steps (in order)

1. **Fix P1 #1** (add `'default'` storage) — unblocks `test_profile_picture_persists_after_form_save`, the existing test becomes a regression anchor.
2. **Fix P1 #2** (axios refresh ordering) with a unit test; manually reproduce the hang once before fixing (expire token, send one GET, observe hung request).
3. **Fix P2 #3** (`opportunity_id` → force `str()` at students/views.py:125) + add H2 test.
4. **Reconcile the red ai test** (#5): decide feature-vs-test intent, update assertion, add a regression case for smart-title.
5. **Write the `authentication/tests.py` suite** per TEST_CASES.md §A-D; run full `manage.py test` (expect green) — this is likely the largest single win.
6. Address P2 #4 (history build before persisting newest user message; or exclude newest user turn).
7. Later: frontend Vitest for `axiosInstance`/`AuthContext`, then Playwright E2E (all third parties mocked) per TEST_STRATEGY.md.

## 6. Out of scope / not verified in Phase 1

- Real Google OAuth consent flow and live Gmail delivery (manual, disposable accounts).
- Production (Render/Vercel) configuration and Postgres behavior (not reachable from here).
- Live Gemini answer quality and deterministic LLM outputs (future prompt-eval harness).
- Performance profiling beyond the Vite chunk warning.