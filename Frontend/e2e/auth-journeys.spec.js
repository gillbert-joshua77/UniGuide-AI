import { test, expect } from '@playwright/test'
import { blockExternalNetwork, mockLogin, mockLoginSuccess } from './helpers.js'

test.beforeEach(async ({ context }) => {
  await blockExternalNetwork(context)
})

async function signInAs(page, email = 'student@example.com', password = 'correct-horse-battery') {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('you@university.edu').fill(email)
  await page.getByPlaceholder('Enter your password').fill(password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
}

async function logOut(page) {
  await page.locator('.profile-btn').click()
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/'),
    page.getByRole('menuitem', { name: 'Log Out' }).click(),
  ])
}

test.describe('authentication journeys', () => {
  test('an unauthenticated visitor sees the members-only guard on a protected route', async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    // The app keeps the URL and shows the guard screen + auth modal instead of
    // revealing protected content.
    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.locator('.ug-require-title')).toHaveText('Members only')
    await expect(page.locator('.ug-auth-modal')).toBeVisible()
    await expect(page.locator('.profile-identity-name')).toHaveCount(0)
  })

  test('a successful login stores auth state and reaches the home page', async ({ page }) => {
    await mockLoginSuccess(page.context(), {
      user: { full_name: 'Test Student', email: 'student@example.com' },
    })

    await signInAs(page)

    await expect(page).toHaveURL('http://localhost:5173/')
    await expect(page.locator('.nav-username')).toHaveText('Test Student')

    const state = await page.evaluate(() => ({
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      userName: localStorage.getItem('uniguide_user_name'),
    }))
    expect(state.accessToken).toBeTruthy()
    expect(state.refreshToken).toBeTruthy()
    expect(state.userName).toBe('Test Student')
  })

  test('invalid credentials show the API error and do not grant access', async ({ page }) => {
    await mockLogin(page.context(), {
      status: 401,
      body: { detail: 'Invalid credentials, try again' },
    })

    await signInAs(page, 'student@example.com', 'wrong-password')

    await expect(page.locator('.auth-error')).toHaveText('Invalid credentials, try again')
    await expect(page).toHaveURL(/\/login$/)
    expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeNull()
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeEnabled()
  })

  test('logout clears auth state and returns to the public home page', async ({ page }) => {
    await mockLoginSuccess(page.context(), {
      user: { full_name: 'Test Student', email: 'student@example.com' },
    })

    await signInAs(page)
    await expect(page.locator('.nav-username')).toHaveText('Test Student')

    // Confirm the session is active on a protected route before logging out.
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.profile-identity-name')).toBeVisible()

    await logOut(page)

    await expect(page).toHaveURL('http://localhost:5173/')
    await expect(page.locator('.nav-username')).toHaveText('Sign In')

    const state = await page.evaluate(() => ({
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      userName: localStorage.getItem('uniguide_user_name'),
      userEmail: localStorage.getItem('uniguide_user_email'),
    }))
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.userName).toBeNull()
    expect(state.userEmail).toBeNull()
  })

  test('after logout, revisiting a protected route does not reveal protected content', async ({ page }) => {
    await mockLoginSuccess(page.context(), {
      user: { full_name: 'Test Student', email: 'student@example.com' },
    })

    await signInAs(page)
    await expect(page.locator('.nav-username')).toHaveText('Test Student')

    await logOut(page)
    await expect(page.locator('.nav-username')).toHaveText('Sign In')

    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.locator('.ug-require-title')).toHaveText('Members only')
    await expect(page.locator('.profile-identity-name')).toHaveCount(0)
    expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeNull()
  })

  test('a failed API response does not leave the login button stuck loading', async ({ page }) => {
    let calls = 0
    await page.route(/\/api\/v1\/auth\/login\/?$/, (route) => {
      calls += 1
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ detail: 'Invalid credentials, try again' }),
      })
    })

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('you@university.edu').fill('student@example.com')
    await page.getByPlaceholder('Enter your password').fill('wrong-password')

    const submit = page.getByRole('button', { name: 'Sign In', exact: true })
    await submit.click()

    await expect(page.locator('.auth-error')).toHaveText('Invalid credentials, try again')
    await expect(page.getByRole('button', { name: 'Signing in...', exact: true })).toHaveCount(0)
    await expect(submit).toBeEnabled()

    // The form must be usable again — a second attempt still round-trips.
    await submit.click()
    await expect(page.locator('.auth-error')).toHaveText('Invalid credentials, try again')
    expect(calls).toBe(2)
  })
})