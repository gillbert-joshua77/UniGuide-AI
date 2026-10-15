import { test, expect } from '@playwright/test'

import { readLatestEmail, readResetLinkFor } from './support/email.js'
import { API_BASE, provisionUser, uniqueEmail } from './support/flows.js'

// ─── Phase 4D integration: password reset ──────────────────────────
// Drives the REAL frontend against the REAL local Django API. The
// password-reset API is never intercepted or mocked. Only external services
// (Google identity, fonts) are blocked client-side; the reset email is
// delivered to the file-based backend (MAIL_DIR). Reset tokens are only ever
// read into local variables and are never printed.

const RESET_SUCCESS_UI = 'Check your email for a reset link.'

function mailFor(email) {
  const target = email.toLowerCase()
  return readLatestEmail(({ to }) => to.toLowerCase().includes(target))
}

// Submits the real reset request through the UI and waits for the success copy.
async function submitResetRequest(page, email) {
  await page.goto('/forgetpassword', { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('you@university.edu').fill(email)
  await page.getByRole('button', { name: 'Send Reset Link', exact: true }).click()
  await expect(page.getByText(RESET_SUCCESS_UI)).toBeVisible()
}

// Signs in through the real login form and returns nothing; callers assert on
// either success (`.nav-username`) or the visible error (`.auth-error`).
async function attemptLogin(page, email, password) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('you@university.edu').fill(email)
  await page.getByPlaceholder('Enter your password').fill(password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
}

function resetViaApi(request, { uid, token, password }) {
  return request.patch(`${API_BASE}/auth/set-new-password/`, {
    data: {
      password,
      confirm_password: password,
      uidb64: uid,
      token,
    },
  })
}

// URL-safe base64 of an arbitrary ASCII string, padding stripped (Django's
// urlsafe_base64_encode does the same), for constructing malformed-but-valid
// base64 UIDs.
function toUrlsafeB64(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

test.describe('real stack: password reset', () => {
  test.beforeEach(async ({ context }) => {
    // External isolation only — never the application API.
    await context.route('https://accounts.google.com/**', (route) => route.abort())
    await context.route('https://fonts.googleapis.com/**', (route) => route.abort())
    await context.route('https://fonts.gstatic.com/**', (route) => route.abort())
  })

  test('R1: a known user gets the success copy and a real reset email is captured', async ({
    page,
    request,
  }) => {
    const user = await provisionUser(request)

    await submitResetRequest(page, user.email)

    const { uid, token } = await readResetLinkFor(user.email)
    expect(typeof uid).toBe('string')
    expect(typeof token).toBe('string')
    expect(uid.length).toBeGreaterThan(0)
    expect(token.length).toBeGreaterThan(0)
  })

  test('R2: an unknown email gets the same success copy, HTTP 200, and no email', async ({
    page,
    request,
  }) => {
    const unknown = uniqueEmail('e2e.unknown')

    const res = await request.post(`${API_BASE}/auth/password-reset/`, {
      data: { email: unknown },
    })
    expect(res.status()).toBe(200)
    expect((await res.json()).message).toContain('link has been sent')

    await submitResetRequest(page, unknown)

    // No message is ever addressed to the unknown recipient.
    await page.waitForTimeout(1500)
    expect(mailFor(unknown)).toBeNull()
  })

  test('R3: the reset link lets the user set a new password and sign in', async ({
    page,
    request,
  }) => {
    const user = await provisionUser(request)
    await submitResetRequest(page, user.email)

    const { uid, token } = await readResetLinkFor(user.email)
    const newPassword = 'E2e-Reset-Pass-1!'

    await page.goto(`/password-reset-confirm/${uid}/${token}/`, {
      waitUntil: 'domcontentloaded',
    })
    await page.getByPlaceholder('Enter new password').fill(newPassword)
    await page.getByPlaceholder('Confirm new password').fill(newPassword)
    await page.getByRole('button', { name: 'Reset Password', exact: true }).click()

    await expect(
      page.getByText('Password reset successfully! Redirecting...')
    ).toBeVisible()
    await page.waitForURL(/\/login$/)

    await attemptLogin(page, user.email, newPassword)
    await expect(page.locator('.nav-username')).toHaveText(user.fullName)
  })

  test('R4: the old password no longer authenticates after a reset', async ({
    page,
    request,
  }) => {
    const user = await provisionUser(request)
    await submitResetRequest(page, user.email)

    const { uid, token } = await readResetLinkFor(user.email)
    const newPassword = 'E2e-Reset-Pass-2!'
    const res = await resetViaApi(request, { uid, token, password: newPassword })
    expect(res.status()).toBe(200)

    await attemptLogin(page, user.email, user.password)
    await expect(page.locator('.auth-error')).toHaveText(
      'Invalid credentials, try again'
    )
  })

  test('R5: reusing a spent reset token is rejected by the UI and the API', async ({
    page,
    request,
  }) => {
    const user = await provisionUser(request)
    await submitResetRequest(page, user.email)

    const { uid, token } = await readResetLinkFor(user.email)
    const newPassword = 'E2e-Reset-Pass-3!'
    const first = await resetViaApi(request, { uid, token, password: newPassword })
    expect(first.status()).toBe(200)

    // The link is single-use: the same token is now invalid.
    const reuse = await resetViaApi(request, {
      uid,
      token,
      password: 'E2e-Reset-Pass-4!',
    })
    expect(reuse.status()).toBe(401)

    // Through the real UI the reuse is still rejected, but an unauthenticated
    // visitor never sees the inline error: the global 401 interceptor
    // (Utils/axiosInstance.js clearAuth) force-redirects to /login before
    // ResetPassword can render `.auth-error`. This documents that behavior.
    await page.goto(`/password-reset-confirm/${uid}/${token}/`, {
      waitUntil: 'domcontentloaded',
    })
    await page.getByPlaceholder('Enter new password').fill('E2e-Reset-Pass-5!')
    await page.getByPlaceholder('Confirm new password').fill('E2e-Reset-Pass-5!')
    await page.getByRole('button', { name: 'Reset Password', exact: true }).click()

    // expect().toHaveURL auto-retries, tolerating the transient aborted
    // navigation caused by clearAuth running twice (inside
    // refreshAccessToken and again in the interceptor), issuing two rapid
    // location.assign('/login') calls.
    await expect(page).toHaveURL(/\/login$/)
    await expect(
      page.getByRole('button', { name: 'Sign In', exact: true })
    ).toBeVisible()
  })

  test('R6: a tampered token is rejected by confirm GET and reset PATCH', async ({
    page,
    request,
  }) => {
    const user = await provisionUser(request)
    await submitResetRequest(page, user.email)

    const { uid, token } = await readResetLinkFor(user.email)
    const tampered = (token[0] === 'A' ? 'B' : 'A') + token.slice(1)
    expect(tampered).not.toBe(token)

    const confirm = await request.get(
      `${API_BASE}/auth/password-reset-confirm/${uid}/${tampered}/`
    )
    expect(confirm.status()).toBe(401)

    const patch = await resetViaApi(request, {
      uid,
      token: tampered,
      password: 'E2e-Reset-Pass-6!',
    })
    expect(patch.status()).toBe(401)
  })

  test('R7: malformed identifiers follow the actual API contract', async ({
    request,
  }) => {
    // Malformed uidb64 + garbage token through the real PATCH endpoint.
    const patch = await request.patch(`${API_BASE}/auth/set-new-password/`, {
      data: {
        password: 'E2e-Reset-Pass-7!',
        confirm_password: 'E2e-Reset-Pass-7!',
        uidb64: 'abc',
        token: 'garbage',
      },
    })
    expect(patch.status()).toBe(401)

    // Confirm GET with a valid-base64 but non-numeric UID. The view only
    // catches DjangoUnicodeDecodeError, so the integer lookup failure is
    // unhandled: this documents an observed 500 rather than intended behavior.
    const nonNumericUid = toUrlsafeB64('notanumber')
    const confirm = await request.get(
      `${API_BASE}/auth/password-reset-confirm/${nonNumericUid}/${toUrlsafeB64('token')}/`
    )
    expect(confirm.status()).toBe(500)
  })
})
