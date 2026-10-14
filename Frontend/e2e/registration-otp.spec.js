import { test, expect } from '@playwright/test'
import {
  blockExternalNetwork,
  mockOtpResend,
  mockOtpVerify,
  mockRegisterFailure,
  mockRegisterSuccess,
} from './helpers.js'

test.beforeEach(async ({ context }) => {
  await blockExternalNetwork(context)
})

async function fillRegistration(page, { confirmSame = true } = {}) {
  await page.getByPlaceholder('Your first name').fill('Test')
  await page.getByPlaceholder('Your last name').fill('Student')
  await page.getByPlaceholder('you@university.edu').fill('student@example.com')
  await page.getByPlaceholder('Create a password').fill('correct-horse-battery')
  await page.getByPlaceholder('Confirm your password').fill(
    confirmSame ? 'correct-horse-battery' : 'different-password'
  )
}

async function fillOtp(page, code) {
  const inputs = page.locator('.otp-input')
  for (let i = 0; i < code.length; i += 1) {
    await inputs.nth(i).fill(code[i])
  }
}

async function advanceCooldown(page) {
  // The countdown re-arms a 1s timeout on every tick, so a single big
  // clock.fastForward jump does not cascade. Advance second-by-second instead.
  for (let i = 0; i < 62; i += 1) {
    await page.clock.fastForward('00:01')
  }
}

test.describe('registration and email OTP journeys', () => {
  test('registration page renders its expected fields', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    await expect(page.getByPlaceholder('Your first name')).toBeVisible()
    await expect(page.getByPlaceholder('Your last name')).toBeVisible()
    await expect(page.getByPlaceholder('you@university.edu')).toBeVisible()
    await expect(page.getByPlaceholder('Create a password')).toBeVisible()
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account', exact: true })).toBeVisible()
  })

  test('empty or invalid registration input shows frontend validation errors', async ({ page }) => {
    let registerCalled = 0
    await mockRegisterSuccess(page.context(), { onRequest: () => { registerCalled += 1 } })

    await page.goto('/register', { waitUntil: 'domcontentloaded' })

    // Empty submission is blocked before any network call.
    await page.getByRole('button', { name: 'Create Account', exact: true }).click()
    await expect(page.locator('.auth-error')).toHaveText('Please fill in all fields.')
    expect(registerCalled).toBe(0)

    // Mismatched passwords are blocked before any network call.
    await fillRegistration(page, { confirmSame: false })
    await page.getByRole('button', { name: 'Create Account', exact: true }).click()
    await expect(page.locator('.auth-error')).toHaveText('Passwords do not match.')
    expect(registerCalled).toBe(0)
  })

  test('successful registration navigates to OTP verification with the email', async ({ page }) => {
    let requestBody = null
    await mockRegisterSuccess(page.context(), {
      onRequest: (req) => { requestBody = req.postDataJSON() },
    })

    await page.goto('/register', { waitUntil: 'domcontentloaded' })
    await fillRegistration(page, { confirmSame: true })
    await page.getByRole('button', { name: 'Create Account', exact: true }).click()

    await expect(page).toHaveURL(/\/otp\/verify$/)
    await expect(page.getByRole('heading', { name: 'Enter verification code' })).toBeVisible()
    await expect(page.getByText(/Code sent to student@example\.com/i)).toBeVisible()

    expect(requestBody).toMatchObject({
      first_name: 'Test',
      last_name: 'Student',
      email: 'student@example.com',
      password: 'correct-horse-battery',
      password2: 'correct-horse-battery',
    })
  })

  test('an incorrect OTP shows an error and does not mark the user verified', async ({ page }) => {
    // The real backend returns a 404 with `message` (not `detail`), so the UI
    // falls back to its own error copy.
    await mockOtpVerify(page.context(), {
      status: 404,
      body: { message: 'Invalid OTP or email' },
    })

    await page.goto('/otp/verify', { waitUntil: 'domcontentloaded' })
    await fillOtp(page, '111111')
    await page.getByRole('button', { name: 'Verify Code', exact: true }).click()

    await expect(page.locator('.auth-error')).toHaveText('Invalid OTP. Please try again.')
    await expect(page).toHaveURL(/\/otp\/verify$/)
    expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeNull()
  })

  test('successful OTP verification follows the app success flow to login', async ({ page }) => {
    await mockOtpVerify(page.context(), {
      status: 200,
      body: { message: 'Account email verified successfully' },
    })

    await page.goto('/otp/verify', { waitUntil: 'domcontentloaded' })
    await fillOtp(page, '123456')
    await page.getByRole('button', { name: 'Verify Code', exact: true }).click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('resending an OTP on success restarts the cooldown timer', async ({ page }) => {
    let resendBody = null
    await mockRegisterSuccess(page.context())
    await mockOtpResend(page.context(), {
      status: 200,
      body: { message: 'OTP resent successfully' },
      onRequest: (req) => { resendBody = req.postDataJSON() },
    })

    await page.clock.install()
    await page.goto('/register', { waitUntil: 'domcontentloaded' })
    await fillRegistration(page, { confirmSame: true })
    await page.getByRole('button', { name: 'Create Account', exact: true }).click()
    await expect(page).toHaveURL(/\/otp\/verify$/)
    await expect(page.getByText(/Resend code in/)).toBeVisible()

    // The resend button only appears after the 60s cooldown (faked clock).
    await advanceCooldown(page)
    const resend = page.getByRole('button', { name: 'Resend code', exact: true })
    await expect(resend).toBeVisible()

    await resend.click()

    await expect(page.getByText(/Resend code in 60s/)).toBeVisible()
    await expect(resend).toHaveCount(0)
    expect(resendBody).toEqual({ email: 'student@example.com' })
  })

  test('resending an OTP on failure leaves the interface unchanged', async ({ page }) => {
    let resendCount = 0
    await mockRegisterSuccess(page.context())
    await mockOtpResend(page.context(), {
      status: 404,
      body: { message: 'User not found' },
      onRequest: () => { resendCount += 1 },
    })

    await page.clock.install()
    await page.goto('/register', { waitUntil: 'domcontentloaded' })
    await fillRegistration(page, { confirmSame: true })
    await page.getByRole('button', { name: 'Create Account', exact: true }).click()
    await expect(page).toHaveURL(/\/otp\/verify$/)

    await advanceCooldown(page)
    const resend = page.getByRole('button', { name: 'Resend code', exact: true })
    await expect(resend).toBeVisible()

    await resend.click()

    // Failure handling is silent: no cooldown restarts, button stays visible.
    await expect(page.getByText(/Resend code in/)).toHaveCount(0)
    await expect(resend).toBeVisible()
    expect(resendCount).toBe(1)
  })

  test('a failed registration request does not leave the form stuck loading', async ({ page }) => {
    let calls = 0
    await mockRegisterFailure(page.context(), {
      status: 400,
      body: { email: ['A student with that email already exists.'] },
      onRequest: () => { calls += 1 },
    })

    await page.goto('/register', { waitUntil: 'domcontentloaded' })
    await fillRegistration(page, { confirmSame: true })
    const submit = page.getByRole('button', { name: 'Create Account', exact: true })
    await submit.click()

    await expect(page.locator('.auth-error')).toHaveText('A student with that email already exists.')
    await expect(page.getByRole('button', { name: 'Creating account...', exact: true })).toHaveCount(0)
    await expect(submit).toBeEnabled()

    // The form stays usable: a second attempt round-trips again.
    await submit.click()
    await expect(page.locator('.auth-error')).toHaveText('A student with that email already exists.')
    expect(calls).toBe(2)
  })

  test('browser storage is isolated: a fresh test context starts with no auth state', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })

    // Earlier tests (login journeys) stored tokens/session cache; this test runs
    // in a brand-new browser context where none of that storage may leak.
    const state = await page.evaluate(() => ({
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      userName: localStorage.getItem('uniguide_user_name'),
    }))
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.userName).toBeNull()
  })
})