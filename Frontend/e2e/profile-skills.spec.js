import { test, expect } from '@playwright/test'
import { blockExternalNetwork, makeProfile, mockProfilePage } from './helpers.js'

test.beforeEach(async ({ context }) => {
  await blockExternalNetwork(context)
})

const PYTHON = { id: 11, name: 'Python', percentage: 50, color: '#4F6BFF' }
const REACT = { id: 12, name: 'React', percentage: 75, color: '#2D8A56' }

async function signIn(page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('you@university.edu').fill('ava@example.com')
  await page.getByPlaceholder('Enter your password').fill('correct-horse-battery')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page.locator('.nav-username')).toHaveText('Ava Chen')
}

function settingsInput(page, label) {
  return page
    .locator('.ug-input-group')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('input')
}

function settingsSelect(page, label) {
  return page
    .locator('.profile-edit-half')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('select')
}

function fieldValue(page, label) {
  return page
    .locator('.profile-field')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('.profile-field-value')
}

function statCardValue(page, label) {
  return page
    .locator('.profile-stat-card')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('.profile-stat-value')
}

function openSkillsTab(page) {
  return page.getByRole('tab', { name: /Skills/ }).click()
}

function openAddSkillModal(page) {
  return page.getByRole('button', { name: 'Add Skill', exact: true }).click()
}

function submitAddSkill(page) {
  return page.locator('.ug-modal').getByRole('button', { name: 'Add Skill', exact: true }).click()
}

test.describe('profile and skills journeys', () => {
  test('an authenticated user can open the profile page and see mocked profile data', async ({ page }) => {
    await mockProfilePage(page.context(), { profile: makeProfile({ skills: [PYTHON] }) })
    await signIn(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Ava Chen' })).toBeVisible()
    await expect(page.locator('.profile-identity-email')).toHaveText('ava@example.com')
    await expect(page.locator('.profile-identity-top').getByText('Active Student')).toBeVisible()
    await expect(statCardValue(page, 'Profile Completion')).toHaveText('60%')
    await expect(statCardValue(page, 'Skills Added')).toHaveText('1')
    await expect(page.locator('.profile-section-title').first()).toBeVisible()
    await expect(page.getByText('Python · Intermediate')).toBeVisible()
  })

  test('profile fields display existing values correctly', async ({ page }) => {
    await mockProfilePage(page.context(), { profile: makeProfile({ skills: [PYTHON] }) })
    await signIn(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('.profile-identity-education')).toHaveText('Undergraduate · Computer Science · 3rd Year')

    await expect(page.locator('.profile-about-text')).toHaveText('Passionate CS student.')
    const interests = page.locator('.profile-section').filter({ has: page.getByText('Interests', { exact: true }) })
    await expect(interests.locator('.profile-chips').getByText('AI', { exact: true })).toBeVisible()
    await expect(interests.locator('.profile-chips').getByText('Web Development', { exact: true })).toBeVisible()
    await expect(page.locator('.profile-goal-text')).toHaveText('Become a Machine Learning Engineer')

    await expect(fieldValue(page, 'University / Institution')).toHaveText('Cape Town University')
    await expect(fieldValue(page, 'Program / Course')).toHaveText('Computer Science')
    await expect(fieldValue(page, 'Year of Study')).toHaveText('3rd Year')
    await expect(fieldValue(page, 'Academic Performance')).toHaveText('CGPA 8.5/10')
    await expect(fieldValue(page, 'Preferred Location')).toHaveText('Cape Town')
    await expect(fieldValue(page, 'Preferred Country')).toHaveText('South Africa')
    await expect(fieldValue(page, 'Budget')).toHaveText('$15,000/year')
  })

  test('valid profile edits send the expected API payload and show the success feedback', async ({ page }) => {
    const puts = []
    await mockProfilePage(page.context(), {
      profile: makeProfile({ skills: [PYTHON] }),
      onPut: async (req) => {
        puts.push(req.postDataJSON())
        return null
      },
    })
    await signIn(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    await page.getByRole('button', { name: 'Edit Profile', exact: true }).click()
    await expect(settingsInput(page, 'First Name')).toHaveValue('Ava')
    await expect(settingsInput(page, 'Last Name')).toHaveValue('Chen')
    await expect(settingsInput(page, 'Institution / University')).toHaveValue('Cape Town University')
    await expect(settingsSelect(page, 'Education Level')).toHaveValue('undergraduate')

    await settingsInput(page, 'Institution / University').fill('New University')
    await settingsInput(page, 'Program / Course').fill('Data Science')
    await settingsInput(page, 'Budget').fill('$20,000/year')
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click()

    await expect(page.getByText('Profile updated successfully')).toBeVisible()

    expect(puts).toHaveLength(1)
    expect(puts[0]).toMatchObject({
      first_name: 'Ava',
      last_name: 'Chen',
      institution: 'New University',
      course: 'Data Science',
      budget: '$20,000/year',
    })
    expect(puts[0]).not.toHaveProperty('profile_picture')

    // Success returns to the Overview tab, now reflecting the saved values.
    await expect(page.locator('.profile-section-title').filter({ hasText: 'About' })).toBeVisible()
    await expect(page.locator('.profile-identity-education')).toHaveText('Undergraduate · Data Science · 3rd Year')
    await expect(fieldValue(page, 'University / Institution')).toHaveText('New University')
  })

  test('profile validation and failed update responses are handled correctly', async ({ page }) => {
    const puts = []
    await mockProfilePage(page.context(), {
      profile: makeProfile({ skills: [PYTHON] }),
      onPut: async (req) => {
        puts.push(req.postDataJSON())
        return { status: 400, body: { budget: ['budget must be at most 300 characters'] } }
      },
    })
    await signIn(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    await page.getByRole('button', { name: 'Edit Profile', exact: true }).click()
    await expect(settingsInput(page, 'Budget')).toHaveValue('$15,000/year')

    const oversized = 'x'.repeat(320)
    await settingsInput(page, 'Budget').fill(oversized)
    const save = page.getByRole('button', { name: 'Save Changes', exact: true })
    await save.click()

    // The DRF field error is surfaced in a toast.
    await expect(page.getByText('budget must be at most 300 characters')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Saving…', exact: true })).toHaveCount(0)
    await expect(save).toBeEnabled()
    // Still on the Settings tab — the failed save does not navigate away.
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible()
    expect(puts).toHaveLength(1)
    expect(puts[0]).toHaveProperty('budget', oversized)
  })

  test('a failed profile save leaves the form usable for another attempt', async ({ page }) => {
    let puts = 0
    await mockProfilePage(page.context(), {
      profile: makeProfile({ skills: [PYTHON] }),
      onPut: async () => {
        puts += 1
        // First attempt fails hard; the second uses the default success path.
        return puts === 1 ? { status: 500, body: {} } : null
      },
    })
    await signIn(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    await page.getByRole('button', { name: 'Edit Profile', exact: true }).click()
    await settingsInput(page, 'Institution / University').fill('Retry University')
    const save = page.getByRole('button', { name: 'Save Changes', exact: true })
    await save.click()

    await expect(page.getByText('Could not save profile')).toBeVisible()
    await expect(save).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Saving…', exact: true })).toHaveCount(0)

    await save.click()
    await expect(page.getByText('Profile updated successfully')).toBeVisible()
    await expect(fieldValue(page, 'University / Institution')).toHaveText('Retry University')
    expect(puts).toBe(2)
  })

  test('skills load and display correctly', async ({ page }) => {
    await mockProfilePage(page.context(), { profile: makeProfile({ skills: [PYTHON, REACT] }) })
    await signIn(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    await expect(statCardValue(page, 'Skills Added')).toHaveText('2')
    await expect(page.getByRole('tab', { name: /Skills/ }).locator('.ug-tab-count')).toHaveText('2')

    await openSkillsTab(page)
    await expect(page.getByRole('heading', { name: 'Your Skills' })).toBeVisible()
    await expect(page.locator('.profile-skill-card')).toHaveCount(2)
    await expect(page.locator('.profile-skill-name')).toHaveText(['Python', 'React'])
    await expect(page.getByText('Intermediate')).toBeVisible()
    await expect(page.getByText('Advanced')).toBeVisible()
  })

  test('a user can add a skill using the actual UI and expected request format', async ({ page }) => {
    let addPayload = null
    await mockProfilePage(page.context(), {
      profile: makeProfile({ skills: [PYTHON] }),
      onSkillAdd: async (req) => {
        addPayload = req.postDataJSON()
        return null
      },
    })
    await signIn(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    await openSkillsTab(page)
    await openAddSkillModal(page)
    await expect(page.locator('.ug-modal-title')).toHaveText('Add Skill')

    await page.getByPlaceholder('e.g. Python, Design, Marketing').fill('TypeScript')
    await page.locator('.ug-modal').getByRole('button', { name: 'Advanced', exact: true }).click()
    await submitAddSkill(page)

    await expect(page.getByText('"TypeScript" added to your skills')).toBeVisible()

    expect(addPayload).toEqual({ name: 'TypeScript', percentage: 75 })
    await expect(page.locator('.ug-modal')).toHaveCount(0)

    // The list updates from the add skill response, without a reload.
    await expect(page.locator('.profile-skill-card')).toHaveCount(2)
    await expect(page.locator('.profile-skill-name')).toHaveText(['Python', 'TypeScript'])
    await expect(page.getByRole('tab', { name: /Skills/ }).locator('.ug-tab-count')).toHaveText('2')
  })

  test('adding an existing skill follows the application duplicate/upsert behavior', async ({ page }) => {
    let addPayload = null
    const existing = { id: 5, name: 'Python', percentage: 50, color: '#4F6BFF' }
    await mockProfilePage(page.context(), {
      profile: makeProfile({ skills: [existing] }),
      onSkillAdd: async (req) => {
        addPayload = req.postDataJSON()
        // Case-insensitive upsert: same id returned, updated in place.
        return { status: 200, body: { id: 5, name: 'Python', percentage: 75, color: '#4F6BFF' } }
      },
    })
    await signIn(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    await openSkillsTab(page)
    await openAddSkillModal(page)
    await page.getByPlaceholder('e.g. Python, Design, Marketing').fill('python')
    await page.locator('.ug-modal').getByRole('button', { name: 'Advanced', exact: true }).click()
    await submitAddSkill(page)

    await expect(page.getByText('"python" added to your skills')).toBeVisible()

    expect(addPayload).toEqual({ name: 'python', percentage: 75 })
    await expect(page.locator('.ug-modal')).toHaveCount(0)

    // No second card is created and the proficiency upgrades in place.
    await expect(page.locator('.profile-skill-card')).toHaveCount(1)
    await expect(page.locator('.profile-skill-name')).toHaveText(['Python'])
    await expect(page.locator('.profile-skill-card').getByText('Advanced')).toBeVisible()
    await expect(page.locator('.profile-skill-card').getByText('Intermediate')).toHaveCount(0)
    await expect(page.getByRole('tab', { name: /Skills/ }).locator('.ug-tab-count')).toHaveText('1')
  })

  test('a user can remove a skill and sees the updated UI', async ({ page }) => {
    const deletes = []
    await mockProfilePage(page.context(), {
      profile: makeProfile({ skills: [PYTHON, REACT] }),
      onSkillDelete: async (req) => {
        deletes.push(req.url())
        return null
      },
    })
    await signIn(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    await openSkillsTab(page)
    await expect(page.locator('.profile-skill-card')).toHaveCount(2)

    await page.getByRole('button', { name: 'Remove React', exact: true }).click()

    await expect(page.getByText('Skill removed')).toBeVisible()
    expect(deletes).toHaveLength(1)
    expect(deletes[0]).toMatch(/\/students\/skills\/12\/$/)

    await expect(page.locator('.profile-skill-card')).toHaveCount(1)
    await expect(page.locator('.profile-skill-name')).toHaveText(['Python'])
    await expect(page.getByText('React')).toHaveCount(0)
    await expect(page.getByRole('tab', { name: /Skills/ }).locator('.ug-tab-count')).toHaveText('1')
    await expect(statCardValue(page, 'Skills Added')).toHaveText('1')
  })

  test('skills API failures show appropriate feedback without leaving the interface stuck', async ({ page }) => {
    let adds = 0
    await mockProfilePage(page.context(), {
      profile: makeProfile({ skills: [PYTHON] }),
      onSkillAdd: async () => {
        adds += 1
        // First attempt fails; the second uses the default success path.
        return adds === 1 ? { status: 500, body: {} } : null
      },
    })
    await signIn(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    await openSkillsTab(page)
    await openAddSkillModal(page)
    await page.getByPlaceholder('e.g. Python, Design, Marketing').fill('Docker')
    await page.locator('.ug-modal').getByRole('button', { name: 'Beginner', exact: true }).click()

    await submitAddSkill(page)
    await expect(page.getByText('Could not add skill')).toBeVisible()

    // The modal stays open and the button stays usable for another attempt.
    await expect(page.locator('.ug-modal-title')).toHaveText('Add Skill')
    await expect(page.locator('.ug-modal').getByRole('button', { name: 'Add Skill', exact: true })).toBeEnabled()

    await submitAddSkill(page)
    await expect(page.getByText('"Docker" added to your skills')).toBeVisible()
    await expect(page.locator('.ug-modal')).toHaveCount(0)

    expect(adds).toBe(2)
    await expect(page.locator('.profile-skill-card')).toHaveCount(2)
    await expect(page.locator('.profile-skill-name')).toHaveText(['Python', 'Docker'])
  })
})