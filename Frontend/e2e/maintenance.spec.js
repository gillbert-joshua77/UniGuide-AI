import { test, expect } from '@playwright/test'

// Runs only in the `chromium-maintenance` project, whose dev server starts with
// VITE_MAINTENANCE_MODE=true (see playwright.config.js + .env.e2e-maintenance).
test.describe('maintenance mode (enabled)', () => {
  test('renders the maintenance page on the public landing route', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveTitle(/Scheduled Maintenance/i)
    await expect(
      page.getByRole('heading', { name: /We.ll be back soon/i })
    ).toBeVisible()
    await expect(page.getByText(/temporarily down for scheduled maintenance/i)).toBeVisible()
    await expect(page.getByText(/Please check back later/i)).toBeVisible()

    // Normal app UI must not render underneath or around it.
    await expect(page.locator('.navbar-wrapper')).toHaveCount(0)
    await expect(page.locator('.ug-footer')).toHaveCount(0)
  })

  for (const route of ['/login', '/about']) {
    test(`renders maintenance on the public route ${route} when entered directly`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' })

      await expect(page).toHaveTitle(/Scheduled Maintenance/i)
      await expect(
        page.getByRole('heading', { name: /We.ll be back soon/i })
      ).toBeVisible()
      await expect(page.locator('.navbar-wrapper')).toHaveCount(0)
    })
  }

  for (const route of ['/profile', '/settings', '/guidance', '/opportunities', '/news', '/my-journey']) {
    test(`renders maintenance instead of protected content on ${route} when entered directly`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' })

      await expect(page).toHaveTitle(/Scheduled Maintenance/i)
      await expect(
        page.getByRole('heading', { name: /We.ll be back soon/i })
      ).toBeVisible()

      // No members-only gate, no auth modal, no protected page shell.
      await expect(page.getByText(/Members only/i)).toHaveCount(0)
      await expect(page.locator('.navbar-wrapper')).toHaveCount(0)
      await expect(page.locator('.ug-auth-modal')).toHaveCount(0)
    })
  }

  test('renders maintenance on an unknown route when entered directly', async ({ page }) => {
    await page.goto('/this-page-does-not-exist', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveTitle(/Scheduled Maintenance/i)
    await expect(
      page.getByRole('heading', { name: /We.ll be back soon/i })
    ).toBeVisible()
    await expect(page.locator('.navbar-wrapper')).toHaveCount(0)
  })
})