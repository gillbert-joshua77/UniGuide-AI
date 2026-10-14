import { test, expect } from '@playwright/test'

import { readOtpFor } from './support/email.js'

// ─── Phase 4A integration journey ──────────────────────────────────
// Drives the REAL frontend against the REAL local Django API. No application
// API request is intercepted or mocked. Only external services (Google
// identity, fonts) are blocked; Gemini/News/Devpost are stubbed server-side.

function uniqueEmail() {
  const stamp = Date.now()
  const rand = Math.floor(Math.random() * 1_000_000)
  return `e2e.${stamp}.${rand}@example.com`
}

function settingsInput(page, label) {
  return page
    .locator('.ug-input-group')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('input')
}

function settingsTextarea(page, label) {
  return page
    .locator('.ug-input-group')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('textarea')
}

function fieldValue(page, label) {
  return page
    .locator('.profile-field')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('.profile-field-value')
}

test.describe('real stack: registration to journey', () => {
  test.beforeEach(async ({ context }) => {
    // External isolation only — never the application API.
    await context.route('https://accounts.google.com/**', (route) => route.abort())
    await context.route('https://fonts.googleapis.com/**', (route) => route.abort())
    await context.route('https://fonts.gstatic.com/**', (route) => route.abort())
  })

  test('register -> OTP -> login -> profile -> skills -> journey', async ({ page }) => {
    const email = uniqueEmail()
    const password = 'E2e-Passw0rd!'

    // 1. Register a synthetic user through the real frontend/API.
    await page.goto('/register', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Your first name').fill('E2E')
    await page.getByPlaceholder('Your last name').fill('Runner')
    await page.getByPlaceholder('you@university.edu').fill(email)
    await page.getByPlaceholder('Create a password').fill(password)
    await page.getByPlaceholder('Confirm your password').fill(password)
    await page.getByRole('button', { name: 'Create Account', exact: true }).click()

    await expect(page).toHaveURL(/\/otp\/verify$/)
    await expect(page.getByRole('heading', { name: 'Enter verification code' })).toBeVisible()

    // 2. Read the OTP from the file-based email backend.
    let otp = null
    await expect
      .poll(() => {
        try {
          otp = readOtpFor(email)
          return otp
        } catch {
          return null
        }
      }, { timeout: 20000, intervals: [250, 500, 1000] })
      .toBeTruthy()
    expect(otp).toMatch(/^\d{6}$/)

    // 3. Verify the account and log in.
    const otpInputs = page.locator('.otp-input')
    for (let i = 0; i < otp.length; i += 1) {
      await otpInputs.nth(i).fill(otp[i])
    }
    await page.getByRole('button', { name: 'Verify Code', exact: true }).click()
    await expect(page).toHaveURL(/\/login$/)

    await page.getByPlaceholder('you@university.edu').fill(email)
    await page.getByPlaceholder('Enter your password').fill(password)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page.locator('.nav-username')).toHaveText('E2E Runner')

    // 4. Retrieve and update the real profile.
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'E2E Runner' })).toBeVisible()
    await expect(page.locator('.profile-identity-email')).toHaveText(email)

    await page.getByRole('button', { name: 'Edit Profile', exact: true }).click()
    await settingsInput(page, 'Institution / University').fill('E2E University')
    await settingsTextarea(page, 'Career Goal').fill('Become a Machine Learning Engineer')
    await settingsTextarea(page, 'Interests').fill('AI')
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click()

    await expect(page.getByText('Profile updated successfully')).toBeVisible()
    await expect(fieldValue(page, 'University / Institution')).toHaveText('E2E University')

    // 5. Add and remove a skill through the real UI/API.
    await page.getByRole('tab', { name: /Skills/ }).click()

    const addSkillButton = page
      .locator('.profile-skills-header')
      .getByRole('button', { name: 'Add Skill', exact: true })

    await addSkillButton.click()
    await page.locator('.ug-modal').getByPlaceholder('e.g. Python, Design, Marketing').fill('Python')
    await page.locator('.ug-modal').getByRole('button', { name: 'Add Skill', exact: true }).click()
    await expect(page.getByText('"Python" added to your skills')).toBeVisible()
    await expect(page.locator('.ug-modal')).toHaveCount(0)

    await addSkillButton.click()
    await page.locator('.ug-modal').getByPlaceholder('e.g. Python, Design, Marketing').fill('Docker')
    await page.locator('.ug-modal').getByRole('button', { name: 'Add Skill', exact: true }).click()
    await expect(page.getByText('"Docker" added to your skills')).toBeVisible()
    await expect(page.locator('.ug-modal')).toHaveCount(0)
    await expect(page.locator('.profile-skill-card')).toHaveCount(2)

    await page.getByRole('button', { name: 'Remove Docker', exact: true }).click()
    await expect(page.getByText('Skill removed')).toBeVisible()
    await expect(page.locator('.profile-skill-card')).toHaveCount(1)
    await expect(page.locator('.profile-skill-name')).toHaveText(['Python'])

    // 6. Verify the real My Journey response, computed by the backend.
    await page.goto('/my-journey', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.journey-title')).toHaveText('My Journey')

    // 6 filled checks / 14 -> 43%; readiness = round(43*0.5)+8+10 = 40.
    await expect(
      page.locator('.journey-readiness-primary .journey-readiness-value')
    ).toHaveText('40%')
    await expect(
      page.locator('.journey-readiness-secondary .journey-readiness-value')
    ).toHaveText('43%')
    await expect(page.locator('.journey-readiness-secondary')).toContainText('1 skill added.')

    await expect(page.locator('.journey-goal')).toHaveText('Become a Machine Learning Engineer')
    await expect(page.locator('.journey-skill-name')).toHaveText([
      'SQL',
      'Statistics',
      'Pandas / NumPy',
    ])
    await expect(page.locator('.journey-ai-insight')).toContainText('You are around 40% career-ready.')
  })
})
