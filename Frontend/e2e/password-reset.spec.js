import { test, expect } from '@playwright/test'
import {
  blockExternalNetwork,
  mockChangePassword,
  mockLoginSuccess,
  mockResetPasswordRequest,
  mockSetNewPassword,
} from './helpers.js'

test.beforeEach(async ({ context }) => {
  await blockExternalNetwork(context)
})

async function signInAs(page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('you@university.edu').fill('student@example.com')
  await page.getByPlaceholder('Enter your password').fill('correct-horse-battery')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page.locator('.nav-username')).toHaveText('Test Student')
}

function settingsPasswordInput(page, label) {
  return page
    .locator('.ug-input-group')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('input')
}

test.describe('password reset and password change', () => {
  test('password-reset page renders its expected content', async ({ page }) => {
    await page.goto('/forgetpassword', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Forgot password?' })).toBeVisible()
    await expect(page.getByText(/Enter your email and we'll send you a reset link\./i)).toBeVisible()
    await expect(page.getByPlaceholder('you@university.edu')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send Reset Link', exact: true })).toBeVisible()
  })

  test('empty or invalid reset input is handled without a network call', async ({ page }) => {
    let calls = 0
    await mockResetPasswordRequest(page.context(), { onRequest: () => { calls += 1 } })

    await page.goto('/forgetpassword', { waitUntil: 'domcontentloaded' })

    // Empty email is blocked client-side.
    await page.getByRole('button', { name: 'Send Reset Link', exact: true }).click()
    await expect(page.locator('.auth-error')).toHaveText('Please enter your email.')
    expect(calls).toBe(0)

    // An invalid email format is caught by native form validation, so the app
    // never sends it to the API and the existing error is left unchanged.
    await page.getByPlaceholder('you@university.edu').fill('not-an-email')
    await page.getByRole('button', { name: 'Send Reset Link', exact: true }).click()
    expect(calls).toBe(0)
    await expect(page.locator('.auth-error')).toHaveText('Please enter your email.')
  })

  test('a successful reset request shows the confirmation and hides the form', async ({ page }) => {
    let requestBody = null
    let method = null
    await mockResetPasswordRequest(page.context(), {
      status: 200,
      body: {
        message: 'A link has been sent to your email to reset your password',
      },
      onRequest: (req) => {
        method = req.method()
        requestBody = req.postDataJSON()
      },
    })

    await page.goto('/forgetpassword', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('you@university.edu').fill('student@example.com')
    await page.getByRole('button', { name: 'Send Reset Link', exact: true }).click()

    await expect(page.getByText('Check your email for a reset link.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to Sign In' })).toBeVisible()
    await expect(page.getByPlaceholder('you@university.edu')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Send Reset Link', exact: true })).toHaveCount(0)

    expect(method).toBe('POST')
    expect(requestBody).toEqual({ email: 'student@example.com' })
  })

  test('an unknown email does not expose account existence', async ({ page }) => {
    let requestBody = null
    // The backend returns the same generic success message whether or not the
    // account exists (privacy-preserving), and so does our mock.
    await mockResetPasswordRequest(page.context(), {
      status: 200,
      body: {
        message: 'A link has been sent to your email to reset your password',
      },
      onRequest: (req) => { requestBody = req.postDataJSON() },
    })

    await page.goto('/forgetpassword', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('you@university.edu').fill('ghost@example.com')
    await page.getByRole('button', { name: 'Send Reset Link', exact: true }).click()

    await expect(page.getByText('Check your email for a reset link.')).toBeVisible()
    await expect(page.locator('.auth-error')).toHaveCount(0)
    expect(requestBody).toEqual({ email: 'ghost@example.com' })
  })

  test('invalid or expired reset details show the API error and keep the form usable', async ({ page }) => {
    let method = null
    let requestBody = null
    await mockSetNewPassword(page.context(), {
      status: 400,
      body: { detail: 'The token is invalid or has expired.' },
      onRequest: (req) => {
        method = req.method()
        requestBody = req.postDataJSON()
      },
    })

    await page.goto('/password-reset-confirm/invaliduid/expiredtoken', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Enter new password').fill('newpassword123')
    await page.getByPlaceholder('Confirm new password').fill('newpassword123')
    const submit = page.getByRole('button', { name: 'Reset Password', exact: true })
    await submit.click()

    await expect(page.locator('.auth-error')).toHaveText('The token is invalid or has expired.')
    await expect(page).toHaveURL(/\/password-reset-confirm\/invaliduid\/expiredtoken$/)
    await expect(page.getByRole('button', { name: 'Resetting...', exact: true })).toHaveCount(0)
    await expect(submit).toBeEnabled()

    expect(method).toBe('PATCH')
    expect(requestBody).toMatchObject({
      password: 'newpassword123',
      confirm_password: 'newpassword123',
      uidb64: 'invaliduid',
      token: 'expiredtoken',
    })
  })

  test('a successful password reset follows the flow through to login', async ({ page }) => {
    await mockSetNewPassword(page.context(), {
      status: 200,
      body: { message: 'password reset successful' },
    })

    await page.goto('/password-reset-confirm/MQ/resettoken', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Enter new password').fill('brandnewpass1')
    await page.getByPlaceholder('Confirm new password').fill('brandnewpass1')
    await page.getByRole('button', { name: 'Reset Password', exact: true }).click()

    await expect(page.getByText('Password reset successfully! Redirecting...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset Password', exact: true })).toHaveCount(0)

    // The app navigates to /login ~2s after success.
    await expect(page).toHaveURL(/\/login$/, { timeout: 15000 })
  })

  test('an authenticated user can change their password successfully', async ({ page }) => {
    let method = null
    let requestBody = null
    await mockLoginSuccess(page.context(), {
      user: { full_name: 'Test Student', email: 'student@example.com' },
    })
    await mockChangePassword(page.context(), {
      status: 200,
      body: { message: 'password changed' },
      onRequest: (req) => {
        method = req.method()
        requestBody = req.postDataJSON()
      },
    })

    await signInAs(page)
    await page.goto('/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Change Password')).toBeVisible()

    await settingsPasswordInput(page, 'Current Password').fill('oldpassword1')
    await settingsPasswordInput(page, 'New Password').fill('newpassword1')
    await settingsPasswordInput(page, 'Confirm New Password').fill('newpassword1')
    await page.getByRole('button', { name: 'Update Password', exact: true }).click()

    await expect(page.getByText('Password changed successfully')).toBeVisible()

    await expect(settingsPasswordInput(page, 'Current Password')).toHaveValue('')
    await expect(settingsPasswordInput(page, 'New Password')).toHaveValue('')
    await expect(settingsPasswordInput(page, 'Confirm New Password')).toHaveValue('')

    expect(method).toBe('POST')
    expect(requestBody).toEqual({
      old_password: 'oldpassword1',
      new_password: 'newpassword1',
      confirm_password: 'newpassword1',
    })
  })

  test('an incorrect current password shows the error and does not stick the form', async ({ page }) => {
    let calls = 0
    await mockLoginSuccess(page.context(), {
      user: { full_name: 'Test Student', email: 'student@example.com' },
    })
    await mockChangePassword(page.context(), {
      status: 400,
      body: { error: 'Current password is incorrect' },
      onRequest: () => { calls += 1 },
    })

    await signInAs(page)
    await page.goto('/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Change Password')).toBeVisible()

    await settingsPasswordInput(page, 'Current Password').fill('wrongpassword')
    await settingsPasswordInput(page, 'New Password').fill('newpassword1')
    await settingsPasswordInput(page, 'Confirm New Password').fill('newpassword1')
    const submit = page.getByRole('button', { name: 'Update Password', exact: true })
    await submit.click()

    await expect(page.getByText('Current password is incorrect')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Updating…', exact: true })).toHaveCount(0)
    await expect(submit).toBeEnabled()

    // A second attempt is still possible. react-toastify keeps the previous
    // toast in the DOM while it animates out, so target the newest one.
    await submit.click()
    await expect(page.getByText('Current password is incorrect').last()).toBeVisible()
    expect(calls).toBe(2)
  })

  test('a failed reset request leaves the form usable for another attempt', async ({ page }) => {
    let calls = 0
    await mockResetPasswordRequest(page.context(), {
      status: 500,
      body: {},
      onRequest: () => { calls += 1 },
    })

    await page.goto('/forgetpassword', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('you@university.edu').fill('student@example.com')
    const submit = page.getByRole('button', { name: 'Send Reset Link', exact: true })
    await submit.click()

    await expect(page.locator('.auth-error')).toHaveText('Failed to send reset link.')
    await expect(page.getByRole('button', { name: 'Sending...', exact: true })).toHaveCount(0)
    await expect(submit).toBeEnabled()
    await expect(page.getByPlaceholder('you@university.edu')).toBeVisible()

    await submit.click()
    await expect(page.locator('.auth-error')).toHaveText('Failed to send reset link.')
    expect(calls).toBe(2)
  })
})