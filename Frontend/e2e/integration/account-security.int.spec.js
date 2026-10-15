import { test, expect } from '@playwright/test'

import {
  API_BASE,
  authHeaders,
  blockExternal,
  loginViaUI,
  newAuthedPage,
  provisionUser,
} from './support/flows.js'

// ─── Phase 4E integration: account security ────────────────────────
// Drives the REAL frontend against the REAL local Django API. Change-password,
// logout and token-refresh endpoints are never intercepted or mocked. Only
// external services (Google identity, fonts) are blocked client-side; request
// listeners below only OBSERVE traffic. Passwords, JWTs and OTPs are never
// printed.

const AUTH_KEYS = [
  'accessToken',
  'refreshToken',
  'uniguide_user_name',
  'uniguide_user_email',
]

// A synthetic, already-expired access token. Mirrors the Vitest helper: base64url
// header/payload. The signature is irrelevant client-side — axiosInstance only
// decodes the payload to decide whether to refresh, and never sends an expired
// token upstream.
function base64UrlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function makeExpiredAccessToken() {
  const now = Math.floor(Date.now() / 1000)
  const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = base64UrlEncode(
    JSON.stringify({ sub: '1', exp: now - 3600, iat: now - 7200 })
  )
  return `${header}.${payload}.sig`
}

function decodeJwtPayload(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return JSON.parse(atob(padded))
}

function readAuthState(page) {
  return page.evaluate(
    (keys) => Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)])),
    AUTH_KEYS
  )
}

// The Change Password card. Its inputs have no associated labels, so the three
// password fields are selected by order within the card.
function passwordCard(page) {
  return page.locator('.profile-section').filter({ hasText: 'Change Password' })
}

async function gotoSettings(page) {
  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('button', { name: 'Update Password' })
  ).toBeVisible()
}

async function submitChangePassword(page, { current, next, confirm }) {
  const inputs = passwordCard(page).locator('input[type="password"]')
  await inputs.nth(0).fill(current)
  await inputs.nth(1).fill(next)
  await inputs.nth(2).fill(confirm)
  await passwordCard(page)
    .getByRole('button', { name: 'Update Password' })
    .click()
}

function changePasswordViaApi(request, user, body) {
  return request.post(`${API_BASE}/auth/change-password/`, {
    headers: authHeaders(user),
    data: body,
  })
}

function logoutViaApi(request, user) {
  return request.post(`${API_BASE}/auth/logout/`, {
    headers: authHeaders(user),
    data: { refresh_token: user.refreshToken },
  })
}

function refreshViaApi(request, refreshToken) {
  return request.post(`${API_BASE}/auth/token/refresh/`, {
    data: { refresh: refreshToken },
  })
}

// Records every react-toastify message that enters the DOM.
//
// The integration config runs with `reducedMotion: 'reduce'`, under which
// react-toastify's progress-bar animation ends immediately; that fires its
// animationend-driven auto-close on the same tick, so a toast exists only for
// an instant and is never reliably "visible" to a locator assertion (it also
// may be raised synchronously from a click, before an assertion starts).
// Install a MutationObserver on every document via an init script and assert
// against the recorded messages instead of transient visibility.
async function installToastRecorder(context) {
  await context.addInitScript(() => {
    window.__toastMessages = []
    const capture = (node) => {
      if (!node) return
      const text = (node.textContent || '').trim()
      if (text) window.__toastMessages.push(text)
    }
    const attach = () => {
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === 'characterData') {
            capture(record.target)
            continue
          }
          record.addedNodes.forEach((node) => {
            if (node.nodeType !== 1) return
            const bodies = node.querySelectorAll?.('.Toastify__toast-body')
            if (bodies && bodies.length) bodies.forEach(capture)
            else capture(node)
          })
        }
      })
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }
    if (document.body) attach()
    else document.addEventListener('DOMContentLoaded', attach)
  })
}

// Asserts a toast carrying `text` was rendered (see installToastRecorder).
async function expectToast(page, text) {
  await expect
    .poll(
      () =>
        page.evaluate(
          (expected) =>
            (window.__toastMessages || []).some((m) => m.includes(expected)),
          text
        ),
      { timeout: 15000, message: `toast "${text}" should be shown` }
    )
    .toBe(true)
}

// Waits out the moment in which a request would have been sent if the client
// had not short-circuited. Only used where no request event can otherwise prove
// absence.
async function expectNoRequest(page, records) {
  await page.waitForTimeout(500)
  expect(records).toHaveLength(0)
}

test.describe('real stack: account security', () => {
  test.beforeEach(async ({ context }) => {
    // External isolation only — never the application API.
    await blockExternal(context)
    await installToastRecorder(context)
  })

  // ─── Password change ────────────────────────────────────────────
  test('P1: changing the password through settings succeeds and signs in with it', async ({
    page,
    request,
  }) => {
    const user = await provisionUser(request)
    const newPassword = 'E2e-Changed-Pass-1!'

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await loginViaUI(page, user)

    await gotoSettings(page)
    await submitChangePassword(page, {
      current: user.password,
      next: newPassword,
      confirm: newPassword,
    })
    await expectToast(page, 'Password changed successfully')

    // Drop the session and sign in again through the real login form.
    await page.evaluate(
      (keys) => keys.forEach((k) => localStorage.removeItem(k)),
      AUTH_KEYS
    )
    await loginViaUI(page, { ...user, password: newPassword })
  })

  test('P2: a wrong current password is rejected and the password is unchanged', async ({
    page,
    request,
  }) => {
    const user = await provisionUser(request)

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await loginViaUI(page, user)

    await gotoSettings(page)
    await submitChangePassword(page, {
      current: 'Definitely-Wrong-1!',
      next: 'E2e-Changed-Pass-2!',
      confirm: 'E2e-Changed-Pass-2!',
    })
    await expectToast(page, 'Current password is incorrect')

    // The original password still authenticates.
    await page.evaluate(
      (keys) => keys.forEach((k) => localStorage.removeItem(k)),
      AUTH_KEYS
    )
    await loginViaUI(page, user)
  })

  test('P3: a mismatched confirmation is caught client-side with no API call', async ({
    page,
    request,
  }) => {
    const user = await provisionUser(request)
    const changeCalls = []
    page.on('request', (req) => {
      if (req.url().includes('/auth/change-password/')) changeCalls.push(1)
    })

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await loginViaUI(page, user)

    await gotoSettings(page)
    await submitChangePassword(page, {
      current: user.password,
      next: 'E2e-Changed-Pass-3!',
      confirm: 'E2e-Different-Pass-3!',
    })
    await expectToast(page, 'New passwords do not match')

    await expectNoRequest(page, changeCalls)
  })

  test('P4: short passwords fail client-side and by the API; mismatches by the API', async ({
    page,
    request,
  }) => {
    const user = await provisionUser(request)
    const changeCalls = []
    page.on('request', (req) => {
      if (req.url().includes('/auth/change-password/')) changeCalls.push(1)
    })

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await loginViaUI(page, user)

    await gotoSettings(page)
    await submitChangePassword(page, {
      current: user.password,
      next: 'short7!',
      confirm: 'short7!',
    })
    await expectToast(page, 'New password must be at least 8 characters')
    await expectNoRequest(page, changeCalls)

    const short = await changePasswordViaApi(request, user, {
      old_password: user.password,
      new_password: 'short7!',
      confirm_password: 'short7!',
    })
    expect(short.status()).toBe(400)
    expect((await short.json()).error).toBe(
      'New password must be at least 8 characters'
    )

    const mismatch = await changePasswordViaApi(request, user, {
      old_password: user.password,
      new_password: 'E2e-Changed-Pass-4!',
      confirm_password: 'E2e-Other-Pass-4!',
    })
    expect(mismatch.status()).toBe(400)
    expect((await mismatch.json()).error).toBe('New passwords do not match')
  })

  test('P5: an empty current password is submitted and rejected by the server', async ({
    page,
    request,
  }) => {
    const user = await provisionUser(request)

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await loginViaUI(page, user)

    await gotoSettings(page)
    await submitChangePassword(page, {
      current: '',
      next: 'E2e-Changed-Pass-5!',
      confirm: 'E2e-Changed-Pass-5!',
    })
    await expectToast(
      page,
      'old_password, new_password and confirm_password are required'
    )

    const res = await changePasswordViaApi(request, user, {
      old_password: '',
      new_password: 'E2e-Changed-Pass-5!',
      confirm_password: 'E2e-Changed-Pass-5!',
    })
    expect(res.status()).toBe(400)
    expect((await res.json()).error).toBe(
      'old_password, new_password and confirm_password are required'
    )
  })

  test('P6: pre-change access and refresh tokens after a successful change', async ({
    request,
  }) => {
    const user = await provisionUser(request)
    const newPassword = 'E2e-Changed-Pass-6!'

    const change = await changePasswordViaApi(request, user, {
      old_password: user.password,
      new_password: newPassword,
      confirm_password: newPassword,
    })
    expect(change.status()).toBe(200)

    // Record whether the pre-change tokens remain usable.
    const profile = await request.get(`${API_BASE}/students/profile/`, {
      headers: authHeaders(user),
    })
    const refresh = await refreshViaApi(request, user.refreshToken)

    expect(profile.status()).toBe(200)
    expect(refresh.status()).toBe(200)
  })

  // ─── Logout and token security ──────────────────────────────────
  test('L1: UI logout clears storage, returns home, and makes no logout API call', async ({
    page,
    request,
  }) => {
    const user = await provisionUser(request)
    const logoutCalls = []
    page.on('request', (req) => {
      if (req.url().includes('/auth/logout/')) logoutCalls.push(1)
    })

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await loginViaUI(page, user)

    await page.locator('.profile-btn').click()
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/'),
      page.getByRole('menuitem', { name: 'Log Out' }).click(),
    ])

    await expect(page.locator('.nav-username')).toHaveText('Sign In')

    const state = await readAuthState(page)
    for (const key of AUTH_KEYS) expect(state[key]).toBeNull()

    expect(logoutCalls).toHaveLength(0)
  })

  test('L2: API logout blacklists the refresh token', async ({ request }) => {
    const user = await provisionUser(request)

    const logout = await logoutViaApi(request, user)
    expect(logout.status()).toBe(200)

    const refresh = await refreshViaApi(request, user.refreshToken)
    expect(refresh.status()).toBe(401)
  })

  test('L3: repeated API logout with the same refresh token', async ({
    request,
  }) => {
    const user = await provisionUser(request)

    const first = await logoutViaApi(request, user)
    expect(first.status()).toBe(200)

    // Second logout with the same (now blacklisted) token.
    //
    // The endpoint is NOT idempotent: the serializer builds RefreshToken with
    // verify=True, so a blacklisted token raises TokenError and the view
    // responds 400 ({"refresh_token": ["Token is Invalid or has Expired"]})
    // rather than 200.
    const second = await logoutViaApi(request, user)
    expect(second.status()).toBe(400)

    // Either way the token is unusable for refresh afterwards.
    const refresh = await refreshViaApi(request, user.refreshToken)
    expect(refresh.status()).toBe(401)
  })

  test('L4: unauthenticated API logout is rejected', async ({ request }) => {
    const user = await provisionUser(request)

    const logout = await request.post(`${API_BASE}/auth/logout/`, {
      data: { refresh_token: user.refreshToken },
    })
    expect(logout.status()).toBe(401)
  })

  test('L5: the access token still authorizes the protected profile after logout', async ({
    request,
  }) => {
    const user = await provisionUser(request)

    const logout = await logoutViaApi(request, user)
    expect(logout.status()).toBe(200)

    const profile = await request.get(`${API_BASE}/students/profile/`, {
      headers: authHeaders(user),
    })
    expect(profile.status()).toBe(200)
  })

  // ─── Real-stack token refresh ───────────────────────────────────
  test('T1: an expired access token is refreshed transparently and the profile loads', async ({
    browser,
    request,
  }) => {
    const user = await provisionUser(request)
    const expired = makeExpiredAccessToken()
    expect(decodeJwtPayload(expired).exp * 1000).toBeLessThan(Date.now())

    const { context, page } = await newAuthedPage(browser, {
      accessToken: expired,
      refreshToken: user.refreshToken,
    })

    const refreshStatuses = []
    page.on('response', (res) => {
      if (res.url().includes('/auth/token/refresh/')) {
        refreshStatuses.push(res.status())
      }
    })

    await page.goto('/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.nav-username')).toHaveText(user.fullName)
    await expect(
      page.getByRole('button', { name: 'Update Password' })
    ).toBeVisible()

    const stored = await page.evaluate(() => localStorage.getItem('accessToken'))
    expect(stored).toBeTruthy()
    expect(stored).not.toBe(expired)
    expect(decodeJwtPayload(stored).exp * 1000).toBeGreaterThan(Date.now())
    expect(refreshStatuses).toContain(200)

    await context.close()

    const direct = await refreshViaApi(request, user.refreshToken)
    expect(direct.status()).toBe(200)
    expect((await direct.json()).access).toBeTruthy()
  })

  test('T2: an invalid refresh token clears auth state and redirects to /login', async ({
    page,
    request,
  }) => {
    await provisionUser(request)
    const expired = makeExpiredAccessToken()

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    // Seed post-load so nothing re-seeds tokens after clearAuth() redirects.
    await page.evaluate(
      ([access, refresh]) => {
        localStorage.setItem('accessToken', access)
        localStorage.setItem('refreshToken', refresh)
        localStorage.setItem('uniguide_user_name', 'Seeded Name')
        localStorage.setItem('uniguide_user_email', 'seeded@example.com')
      },
      [expired, 'invalid-refresh-token']
    )

    await page.goto('/settings', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/\/login$/)
    const state = await readAuthState(page)
    for (const key of AUTH_KEYS) expect(state[key]).toBeNull()
  })

  test('T3: a blacklisted refresh token is rejected by the refresh endpoint', async ({
    request,
  }) => {
    const user = await provisionUser(request)

    const logout = await logoutViaApi(request, user)
    expect(logout.status()).toBe(200)

    const refresh = await refreshViaApi(request, user.refreshToken)
    expect(refresh.status()).toBe(401)
  })
})
