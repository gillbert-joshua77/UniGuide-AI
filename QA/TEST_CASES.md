# UniGuide AI - Test Cases (Phase 1 baseline)

- **Status legend**: `CONFIRMED` = defect already reproduced in this audit (these cases should fail today); `NEW` = coverage gap; `GREEN` = verified working today.
- **Auth setup**: most cases need a verified user. API tests: create user → set `is_verified=True` (or verify via OTP row) → `RefreshToken.for_user(user)` for the Bearer header. E2E: `page.route()` to stub Gemini/News/Devpost; read OTP from DB for the real register flow.
- All API runs: `HTTP_HOST='localhost'` (ALLOWED_HOSTS lacks `testserver`).

---

## A. Register / Login / Email verification

| ID | Case | Type | Steps / Input | Expected | Status |
|---|---|---|---|---|---|
| A1 | Register happy path | API | POST `auth/register/` valid payload | 201, `data.email` echoed, message mentions passcode | GREEN (verified) |
| A2 | Password mismatch | API | `password != password2` | 400 `"password do not match"` | NEW |
| A3 | Short password (<6) | API | `password='abc'` | 400 field error | NEW |
| A4 | Duplicate email | API | register twice, same email | 400 unique-email error, second user NOT created | NEW |
| A5 | Missing/invalid fields | API | no `email` / bad email / no names | 400 | NEW |
| A6 | **SMTP down but 201 + "passcode was sent"** | API | patch `send_code_to_user` to raise | 201 and success message still returned (views.py:25-28 swallows) — user told an email exists that was never sent | **CONFIRMED (code)** |
| A7 | Login before verification | API | login right after register | 401 `"Email is not verified"` | GREEN (verified) |
| A8 | Login after verification | API | verify OTP, then login | 200 + `access_token`/`refresh_token`/`full_name`/`email` | GREEN (verified) |
| A9 | Wrong password | API | correct email, wrong password | 401 `"Invalid credentials, try again"` | NEW |
| A10 | Unknown email | API | login for nonexistent user | 401 (no user enumeration) | NEW |
| A11 | Login rate limiting / lockout | API | 20 rapid wrong-password attempts | throttled/429 (currently **absent** — document actual behavior) | NEW (risk) |
| A12 | E2E register→verify→login→land on /profile | E2E | real UI flow, OTP read from DB | profile loads, navbar shows initials | NEW |
| A13 | E2E duplicate registration UI error surfacing | E2E | register with existing email | DRF message shown (not swallowed) | NEW |

## B. OTP generation / expiry / resend / verify

| ID | Case | Type | Steps / Input | Expected | Status |
|---|---|---|---|---|---|
| B1 | Verify with correct code | API | read `OneTimePassword`, POST `auth/otp/verify/` | 200, `is_verified=True`, row deleted | GREEN (verified) |
| B2 | Wrong code | API | `otp='000000'` | 404 `"Invalid OTP or email"`, user still unverified | GREEN (verified) |
| B3 | Missing OTP | API | no `otp` | 400 | NEW |
| B4 | Expired code (>5 min) | API | freeze/create old row, verify | 400 `"OTP has expired..."`, row deleted | NEW |
| B5 | **Code-only verify without email/auth** | API | POST `{'otp': <any live code>}`, no email, unauthenticated | currently succeeds for **any** user's code (views.py:56 global fallback) | **CONFIRMED (code)** |
| B6 | Brute-force surface | API | 500 wrong attempts in 5 min | today: no lockout/throttle; 9^6 keyspace (`random.randint(1,9)`, no zero) | **CONFIRMED (code)** |
| B7 | Resend for unverified user | API | POST `auth/resend-otp/` | 200, new code replaces old (update_or_create) | NEW |
| B8 | Resend for verified user | API | resend to verified | 400 `"User already verified"` | GREEN (verified) |
| B9 | Resend unknown email | API | random email | 404 `"User not found"` (minor enumeration) | NEW |
| B10 | Resend when SMTP down | API | patch mail to raise | today: unhandled 500 | **CONFIRMED (code)** |
| B11 | OTP UI: 6 boxes, auto-advance, invalid char rejection, resend timer (60 s) | E2E | `/otp/verify` | boxes behave; success navigates `/login` | NEW |
| B12 | New OTP invalidates previous | API | verify old code after resend | 404 | NEW |

## C. Password reset / change password / logout

| ID | Case | Type | Steps / Input | Expected | Status |
|---|---|---|---|---|---|
| C1 | Reset request for existing user | API | POST `auth/password-reset/` (patch mail to capture body) | 200, link `{FRONTEND_URL}/password-reset-confirm/{uid}/{token}/`, email claims **10-minute** expiry | NEW |
| C2 | Reset link actual expiry | API | token accepted after >10 min but < `PASSWORD_RESET_TIMEOUT` | today: accepted (Django default 3 days) → **email claim ≠ reality** | **CONFIRMED (code)** |
| C3 | Reset request unknown email | API | random email | 200 same message (no enumeration) | GREEN (verified) |
| C4 | Reset when SMTP down | API | patch mail to raise | today: unhandled 500 | **CONFIRMED (code)** |
| C5 | Confirm GET valid token | API | `password-reset-confirm/<uid>/<token>/` | 200 `{success, uidb64, token}` | NEW |
| C6 | Confirm GET tampered/expired token | API | bad token / bad uid | 401 | NEW |
| C7 | Set new password | API | PATCH `set-new-password/` matching + valid uid/token | 200, old password no longer works, new one does (user.save() present in serializers.py:177) | NEW |
| C8 | Set password mismatch / <8 chars | API | `password != confirm_password` / 7 chars | 401 (currently `AuthenticationFailed` → 401 rather than 400) — assert actual | NEW |
| C9 | Set password with garbage uid/token | API | `uidb64='!!'` | 401 `"Token is invalid or expired"` | GREEN (verified) |
| C10 | Change password wrong old | API | wrong `old_password` | 400 `"Current password is incorrect"` | GREEN (verified) |
| C11 | Change password mismatch / <8 / missing fields | API | edge inputs | 400 each; exact messages preserved (`"New passwords do not match"`, `"New password must be at least 8 characters"`, `"old_password, new_password and confirm_password are required"`) | GREEN (verified 4F.2) |
| C12 | Change password invalidates old sessions | API | change password, then use pre-change access/refresh token | **Phase 4F.2 decision: token behavior intentionally unchanged** — pre-change access AND refresh tokens stay valid (access ≤60 min, refresh ≤1 day). **Residual risk**; token lifecycle (rotation/blacklisting on password change) deferred to Phase 4F.3. Pinned by `authentication/tests.py::ChangePasswordAPITests::test_existing_tokens_remain_valid_after_password_change` | GREEN (documented risk, 4F.2) |
| C13 | **Logout blacklists refresh token** | API | POST `auth/logout/` with refresh | 200; subsequent `auth/token/refresh/` with same token → 401 | NEW |
| C14 | **E2E logout never calls backend logout** | E2E | click logout, capture network | today: **no** `POST /auth/logout/` request; token remains valid → `AuthContext.logout()` (AuthContext.jsx:157-166) only clears localStorage | **CONFIRMED (code)** |
| C15 | E2E logout clears storage and redirects `/` | E2E | logout | localStorage cleared, navbar shows login CTA | NEW |
| C16 | Refresh with blacklisted/expired token | API | POST `auth/token/refresh/` bad token | 401 | NEW |
| C17 | E2E reset UI `/forgetpassword` → `/password-reset-confirm/:uid/:token` → login with new password | E2E | with mail body captured by a stub | completes end-to-end | NEW |
| C18 | Change password rejects configured-validator passwords | API | `new_password` common (`password123`), numeric-only (`12345678`), or similar to email/first name | 400 `{"error": "<validator message>"}` (Django `AUTH_PASSWORD_VALIDATORS` run via `validate_password(new_password, user)`); password unchanged | GREEN (verified 4F.2) |

> **Phase 4F.2 (Secure Password Changes) scope:** `ChangePasswordView` now runs Django's configured `AUTH_PASSWORD_VALIDATORS` through `validate_password(new_password, user)` after the existing required-field, current-password, confirmation-match, and minimum-8-character checks. Existing 400 `{"error": ...}` responses are preserved. **Existing access and refresh tokens are intentionally left valid after a password change** (residual risk; Phase 4F.3 owns token lifecycle). Backend regression coverage: `Backend/authentication/tests.py`; integration coverage: `Frontend/e2e/integration/account-security.int.spec.js` P1–P9.

## D. Token refresh & axios interceptors (frontend)

| ID | Case | Type | Steps / Input | Expected | Status |
|---|---|---|---|---|---|
| D1 | **First request after access-token expiry hangs** | unit/E2E | seed expired `accessToken` + valid refresh; fire one GET | today: initiator subscribes **after** `onTokenRefreshed()` flush (axiosInstance.js:73-82) → its Promise never resolves → request hangs forever (spinner, no 401 path) | **CONFIRMED (code)** |
| D2 | Concurrent 401s during refresh | unit | two requests 401 simultaneously | second waits on subscriber, both retry once with new token | NEW |
| D3 | Refresh fails (revoked/expired refresh) | unit/E2E | refresh → 401 | `clearAuth()` → localStorage cleared → redirect `/login`, no infinite loop | NEW |
| D4 | Retry-once only (no loop) | unit | endpoint always 401 | exactly one refresh, then reject/redirect | NEW |
| D5 | FormData uploads keep boundary | E2E | profile picture upload | request header has browser-generated multipart boundary; `Content-Type` not forced to JSON | NEW |
| D6 | Token expiry mid-session (60 min) | E2E | clock-shift/fake time | new token attached; user sees no error | NEW |

## E. Protected routes & session persistence

| ID | Case | Type | Steps / Input | Expected | Status |
|---|---|---|---|---|---|
| E1 | Unauthenticated → protected route | E2E | `/profile`, `/settings`, `/guidance`, `/opportunities`, `/hackathon`, `/news`, `/my-journey` while logged out | `AuthModal` opens (RequireAuth), route not rendered | NEW |
| E2 | Authenticated access | E2E | login then visit each protected route | page renders, no console errors | NEW |
| E3 | Persist across reload | E2E | reload with valid tokens | `isAuthed` from localStorage; profile reloads | NEW |
| E4 | Stale/garbage accessToken on load | E2E | seed invalid token | profile load fails → `isAuthed=false` → modal / login | NEW |
| E5 | Backend rejects missing token | API | GET protected endpoints, no Bearer | 401 `"Authentication credentials were not provided."` | GREEN (verified) |
| E6 | Expired access token on API | API | use expired JWT | 401 (then frontend handles) | NEW |
| E7 | Public routes always reachable | E2E | `/`, `/about`, `/login`, `/register` logged out | 200 renders | NEW |
| E8 | Wrong method on protected endpoint | API | `DELETE` on `students/me/` | 405 | NEW |

## F. Profile read / update / picture

| ID | Case | Type | Steps / Input | Expected | Status |
|---|---|---|---|---|---|
| F1 | Profile auto-created on signup | API | GET `students/me/` after register | 200, profile present, `profile_completion` numeric | GREEN (verified) |
| F2 | GET own profile | API | GET `students/profile/` | 200 full serializer incl. `skills[]`, `applications[]` | GREEN (verified by existing test) |
| F3 | PUT update fields | API | PUT `institution`, `bio` | 200, values persisted, names written through to `User` | GREEN (verified) |
| F4 | Invalid enum values | API | PUT `education_level='banana'` | 400 | GREEN (existing test) |
| F5 | Blank vs null field handling | API | PUT `''` and `null` | 200, no crash | NEW |
| F6 | **Profile picture upload → 500** | API | multipart PUT with image | today: `InvalidStorageError: Could not find config for 'default' in settings.STORAGES` (settings.py:106 defines no `default`) | **CONFIRMED (test run)** |
| F7 | Picture upload happy path (after fix) | API | multipart PUT | 200, `profile_picture` absolute URL, file under `media/profile_pictures/` | blocked by F6 |
| F8 | Picture URL serialization with/without file | API | GET profile with `profile_picture=''` vs path | string returned / absolute URL | NEW |
| F9 | Oversized/invalid file (non-image, >2.5 MB) | API | upload `.exe`/huge file | 400 not 500 | NEW |
| F10 | E2E profile edit + avatar + persist after reload | E2E | UI flow | values survive reload | NEW |
| F11 | Completion metric math | API/unit | fill subsets of fields | `profile_completion` monotonically increases, ≤100 | NEW |

## G. Skills (add / upsert / delete / isolation)

| ID | Case | Type | Steps / Input | Expected | Status |
|---|---|---|---|---|---|
| G1 | Add skill | API | POST `students/skills/add/` `{'name':'Python'}` | 201, `id`, `percentage=0`, `color` auto-assigned | GREEN (verified) |
| G2 | Duplicate (same case) | API | add `Python` again | upsert 200, no second row | NEW |
| G3 | Duplicate (different case) | API | add `pythON` after `Python` | 200, same `id`, updated in place | GREEN (verified) |
| G4 | Empty/whitespace name | API | `{'name':'   '}` | 400 | NEW |
| G5 | Very long name (>100) | API | 200-char name | 400 or truncation — assert actual | NEW |
| G6 | Missing payload / non-JSON | API | `{}` / bad content type | 400 | NEW |
| G7 | Delete own skill | API | DELETE `skills/<pk>/` | 204, gone from `me/` | NEW |
| G8 | Delete other user's skill (real pk) | API | user B deletes A's pk | 404 `"Skill not found"` | GREEN (verified) |
| G9 | Delete nonexistent pk | API | DELETE pk 9999 | 404 | NEW |
| G10 | Skills appear in AI context | API | add skill, patch Gemini, assert `build_system_instruction` | skill + percentage in prompt | GREEN (existing ContextBuilder test) |
| G11 | E2E add/remove skill UI (modal, level slider, list update without reload) | E2E | Profile → Skills | optimistic update correct | NEW |

## H. Saved opportunities (incl. duplicates)

| ID | Case | Type | Steps / Input | Expected | Status |
|---|---|---|---|---|---|
| H1 | Save with **string** id (frontend path) | API | POST `opportunity_id:'27282'` + title/link/source | 200/201 row created | NEW (frontend sends `String(h.id)`) |
| H2 | **Save with numeric id → 500** | API | POST `opportunity_id:555` (int) | today: `AttributeError: 'int' object has no attribute 'strip'` at students/views.py:125 | **CONFIRMED (executed)** |
| H3 | Duplicate save (same id, same user) | API | POST same id twice | returns existing row (200), **no duplicate**, unique constraint `['user','opportunity_id']` | NEW |
| H4 | Duplicate save (same id, different user) | API | A and B save 555 | both succeed (uniqueness is per user) | NEW |
| H5 | Missing `opportunity_id` | API | no id | 400 `"opportunity_id is required"` | NEW |
| H6 | List returns only own | API | two users with saves | each sees only theirs | NEW |
| H7 | Delete own | API | DELETE `saved-opportunities/<pk>/` | 204; gone from list | NEW |
| H8 | Delete other user's (real pk) | API | B deletes A's | 404 | GREEN (verified) |
| H9 | E2E save → badge → reload → still saved → unsave | E2E | Opportunities + MyJourney pages | persistence across reload (localStorage is only a cache; server is source of truth) | NEW |
| H10 | Race: double-click save | E2E | rapid clicks | single row, UI consistent | NEW |

## I. AI chat (sessions, failures, rate limits, history integrity)

| ID | Case | Type | Steps / Input | Expected | Status |
|---|---|---|---|---|---|
| I1 | Chat requires auth | API | POST `uniguide/chat/` no token | 401 | GREEN (existing) |
| I2 | New session created + reply | API | POST message, fake Gemini | 200 `{session_id,title,reply}`; user+assistant messages persisted | GREEN (existing) |
| I3 | **Smart title replaces first message as session title** | API | first exchange | session title = AI short title, not `message[:60]`; existing test `test_send_message_creates_session` asserts `'hello'` and **fails today** | **CONFIRMED (failing test)** |
| I4 | Continue same session | API | POST with `session_id` | one session, messages append | GREEN (existing) |
| I5 | Session ownership | API | B uses A's `session_id` | 404 | GREEN (existing) |
| I6 | **History duplication** | unit | send message then inspect what view feeds Gemini | today: `user_msg` is persisted **before** `build_chat_history` (views.py:86-100), so history ends with the new user turn AND `generate_reply` sends it again → every user turn reaches Gemini twice; contradicts docstring context_builder.py:712-718 | **CONFIRMED (code)** |
| I7 | Gemini returns 502 + rollback | API | fake raises `GeminiError` | 502, message rolled back, brand-new session deleted | GREEN (existing) |
| I8 | Unexpected exception → 500 + rollback | API | fake raises `RuntimeError` | 500 with generic message, no internals leaked | NEW (code says it does) |
| I9 | Rate limit 31st message / <3 s gap | API | sequential posts | 429 with `retry_after` | GREEN (existing) |
| I10 | Rate limit resets after window | unit | advance cache timestamps | next post allowed | NEW |
| I11 | Empty/whitespace message | API | `{'message':'   '}` | 400 | GREEN (existing) |
| I12 | Session list/rename/delete | API | full CRUD | 200/200/204; only own | GREEN (existing) |
| I13 | Title rename persists, manual title survives next exchange | API | PATCH title then send | title unchanged | NEW |
| I14 | Guided question valid mode | API | POST `guided-question` mode `internship` | 200 question object or complete (patch Gemini) | NEW |
| I15 | Guided question invalid mode | API | `mode='banana'` | 400 | NEW |
| I16 | Geographic data (known/unknown/none) | API | `?country=India` / `?country=X` / no param | 200 with states / empty states / all countries | NEW |
| I17 | E2E chat: send, markdown render, session sidebar, simulated typing, new chat | E2E | mocked `/chat/` | UI updates, no console errors | NEW |

## J. News / Hackathons / Journey / Settings

| ID | Case | Type | Steps / Input | Expected | Status |
|---|---|---|---|---|---|
| J1 | News happy path (mocked) | API | GET `uniguide/news/?category=ai` with `requests.get` patched | 200 `{category,total,articles[]}` normalized | NEW (live call also verified today: 200, 82 articles) |
| J2 | News unknown category | API | `?category=nope` | 400 | NEW |
| J3 | News API failure → 502 | API | `requests.get` raises; cache empty | 502 `"Could not load news right now"` (note: exposes exception text) | NEW |
| J4 | News serves stale cache on failure | API | prime cache, then failure | 200 from cache (stateful test; clear `NEWS_CACHE` after) | NEW |
| J5 | News is public but page is behind `RequireAuth` | E2E | logged-out `/news` | modal shown; API itself 200 unauthenticated (documented inconsistency) | NEW |
| J6 | Hackathons happy path (mocked) | API | GET `uniguide/hackathons/` | 200 list with normalized fields | NEW |
| J7 | Hackathons `page=abc` | API | `?page=abc` | today: uncaught `ValueError` → 500 (ai/views.py:471) | **CONFIRMED (code)** |
| J8 | Hackathons upstream failure | API | `requests.get` raises | 502 error payload | NEW |
| J9 | Journey aggregates own data | API | GET `students/journey/` | 200 with completion/readiness/skills/saved/apps | GREEN (verified) |
| J10 | Journey with empty profile | API | fresh user | 200 with zeros and non-empty `ai_insight` | GREEN (verified) |
| J11 | Journey `applications` always empty | API | any user | `applications: []` and **no API exists to create an `Application`** — feature incomplete | **CONFIRMED (code)** |
| J12 | Settings: profile form save + change password (wrong/short/mismatch) + theme persists | E2E | Settings page | validation messages, theme survives reload | NEW |
| J13 | Theme persisted across reload, `data-theme` attr set | E2E | toggle theme | matches `localStorage.uniguide_theme` | NEW |

## K. Cross-cutting: isolation, states, misc

| ID | Case | Type | Expected |
|---|---|---|---|
| K1 | Every CRUD endpoint denies cross-user access (profile, skills, saved, chat, journey) | API | 404/403, no data leak — profile/skills/saved/chat **verified**, journey uses own user only |
| K2 | Loading states: slow API → skeletons/spinners, no layout shift | E2E | via `page.route` delay |
| K3 | Empty states: no skills / no saved opps / no chats / no applications | E2E | friendly empty copy (verified in code: `journey-empty`, chat empty, etc.) |
| K4 | Error states: 500/timeout on profile → error + Retry (no fake demo data fallback — explicit in AuthContext.jsx:67-75) | E2E | error shown |
| K5 | Console error scan on all routes (expected: none; current lint has 36 errors — build still succeeds) | E2E | zero console errors |
| K6 | Network offline banner / axios failure on chat send | E2E | user-visible error, session not corrupted |
| K7 | Duplicate/rotten-cache between tests | unit | clear `NEWS_CACHE`, `HACKATHON_CACHE`, rate-limit cache in test setup |
| K8 | Lint gate | CI | `npm run lint` currently **36 errors** (unused imports, react-refresh exports) — must reach 0 before CI gate |
| K9 | Build gate | CI | `npm run build` succeeds (chunk-size warning 1.64 MB JS / 2.2 MB PNG is a perf finding, not a gate) |
| K10 | Django checks + migrations | CI | `manage.py check` clean; `makemigrations --check` no pending model changes |
| K11 | Security smoke: no secrets in responses/logs; `DEBUG` off in prod settings; JWT secrets not in frontend bundle | manual/review | grep responses for key material; verify Render env has `DEBUG=False` |

## Execution order

1. A/B/C/D (auth stack) → 2. F/G/H (data CRUD + isolation) → 3. I (chat, incl. regression cases I3/I6) → 4. J/K → 5. Playwright E2E once API is green.
