import { test, expect } from '@playwright/test'
import {
  blockExternalNetwork,
  makeArticle,
  makeHackathon,
  makeProfile,
  mockNewsPage,
  mockOpportunitiesPage,
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

async function openNews(page) {
  await page.goto('/news', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.in-hero-title')).toHaveText('IT Market News', { timeout: 20_000 })
}

async function openHackathons(page) {
  await page.goto('/hackathon', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.hk-hero-title')).toHaveText('Hackathons & Challenges')
}

function categoryButton(page, label) {
  return page.locator('.in-category').filter({ hasText: new RegExp(`^${label}$`) })
}

function hackathonFilter(page, label) {
  return page.getByRole('button', { name: label, exact: true })
}

const AI_1 = makeArticle({ id: 'ai-0', title: 'AI Funding Rebounds in 2026', category: 'AI', source: 'TechWire' })
const AI_2 = makeArticle({ id: 'ai-1', title: 'Open Models Gain Ground', category: 'AI', source: 'TechWire' })
const AI_3 = makeArticle({ id: 'ai-2', title: 'Chip Demand Surges', category: 'AI', source: 'SiliconBeat' })
const AI_4 = makeArticle({ id: 'ai-3', title: 'AI in Healthcare', category: 'AI', source: 'SiliconBeat' })
const SOFTWARE = makeArticle({ id: 'software-0', title: 'Rust Adoption Grows', category: 'Software', source: 'DevDaily' })

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

test.describe('news page', () => {
  test('an authenticated user can open the news page and view mocked articles', async ({ page }) => {
    await mockNewsPage(page.context(), {
      profile: makeProfile(),
      articles: [AI_1, AI_2, AI_3, AI_4],
    })
    await signIn(page)
    await openNews(page)

    // Hero and categories.
    await expect(page.locator('.in-hero-title')).toHaveText('IT Market News')
    await expect(categoryButton(page, 'All')).toBeVisible()
    await expect(categoryButton(page, 'AI')).toBeVisible()
    await expect(categoryButton(page, 'Software')).toBeVisible()

    // The first three articles are featured, the rest are compact rows.
    await expect(page.locator('.in-featured')).toHaveCount(3)
    await expect(page.locator('.in-featured-title')).toHaveText([
      AI_1.title,
      AI_2.title,
      AI_3.title,
    ])
    await expect(page.locator('.in-row')).toHaveCount(1)
    await expect(page.locator('.in-row-title')).toHaveText([AI_4.title])

    // Sidebar derives source stats and headlines from the mocked articles.
    await expect(page.locator('.in-sources')).toBeVisible()
    await expect(page.locator('.in-source-name')).toContainText(['TechWire', 'SiliconBeat'])
    await expect(page.locator('.in-headline')).toHaveCount(4)
    await expect(page.locator('.in-newsletter')).toBeVisible()

    // No error/loading leftovers.
    await expect(page.locator('.in-error')).toHaveCount(0)
    await expect(page.locator('.in-skeleton')).toHaveCount(0)
  })

  test('the loading skeleton is shown while news is being fetched', async ({ page }) => {
    let calls = 0
    await mockNewsPage(page.context(), {
      profile: makeProfile(),
      articles: [AI_1],
      onNews: async () => {
        // The initial mount (React StrictMode fires it twice) resolves fast so
        // the page is fully warmed up; the Refresh below is the delayed fetch
        // used to observe the loading skeleton deterministically.
        calls += 1
        if (calls > 2) await new Promise((resolve) => setTimeout(resolve, 2500))
        return null
      },
    })
    await signIn(page)
    await openNews(page)
    await expect(page.locator('.in-featured')).toHaveCount(1)

    await page.getByRole('button', { name: /Refresh/ }).click()
    await expect(page.locator('.in-skeleton')).toBeVisible()
    await expect(page.locator('.in-skeleton')).toHaveCount(0, { timeout: 10_000 })
    await expect(page.locator('.in-featured')).toHaveCount(1)
  })

  test('an empty result set shows the empty state', async ({ page }) => {
    await mockNewsPage(page.context(), { profile: makeProfile(), articles: [] })
    await signIn(page)
    await openNews(page)

    await expect(page.locator('.in-empty')).toBeVisible()
    await expect(page.locator('.in-empty p')).toHaveText('No news available right now.')
    await expect(page.locator('.in-featured')).toHaveCount(0)
  })

  test('a news API error shows the failure state and can be retried', async ({ page }) => {
    let fail = true
    await mockNewsPage(page.context(), {
      profile: makeProfile(),
      articles: [AI_1],
      onNews: async () => (fail ? { status: 502, body: { error: 'News upstream down' } } : null),
    })
    await signIn(page)
    await openNews(page)

    await expect(page.locator('.in-error')).toBeVisible()
    await expect(page.locator('.in-error h3')).toHaveText('Failed to load news')
    await expect(page.locator('.in-error p')).toHaveText('News upstream down')
    await expect(page.locator('.in-featured')).toHaveCount(0)

    fail = false
    await page.getByRole('button', { name: 'Try Again' }).click()
    await expect(page.locator('.in-error')).toHaveCount(0)
    await expect(page.locator('.in-featured')).toHaveCount(1)
    await expect(page.locator('.in-featured-title')).toHaveText([AI_1.title])
  })

  test('selecting a category requests that category and narrows the list', async ({ page }) => {
    const urls = []
    await mockNewsPage(page.context(), {
      profile: makeProfile(),
      articles: [AI_1, SOFTWARE],
      onNews: async (req) => {
        urls.push(req.url())
        return null
      },
    })
    await signIn(page)
    await openNews(page)

    await expect(page.locator('.in-featured')).toHaveCount(2)

    await categoryButton(page, 'AI').click()

    await expect(page.locator('.in-featured-title')).toHaveText([AI_1.title])
    expect(urls.some((u) => u.includes('category=ai'))).toBe(true)
  })

  test('searching filters the visible articles client-side without a new request', async ({ page }) => {
    const urls = []
    await mockNewsPage(page.context(), {
      profile: makeProfile(),
      articles: [AI_1, SOFTWARE],
      onNews: async (req) => {
        urls.push(req.url())
        return null
      },
    })
    await signIn(page)
    await openNews(page)
    await expect(page.locator('.in-featured')).toHaveCount(2)

    const before = urls.length
    await page.getByPlaceholder('Search news...').fill('Rust')

    await expect(page.locator('.in-featured-title')).toHaveText([SOFTWARE.title])
    expect(urls.length).toBe(before)
  })

  test('refreshing re-fetches the articles', async ({ page }) => {
    const urls = []
    await mockNewsPage(page.context(), {
      profile: makeProfile(),
      articles: [AI_1],
      onNews: async (req) => {
        urls.push(req.url())
        return null
      },
    })
    await signIn(page)
    await openNews(page)
    await expect(page.locator('.in-featured')).toHaveCount(1)

    const before = urls.length
    await page.getByRole('button', { name: /Refresh/ }).click()
    await expect.poll(() => urls.length).toBeGreaterThan(before)
  })
})

test.describe('hackathons page', () => {
  test('an authenticated user can open the hackathons page and view mocked hackathons', async ({ page }) => {
    const urls = []
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      hackathons: [GENESIS, OCEAN, CODE_FOR_GOOD],
      onHackathons: async (req) => {
        urls.push(req.url())
        return null
      },
    })
    await signIn(page)
    await openHackathons(page)

    await expect(page.locator('.hk-hero-inner').getByText('OPPORTUNITIES', { exact: true })).toBeVisible()
    await expect(page.locator('.hk-hero-stat-value').first()).toHaveText('3')

    await expect(page.locator('.hk-card')).toHaveCount(3)
    await expect(page.locator('.hk-card-title')).toHaveText([
      GENESIS.title,
      OCEAN.title,
      CODE_FOR_GOOD.title,
    ])
    await expect(page.locator('.hk-card').filter({ hasText: GENESIS.title }).getByText('OPEN', { exact: true })).toBeVisible()
    await expect(page.locator('.hk-card').filter({ hasText: OCEAN.title }).getByText('UPCOMING', { exact: true })).toBeVisible()
    await expect(page.locator('.hk-card').filter({ hasText: CODE_FOR_GOOD.title }).getByText('ENDED', { exact: true })).toBeVisible()
    await expect(page.locator('.hk-card').filter({ hasText: GENESIS.title }).getByText('$10,000', { exact: true })).toBeVisible()

    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) expect(url).toContain('status=open')
  })

  test('the loading state is shown while hackathons are being fetched', async ({ page }) => {
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      hackathons: [GENESIS],
      onHackathons: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1200))
        return null
      },
    })
    await signIn(page)
    await openHackathons(page)

    await expect(page.locator('.hk-loading')).toBeVisible()
    await expect(page.locator('.hk-loading p')).toHaveText('Loading hackathons...')
    await expect(page.locator('.hk-loading')).toHaveCount(0, { timeout: 5000 })
    await expect(page.locator('.hk-card')).toHaveCount(1)
  })

  test('an empty result set shows the empty state', async ({ page }) => {
    await mockOpportunitiesPage(page.context(), { profile: makeProfile(), hackathons: [] })
    await signIn(page)
    await openHackathons(page)

    await expect(page.locator('.hk-empty')).toBeVisible()
    await expect(page.locator('.hk-empty p')).toHaveText('No hackathons found for this filter.')
    await expect(page.locator('.hk-card')).toHaveCount(0)
  })

  test('an API error shows the failure state with its message', async ({ page }) => {
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      onHackathons: async () => ({ status: 502, body: { error: 'Devpost is unreachable' } }),
    })
    await signIn(page)
    await openHackathons(page)

    await expect(page.locator('.hk-error')).toBeVisible()
    await expect(page.locator('.hk-error h3')).toHaveText('Could not load hackathons')
    await expect(page.locator('.hk-error p')).toHaveText('Devpost is unreachable')
    await expect(page.locator('.hk-card')).toHaveCount(0)
  })

  test('status filters narrow the list', async ({ page }) => {
    await mockOpportunitiesPage(page.context(), {
      profile: makeProfile(),
      hackathons: [GENESIS, OCEAN, CODE_FOR_GOOD],
    })
    await signIn(page)
    await openHackathons(page)
    await expect(page.locator('.hk-card')).toHaveCount(3)

    await hackathonFilter(page, 'Open').click()
    await expect(page.locator('.hk-card-title')).toHaveText([GENESIS.title])

    await hackathonFilter(page, 'Upcoming').click()
    await expect(page.locator('.hk-card-title')).toHaveText([OCEAN.title])

    await hackathonFilter(page, 'Ended').click()
    await expect(page.locator('.hk-card-title')).toHaveText([CODE_FOR_GOOD.title])

    await hackathonFilter(page, 'All (3)').click()
    await expect(page.locator('.hk-card')).toHaveCount(3)
  })
})
