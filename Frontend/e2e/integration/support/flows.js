import { expect } from '@playwright/test'

import { readOtpFor } from './email.js'
import { BACKEND_HOST, BACKEND_PORT, FRONTEND_PORT } from './paths.js'

// Real local Django API and frontend origins. Requests built from API_BASE go
// straight to the running Django test server; nothing here mocks the app.
export const API_BASE = `http://${BACKEND_HOST}:${BACKEND_PORT}/api/v1`
export const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`

// Unique synthetic identity per call so tests never collide or depend on, or
// inherit state from, one another.
export function uniqueEmail(prefix = 'e2e.opps') {
  const stamp = Date.now()
  const rand = Math.floor(Math.random() * 1_000_000)
  return `${prefix}.${stamp}.${rand}@example.com`
}

// Polls the file-based email backend for the 6-digit OTP sent to `email`.
export async function waitForOtp(email, { timeout = 20_000 } = {}) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      const otp = readOtpFor(email)
      if (otp) return otp
    } catch {
      // Not delivered yet; keep polling.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for an OTP email for ${email}`)
}

// Registers, verifies (via the real OTP email), and logs in a synthetic user
// against the real local API. Returns the real JWT pair.
export async function provisionUser(request, overrides = {}) {
  const email = overrides.email || uniqueEmail()
  const password = overrides.password || 'E2e-Passw0rd!'
  const firstName = overrides.firstName || 'E2E'
  const lastName = overrides.lastName || 'Student'

  const register = await request.post(`${API_BASE}/auth/register/`, {
    data: {
      email,
      first_name: firstName,
      last_name: lastName,
      password,
      password2: password,
    },
  })
  if (!register.ok()) {
    throw new Error(`register failed (${register.status()}): ${await register.text()}`)
  }

  const otp = await waitForOtp(email)
  const verify = await request.post(`${API_BASE}/auth/otp/verify/`, {
    data: { email, otp },
  })
  if (!verify.ok()) {
    throw new Error(`otp verify failed (${verify.status()}): ${await verify.text()}`)
  }

  const login = await request.post(`${API_BASE}/auth/login/`, {
    data: { email, password },
  })
  if (!login.ok()) {
    throw new Error(`login failed (${login.status()}): ${await login.text()}`)
  }
  const body = await login.json()

  return {
    email,
    password,
    fullName: `${firstName} ${lastName}`,
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
  }
}

export function authHeaders(user) {
  return { Authorization: `Bearer ${user.accessToken}` }
}

// External-only network isolation. The application API is never touched.
export async function blockExternal(context) {
  await context.route('https://accounts.google.com/**', (route) => route.abort())
  await context.route('https://fonts.googleapis.com/**', (route) => route.abort())
  await context.route('https://fonts.gstatic.com/**', (route) => route.abort())
}

// Seeds a context with real tokens before any page loads, so the app mounts
// already authenticated and talks to the real API.
export async function installTokens(context, user) {
  await context.addInitScript(
    ([access, refresh]) => {
      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)
    },
    [user.accessToken, user.refreshToken]
  )
}

// A fresh, externally-isolated context authenticated as `user`.
export async function newAuthedPage(browser, user) {
  const context = await browser.newContext({
    baseURL: FRONTEND_URL,
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  })
  await blockExternal(context)
  await installTokens(context, user)
  const page = await context.newPage()
  return { context, page }
}

// Signs in through the real login form (real Django auth).
export async function loginViaUI(page, user) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('you@university.edu').fill(user.email)
  await page.getByPlaceholder('Enter your password').fill(user.password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page.locator('.nav-username')).toHaveText(user.fullName)
}
