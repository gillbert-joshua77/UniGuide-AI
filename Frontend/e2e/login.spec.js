import { test, expect } from '@playwright/test'
import { blockExternalNetwork, mockLogin } from './helpers.js'
import { loginEndpoint } from './endpoints.js'

test.beforeEach(async ({ context }) => {
  await blockExternalNetwork(context)
})

test.describe('login form smoke', () => {
  test('renders the expected form on /login', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByPlaceholder('you@university.edu')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
  })

  test('empty submission shows frontend validation without a network call', async ({ page }) => {
    let apiCalled = false
    await page.route(loginEndpoint, (route) => {
      apiCalled = true
      return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
    })

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    await expect(page.locator('.auth-error')).toHaveText('Please fill in all fields.')
    expect(apiCalled).toBe(false)
  })

  test('unsuccessful login shows the API error and the button recovers', async ({ page }) => {
    await mockLogin(page.context(), {
      status: 401,
      body: { detail: 'Invalid credentials, try again' },
    })

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('you@university.edu').fill('student@example.com')
    await page.getByPlaceholder('Enter your password').fill('not-the-password')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    await expect(page.locator('.auth-error')).toHaveText('Invalid credentials, try again')
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeEnabled()
  })
})