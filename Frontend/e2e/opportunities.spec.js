import { test, expect } from '@playwright/test'
import { blockExternalNetwork, makeHackathon, makeProfile, mockOpportunitiesPage } from './helpers.js'

test.beforeEach(async ({ context }) => {
  await blockExternalNetwork(context)
})

const GENESIS = makeHackathon()
const OCEAN = makeHackathon({
  id: '102',
  title: 'Hack the Ocean',
  organizer: 'Ocean Network',
  status: 'upcoming',
  mode: 'Hybrid',
  deadline: 'Feb 1, 2027',
  prize: '$5,000',
  participants: 340,
  tags: ['Sustainability'],
})
const CODE_FOR_GOOD = makeHackathon({
  id: '103',
  title: 'Code for Good',
  organizer: 'Good Corps',
  status: 'ended',
  mode: 'Offline',
  deadline: 'Dec 1, 2026',
  prize: 'TBA',
  participants: 80,
  tags: ['Social Impact'],
})
const SAVED_CODE_FOR_GOOD = {
  id: 7,
  opportunity_id: '103',
  source: 'hackathon',
  title: 'Code for Good',
  url: 'https://codeforgeod.devpost.com',
  organizer: 'Good Corps',
  location: 'Offline',
  deadline: 'Dec 1, 2026',
  prize: 'TBA',
  created_at: '2026-10-10T00:00:00Z',
}

async function signIn(page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('you@university.edu').fill('ava@example.com')
  await page.getByPlaceholder('Enter your password').fill('correct-horse-battery')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page.locator('.nav-username')).toHaveText('Ava Chen')
}

function card(page, title) {
  return page.locator('.hk-card').filter({ has: page.getByText(title, { exact: true }) })
}

function cardButton(page, title, name) {
  return card(page, title).getByRole('button', { name, exact: true })
}

function filterButton(page, label) {
  return page.getByRole('button', { name: label, exact: true })
}

async function openOpportunities(page) {
  await page.goto('/opportunities', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Opportunities & Hackathons' })).toBeVisible()
}

test.describe('opportunities and saved opportunities', () => {
  test('an authenticated user can open the opportunities page and view mocked opportunity data', async ({ page }) => {
    const hackathonUrls = []
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      hackathons: [GENESIS, OCEAN],
      onHackathons: async (req) => {
        hackathonUrls.push(req.url())
        return null
      },
    })
    await signIn(page)
    await openOpportunities(page)

    await expect(page.locator('.hk-hero-inner').getByText('OPPORTUNITIES', { exact: true })).toBeVisible()
    await expect(filterButton(page, 'All (2)')).toBeVisible()
    await expect(filterButton(page, 'Open')).toBeVisible()
    await expect(filterButton(page, 'Upcoming')).toBeVisible()
    await expect(filterButton(page, 'Ended')).toBeVisible()
    await expect(filterButton(page, 'Saved (0)')).toBeVisible()

    await expect(page.locator('.hk-card')).toHaveCount(2)
    await expect(page.locator('.hk-card-title')).toHaveText(['Genesis AI Hackathon', 'Hack the Ocean'])
    await expect(card(page, GENESIS.title).getByText('OPEN', { exact: true })).toBeVisible()
    await expect(card(page, OCEAN.title).getByText('UPCOMING', { exact: true })).toBeVisible()

    await expect(card(page, GENESIS.title).getByText('$10,000', { exact: true })).toBeVisible()
    await expect(card(page, GENESIS.title).getByText('1,200', { exact: true })).toBeVisible()
    await expect(card(page, GENESIS.title).getByText('AI', { exact: true })).toBeVisible()

    expect(hackathonUrls.length).toBeGreaterThan(0)
    for (const url of hackathonUrls) expect(url).toContain('status=open')
  })

  test('the loading state is shown while opportunities are being fetched', async ({ page }) => {
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      hackathons: [GENESIS],
      onHackathons: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1200))
        return null
      },
    })
    await signIn(page)
    await openOpportunities(page)

    await expect(page.locator('.hk-loading')).toBeVisible()
    await expect(page.locator('.hk-loading p')).toHaveText('Loading opportunities...')

    await expect(page.locator('.hk-loading')).toHaveCount(0)
    await expect(page.locator('.hk-card')).toHaveCount(1)
  })

  test('an empty result set shows the empty state', async ({ page }) => {
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      hackathons: [],
    })
    await signIn(page)
    await openOpportunities(page)

    await expect(page.locator('.hk-empty')).toBeVisible()
    await expect(page.locator('.hk-empty p')).toHaveText('No opportunities found for this filter.')
    await expect(page.locator('.hk-card')).toHaveCount(0)
  })

  test('an API error shows the failure state with its message', async ({ page }) => {
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      onHackathons: async () => ({ status: 500, body: { error: 'Upstream went boom' } }),
    })
    await signIn(page)
    await openOpportunities(page)

    await expect(page.locator('.hk-error')).toBeVisible()
    await expect(page.locator('.hk-error h3')).toHaveText('Could not load opportunities')
    await expect(page.locator('.hk-error p')).toHaveText('Upstream went boom')
    await expect(page.locator('.hk-card')).toHaveCount(0)
  })

  test('status filters narrow the list and the saved filter shows the empty copy when unused', async ({ page }) => {
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      hackathons: [GENESIS, OCEAN, CODE_FOR_GOOD],
    })
    await signIn(page)
    await openOpportunities(page)
    await expect(page.locator('.hk-card')).toHaveCount(3)

    await filterButton(page, 'Upcoming').click()
    await expect(page.locator('.hk-card')).toHaveCount(1)
    await expect(page.locator('.hk-card-title')).toHaveText(['Hack the Ocean'])

    await filterButton(page, 'Ended').click()
    await expect(page.locator('.hk-card')).toHaveCount(1)
    await expect(page.locator('.hk-card-title')).toHaveText(['Code for Good'])

    await filterButton(page, 'Open').click()
    await expect(page.locator('.hk-card')).toHaveCount(1)
    await expect(page.locator('.hk-card-title')).toHaveText(['Genesis AI Hackathon'])

    await filterButton(page, 'All (3)').click()
    await expect(page.locator('.hk-card')).toHaveCount(3)

    await filterButton(page, 'Saved (0)').click()
    await expect(page.locator('.hk-empty p')).toHaveText('No saved opportunities yet.')
  })

  test('saving an opportunity sends the expected request', async ({ page }) => {
    const savedPosts = []
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      hackathons: [GENESIS],
      onSavedPost: async (req) => {
        savedPosts.push({ method: req.method(), body: req.postDataJSON() })
        return null
      },
    })
    await signIn(page)
    await openOpportunities(page)

    await cardButton(page, GENESIS.title, 'Save').click()

    await expect(page.getByText('Saved to your journey')).toBeVisible()
    expect(savedPosts).toHaveLength(1)
    expect(savedPosts[0].method).toBe('POST')
    expect(savedPosts[0].body).toEqual({
      opportunity_id: '101',
      source: 'hackathon',
      title: 'Genesis AI Hackathon',
      url: 'https://genesis.devpost.com',
      organizer: 'Genesis Labs',
      location: 'Online',
      deadline: 'Jan 15, 2027',
      prize: '$10,000',
    })
  })

  test('the UI reflects a successful save on the card and in the saved filter', async ({ page }) => {
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      hackathons: [GENESIS],
    })
    await signIn(page)
    await openOpportunities(page)

    await cardButton(page, GENESIS.title, 'Save').click()

    await expect(cardButton(page, GENESIS.title, 'Saved')).toBeVisible()
    await expect(cardButton(page, GENESIS.title, 'Save')).toHaveCount(0)
    await expect(filterButton(page, 'Saved (1)')).toBeVisible()

    await filterButton(page, 'Saved (1)').click()
    await expect(page.locator('.hk-card')).toHaveCount(1)
    await expect(page.locator('.hk-card-title')).toHaveText(['Genesis AI Hackathon'])
    await expect(page.locator('.hk-empty')).toHaveCount(0)
  })

  test('a previously saved opportunity appears in the saved list', async ({ page }) => {
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      saved: [SAVED_CODE_FOR_GOOD],
      hackathons: [GENESIS, CODE_FOR_GOOD],
    })
    await signIn(page)
    await openOpportunities(page)

    await expect(filterButton(page, 'Saved (1)')).toBeVisible()
    // The pre-saved card shows the saved state in the All view.
    await expect(cardButton(page, CODE_FOR_GOOD.title, 'Saved')).toBeVisible()

    await filterButton(page, 'Saved (1)').click()
    await expect(page.locator('.hk-card')).toHaveCount(1)
    await expect(page.locator('.hk-card-title')).toHaveText(['Code for Good'])
    await expect(page.getByText('Genesis AI Hackathon')).toHaveCount(0)
  })

  test('a user can remove a saved opportunity and the UI updates', async ({ page }) => {
    const deletes = []
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      saved: [SAVED_CODE_FOR_GOOD],
      hackathons: [CODE_FOR_GOOD],
      onSavedDelete: async (req) => {
        deletes.push({ method: req.method(), url: req.url() })
        return null
      },
    })
    await signIn(page)
    await openOpportunities(page)

    await cardButton(page, CODE_FOR_GOOD.title, 'Saved').click()

    await expect(page.getByText('Removed from saved')).toBeVisible()
    expect(deletes).toHaveLength(1)
    expect(deletes[0].method).toBe('DELETE')
    expect(deletes[0].url).toMatch(/\/students\/saved-opportunities\/7\/$/)

    await expect(cardButton(page, CODE_FOR_GOOD.title, 'Save')).toBeVisible()
    await expect(filterButton(page, 'Saved (0)')).toBeVisible()

    await filterButton(page, 'Saved (0)').click()
    await expect(page.locator('.hk-empty p')).toHaveText('No saved opportunities yet.')
  })

  test('a save failure shows feedback, does not mark the card saved, and allows retrying', async ({ page }) => {
    let posts = 0
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      hackathons: [GENESIS],
      onSavedPost: async () => {
        posts += 1
        return posts === 1 ? { status: 400, body: { error: 'Could not save' } } : null
      },
    })
    await signIn(page)
    await openOpportunities(page)

    await cardButton(page, GENESIS.title, 'Save').click()
    await expect(page.getByText('Could not update saved opportunities')).toBeVisible()

    // Not marked as saved, not stuck, and the filter count is unchanged.
    await expect(cardButton(page, GENESIS.title, 'Save')).toBeVisible()
    await expect(cardButton(page, GENESIS.title, 'Save')).toBeEnabled()
    await expect(cardButton(page, GENESIS.title, 'Saved')).toHaveCount(0)
    await expect(filterButton(page, 'Saved (0)')).toBeVisible()

    await cardButton(page, GENESIS.title, 'Save').click()
    await expect(page.getByText('Saved to your journey')).toBeVisible()
    await expect(cardButton(page, GENESIS.title, 'Saved')).toBeVisible()
    await expect(filterButton(page, 'Saved (1)')).toBeVisible()
    expect(posts).toBe(2)
  })

  test('a removal failure is handled without wedging the interface or wrongly updating state', async ({ page }) => {
    let deletes = 0
    const savedRef = [SAVED_CODE_FOR_GOOD]
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      saved: savedRef,
      hackathons: [CODE_FOR_GOOD],
      onSavedDelete: async () => {
        deletes += 1
        return deletes === 1 ? { status: 500, body: {} } : null
      },
    })
    await signIn(page)
    await openOpportunities(page)

    await cardButton(page, CODE_FOR_GOOD.title, 'Saved').click()
    await expect(page.getByText('Could not update saved opportunities')).toBeVisible()

    // The card stays saved and the button remains usable.
    await expect(cardButton(page, CODE_FOR_GOOD.title, 'Saved')).toBeVisible()
    await expect(cardButton(page, CODE_FOR_GOOD.title, 'Saved')).toBeEnabled()
    await expect(filterButton(page, 'Saved (1)')).toBeVisible()
    expect(savedRef).toHaveLength(1)

    await cardButton(page, CODE_FOR_GOOD.title, 'Saved').click()
    await expect(page.getByText('Removed from saved')).toBeVisible()
    await expect(cardButton(page, CODE_FOR_GOOD.title, 'Save')).toBeVisible()
    await expect(filterButton(page, 'Saved (0)')).toBeVisible()
    expect(deletes).toBe(2)
  })

  test('repeated save actions never accumulate duplicate saved entries', async ({ page }) => {
    let posts = 0
    let deletes = 0
    const savedRef = []
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      saved: savedRef,
      hackathons: [GENESIS],
      onSavedPost: async () => {
        posts += 1
        return null
      },
      onSavedDelete: async () => {
        deletes += 1
        // The backend keeps the row (returns 200 without removing), so a
        // re-save goes down the duplicate/upsert path and returns the same row.
        return { status: 200, body: { message: 'Removed from saved opportunities' } }
      },
    })
    await signIn(page)
    await openOpportunities(page)

    await cardButton(page, GENESIS.title, 'Save').click()
    await expect(cardButton(page, GENESIS.title, 'Saved')).toBeVisible()
    await expect(filterButton(page, 'Saved (1)')).toBeVisible()

    // Toggle off (the DELETE succeeds client-side even though the server keeps the row).
    await cardButton(page, GENESIS.title, 'Saved').click()
    await expect(page.getByText('Removed from saved')).toBeVisible()
    await expect(cardButton(page, GENESIS.title, 'Save')).toBeVisible()
    await expect(filterButton(page, 'Saved (0)')).toBeVisible()

    // Re-saving hits the duplicate path: the server returns the existing row
    // (200) instead of creating a second one. The earlier "Saved to your
    // journey" toast may still be exiting, so assert the newest toast.
    await cardButton(page, GENESIS.title, 'Save').click()
    await expect(page.getByText('Saved to your journey').last()).toBeVisible()
    await expect(cardButton(page, GENESIS.title, 'Saved')).toBeVisible()

    expect(posts).toBe(2)
    expect(deletes).toBe(1)
    expect(savedRef).toHaveLength(1)
    expect(savedRef[0].opportunity_id).toBe('101')
    await expect(filterButton(page, 'Saved (1)')).toBeVisible()
    await expect(page.locator('.hk-card').getByRole('button', { name: 'Saved', exact: true })).toHaveCount(1)
  })
})