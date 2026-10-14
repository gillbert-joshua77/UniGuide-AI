import { test, expect } from '@playwright/test'
import {
  blockExternalNetwork,
  makeHackathon,
  makeJourney,
  makeProfile,
  mockJourneyPage,
} from './helpers.js'

test.beforeEach(async ({ context }) => {
  await blockExternalNetwork(context)
})

async function signIn(page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('you@university.edu').fill('ava@example.com')
  await page.getByPlaceholder('Enter your password').fill('correct-horse-battery')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page.locator('.nav-username')).toHaveText('Ava Chen')
}

async function openJourney(page) {
  await page.goto('/my-journey', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.journey-title')).toHaveText('My Journey', { timeout: 20_000 })
}

function recommendedCard(page, title) {
  return page
    .locator('.journey-section', { hasText: 'Recommended Opportunities' })
    .locator('.journey-opp-card')
    .filter({ hasText: title })
}

function savedCard(page, title) {
  return page
    .locator('.journey-section', { hasText: 'Saved Opportunities' })
    .locator('.journey-opp-card')
    .filter({ hasText: title })
}

const GENESIS = makeHackathon()

const SAVED_GENESIS = {
  id: 7,
  opportunity_id: '101',
  source: 'hackathon',
  title: 'Genesis AI Hackathon',
  url: 'https://genesis.devpost.com',
  organizer: 'Genesis Labs',
  location: 'Online',
  deadline: 'Jan 15, 2027',
  prize: '$10,000',
  created_at: '2026-10-10T00:00:00Z',
}

test.describe('my journey page', () => {
  test('an authenticated user can open the journey page and see their real profile signals', async ({ page }) => {
    await mockJourneyPage(page.context(), {
      profile: makeProfile(),
      journey: makeJourney(),
      hackathons: [GENESIS],
    })
    await signIn(page)
    await openJourney(page)

    await expect(page.locator('.journey-subtitle')).toHaveText("Where you're headed, based on your real profile.")

    // Readiness + completion cards.
    await expect(page.locator('.journey-readiness-primary')).toContainText('Career Readiness')
    await expect(page.locator('.journey-readiness-primary .journey-readiness-value')).toHaveText('55%')
    await expect(page.locator('.journey-readiness-secondary .journey-readiness-value')).toHaveText('60%')
    await expect(page.locator('.journey-readiness-secondary')).toContainText('2 skills added.')

    // Goals, skills to develop and the AI insight.
    await expect(page.locator('.journey-goal')).toHaveText('Become a Machine Learning Engineer')
    await expect(page.locator('.journey-skill-name')).toHaveText(['Statistics'])
    await expect(page.locator('.journey-ai-insight')).toContainText('You are around 55% career-ready.')

    // Recommended opportunities derived from the hackathons + interests.
    await expect(recommendedCard(page, GENESIS.title)).toBeVisible()

    // Applications from the journey payload.
    const app = page.locator('.journey-app-item').filter({ hasText: 'Data Intern' })
    await expect(app).toBeVisible()
    await expect(app).toContainText('Acme')

    // "Ask AI Guide" links into the guidance page.
    await expect(page.locator('.journey-header').getByRole('link', { name: 'Ask AI Guide' })).toHaveAttribute('href', '/guidance')
  })

  test('the loading state is shown while the journey is being fetched', async ({ page }) => {
    let delay = false
    await mockJourneyPage(page.context(), {
      profile: makeProfile(),
      journey: makeJourney(),
      hackathons: [],
      onJourney: async () => {
        if (delay) await new Promise((resolve) => setTimeout(resolve, 5000))
        return null
      },
    })
    await signIn(page)
    await openJourney(page)
    await expect(page.locator('.journey-readiness-value').first()).toHaveText('55%')

    // Reload with the journey response delayed so the skeleton is observable.
    delay = true
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('.journey-title')).toHaveCount(0)
    await expect(page.locator('.journey-title')).toHaveText('My Journey', { timeout: 30_000 })
    await expect(page.locator('.journey-readiness-value').first()).toHaveText('55%')
  })

  test('empty journey data shows the empty states for goals, skills, opportunities and applications', async ({ page }) => {
    await mockJourneyPage(page.context(), {
      profile: makeProfile(),
      journey: makeJourney({
        current_goals: '',
        skills_to_develop: [],
        applications: [],
        saved_opportunities_count: 0,
      }),
      hackathons: [],
    })
    await signIn(page)
    await openJourney(page)

    await expect(page.locator('.journey-empty', { hasText: 'No career goal added yet' })).toBeVisible()
    await expect(page.locator('.journey-empty', { hasText: "You're covering the key skills" })).toBeVisible()
    await expect(page.locator('.journey-empty', { hasText: 'No opportunities available right now.' })).toBeVisible()
    await expect(page.locator('.journey-empty', { hasText: 'No saved opportunities yet' })).toBeVisible()
    await expect(page.locator('.journey-empty', { hasText: 'No applications tracked yet.' })).toBeVisible()
    await expect(page.locator('.journey-opp-card')).toHaveCount(0)
  })

  test('a journey API error shows the failure state and retrying refetches', async ({ page }) => {
    let fail = true
    let calls = 0
    await mockJourneyPage(page.context(), {
      profile: makeProfile(),
      journey: makeJourney(),
      hackathons: [],
      onJourney: async () => {
        calls += 1
        return fail ? { status: 500, body: { detail: 'Journey service unavailable' } } : null
      },
    })
    await signIn(page)
    await page.goto('/my-journey', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('.journey-error')).toBeVisible()
    await expect(page.locator('.journey-error h3')).toHaveText("Couldn't load your journey")
    await expect(page.locator('.journey-error p')).toHaveText('Journey service unavailable')

    // The Retry button reloads the page; the retried request now succeeds.
    const before = calls
    fail = false
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect(page.locator('.journey-title')).toHaveText('My Journey', { timeout: 20_000 })
    await expect.poll(() => calls).toBeGreaterThan(before)
    await expect(page.locator('.journey-error')).toHaveCount(0)
  })

  test('saving a recommended opportunity sends the expected request and updates the UI', async ({ page }) => {
    const posts = []
    await mockJourneyPage(page.context(), {
      profile: makeProfile(),
      journey: makeJourney(),
      hackathons: [GENESIS],
      onSavedPost: async (req) => {
        posts.push({ method: req.method(), url: req.url(), body: req.postDataJSON() })
        return null
      },
    })
    await signIn(page)
    await openJourney(page)

    const card = recommendedCard(page, GENESIS.title)
    await card.getByRole('button', { name: 'Save', exact: true }).click()

    await expect(page.getByText('Saved to your journey').last()).toBeVisible()
    await expect(card.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()

    expect(posts).toHaveLength(1)
    expect(posts[0].method).toBe('POST')
    expect(posts[0].url).toMatch(/\/api\/v1\/students\/saved-opportunities\/$/)
    expect(posts[0].body).toMatchObject({
      opportunity_id: '101',
      source: 'hackathon',
      title: GENESIS.title,
    })
  })

  test('a failed save shows an error and keeps the opportunity unsaved', async ({ page }) => {
    await mockJourneyPage(page.context(), {
      profile: makeProfile(),
      journey: makeJourney(),
      hackathons: [GENESIS],
      onSavedPost: async () => ({ status: 500, body: { error: 'boom' } }),
    })
    await signIn(page)
    await openJourney(page)

    const card = recommendedCard(page, GENESIS.title)
    await card.getByRole('button', { name: 'Save', exact: true }).click()

    await expect(page.getByText('Could not update saved opportunities').last()).toBeVisible()
    await expect(card.getByRole('button', { name: 'Save', exact: true })).toBeVisible()
  })

  test('a saved opportunity can be removed from the journey page', async ({ page }) => {
    const deletes = []
    await mockJourneyPage(page.context(), {
      profile: makeProfile(),
      journey: makeJourney(),
      saved: [SAVED_GENESIS],
      hackathons: [GENESIS],
      onSavedDelete: async (req) => {
        deletes.push({ method: req.method(), url: req.url() })
        return null
      },
    })
    await signIn(page)
    await openJourney(page)

    const card = savedCard(page, SAVED_GENESIS.title)
    await expect(card).toBeVisible()
    await card.getByRole('button', { name: 'Remove', exact: true }).click()

    await expect(savedCard(page, SAVED_GENESIS.title)).toHaveCount(0)
    await expect(page.locator('.journey-empty', { hasText: 'No saved opportunities yet' })).toBeVisible()
    expect(deletes).toHaveLength(1)
    expect(deletes[0].method).toBe('DELETE')
    expect(deletes[0].url).toMatch(/\/api\/v1\/students\/saved-opportunities\/7\/$/)
  })

  test('an unauthenticated visitor sees the members-only guard on the journey route', async ({ page }) => {
    await page.goto('/my-journey', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/\/my-journey$/)
    await expect(page.locator('.ug-require-title')).toHaveText('Members only')
    await expect(page.locator('.journey-title')).toHaveCount(0)
  })
})
