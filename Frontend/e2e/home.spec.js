import { test, expect } from '@playwright/test'
import { blockExternalNetwork } from './helpers.js'

test.beforeEach(async ({ context }) => {
  await blockExternalNetwork(context)
})

test.describe('public landing page', () => {
  test('loads and renders hero content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveTitle(/UniGuide AI/)
    await expect(
      page.getByRole('heading', { name: /Your future.*better guided\./i })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Talk to UniGuide AI/i })
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Explore UniGuide/i })
    ).toBeVisible()
  })
})