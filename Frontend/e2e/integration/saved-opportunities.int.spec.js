import { test, expect } from '@playwright/test'

import {
  API_BASE,
  authHeaders,
  blockExternal,
  installTokens,
  loginViaUI,
  newAuthedPage,
  provisionUser,
} from './support/flows.js'

// ─── Phase 4B integration: saved opportunities ──────────────────────
// Drives the REAL frontend against the REAL local Django API. No application
// API request (saved-opportunities, hackathons, auth) is intercepted or
// mocked. The deterministic hackathon fixtures come from the backend's
// test-only provider stub (Backend/e2e/stubs.py). Only external services
// (Google identity, fonts) are blocked.

const PASSWORD = 'E2e-Passw0rd!'

const GENESIS = {
  id: '27282',
  title: 'Genesis AI Hackathon',
  url: 'https://genesis-ai.devpost.com',
  organizer: 'Genesis Labs',
  mode: 'Online',
  deadline: 'Jan 15, 2027',
  prize: '$10,000',
}
const OCEAN = {
  id: 'ocean-2027',
  title: 'Hack the Ocean',
  url: 'https://hack-the-ocean.devpost.com',
  organizer: 'Ocean Network',
  mode: 'Hybrid',
  deadline: 'Feb 1, 2027',
  prize: '$5,000 pool',
}
const CODE_FOR_GOOD = {
  id: '33001',
  title: 'Code for Good',
  url: 'https://code-for-good.devpost.com',
  organizer: 'Good Corps',
  mode: 'Offline',
  deadline: 'Dec 1, 2026',
  prize: 'TBA',
}

const CREATE_SAVED = (r) =>
  r.url().includes('/api/v1/students/saved-opportunities/') &&
  r.request().method() === 'POST'
const DELETE_SAVED = (r) =>
  /\/api\/v1\/students\/saved-opportunities\/\d+\/$/.test(r.url()) &&
  r.request().method() === 'DELETE'

function card(page, title) {
  return page.locator('.hk-card').filter({ has: page.getByText(title, { exact: true }) })
}

function cardButton(page, title, name) {
  return card(page, title).getByRole('button', { name, exact: true })
}

function filterButton(page, label) {
  return page.getByRole('button', { name: label, exact: true })
}

async function gotoOpportunities(page) {
  await page.goto('/opportunities', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Opportunities & Hackathons' })).toBeVisible()
  await expect(page.locator('.hk-card')).toHaveCount(3)
}

async function saveCardViaUI(page, title) {
  const responsePromise = page.waitForResponse(CREATE_SAVED)
  await cardButton(page, title, 'Save').click()
  const response = await responsePromise
  return {
    status: response.status(),
    body: await response.json(),
    requestBody: response.request().postDataJSON(),
  }
}

async function removeCardViaUI(page, title) {
  const responsePromise = page.waitForResponse(DELETE_SAVED)
  await cardButton(page, title, 'Saved').click()
  const response = await responsePromise
  return { status: response.status(), url: response.url() }
}

async function apiListSaved(request, user) {
  const res = await request.get(`${API_BASE}/students/saved-opportunities/`, {
    headers: authHeaders(user),
  })
  expect(res.status()).toBe(200)
  return res.json()
}

async function uiSignIn(context, user) {
  await installTokens(context, user)
}

const savedSection = (page) =>
  page
    .locator('.journey-section')
    .filter({ has: page.getByRole('heading', { name: 'Saved Opportunities' }) })

test.describe('real stack: saved opportunities', () => {
  test.beforeEach(async ({ context }) => {
    await blockExternal(context)
  })

  // 1. Authenticated users see the deterministic hackathon cards.
  test('a signed-in user sees the three deterministic hackathon cards', async ({
    page,
    request,
  }) => {
    const user = await provisionUser(request, { firstName: 'E2E', lastName: 'Student' })
    await loginViaUI(page, user)
    await gotoOpportunities(page)

    await expect(page.locator('.hk-card-title')).toHaveText([
      GENESIS.title,
      OCEAN.title,
      CODE_FOR_GOOD.title,
    ])

    // Status badges come from the normalized open_state.
    await expect(card(page, GENESIS.title).getByText('OPEN', { exact: true })).toBeVisible()
    await expect(card(page, OCEAN.title).getByText('UPCOMING', { exact: true })).toBeVisible()
    await expect(card(page, CODE_FOR_GOOD.title).getByText('ENDED', { exact: true })).toBeVisible()

    // Normalized prize/participants/tags.
    await expect(card(page, GENESIS.title).getByText('$10,000', { exact: true })).toBeVisible()
    await expect(card(page, GENESIS.title).getByText('1,200', { exact: true })).toBeVisible()
    await expect(card(page, GENESIS.title).getByText('AI', { exact: true })).toBeVisible()
    // HTML in the upstream prize is stripped by the real backend.
    await expect(card(page, OCEAN.title).getByText('$5,000 pool', { exact: true })).toBeVisible()
    // Empty upstream prize normalizes to TBA.
    await expect(card(page, CODE_FOR_GOOD.title).getByText('TBA', { exact: true })).toBeVisible()
  })

  // 2. Saving sends the correct real POST and updates the UI.
  test('saving sends the correct real POST and updates the UI', async ({
    page,
    context,
    request,
  }) => {
    const user = await provisionUser(request)
    await uiSignIn(context, user)
    await gotoOpportunities(page)

    const result = await saveCardViaUI(page, GENESIS.title)

    expect(result.status).toBe(201)
    expect(result.requestBody).toEqual({
      opportunity_id: GENESIS.id,
      source: 'hackathon',
      title: GENESIS.title,
      url: GENESIS.url,
      organizer: GENESIS.organizer,
      location: GENESIS.mode,
      deadline: GENESIS.deadline,
      prize: GENESIS.prize,
    })
    expect(result.body.opportunity_id).toBe(GENESIS.id)

    await expect(page.getByText('Saved to your journey').first()).toBeVisible()
    await expect(cardButton(page, GENESIS.title, 'Saved')).toBeVisible()
    await expect(filterButton(page, 'Saved (1)')).toBeVisible()
  })

  // 3. The saved record persists in uniguide_ai_e2e.
  test('the saved record persists in the isolated test database', async ({
    page,
    context,
    request,
  }) => {
    const user = await provisionUser(request)
    await uiSignIn(context, user)
    await gotoOpportunities(page)

    const result = await saveCardViaUI(page, GENESIS.title)
    const savedId = result.body.id

    // Proven through the real API (no direct DB access from the test).
    const list = await apiListSaved(request, user)
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(savedId)
    expect(list[0].opportunity_id).toBe(GENESIS.id)
    expect(list[0].title).toBe(GENESIS.title)

    // And survives a full page reload.
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('.hk-card')).toHaveCount(3)
    await expect(cardButton(page, GENESIS.title, 'Saved')).toBeVisible()
  })

  // 4. Reloading or revisiting Opportunities and My Journey restores state.
  test('revisiting Opportunities and My Journey restores the saved state', async ({
    page,
    context,
    request,
  }) => {
    const user = await provisionUser(request)
    await uiSignIn(context, user)
    await gotoOpportunities(page)

    await saveCardViaUI(page, GENESIS.title)

    await page.goto('/my-journey', { waitUntil: 'domcontentloaded' })
    await expect(savedSection(page).locator('.journey-opp-title')).toHaveText([GENESIS.title])

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(savedSection(page).locator('.journey-opp-title')).toHaveText([GENESIS.title])

    await gotoOpportunities(page)
    await expect(cardButton(page, GENESIS.title, 'Saved')).toBeVisible()
    await expect(filterButton(page, 'Saved (1)')).toBeVisible()
  })

  // 5. User B cannot see User A's saved opportunities.
  test("user B cannot see user A's saved opportunities", async ({
    page,
    context,
    browser,
    request,
  }) => {
    const userA = await provisionUser(request, { firstName: 'Alpha', lastName: 'User' })
    await uiSignIn(context, userA)
    await gotoOpportunities(page)
    await saveCardViaUI(page, GENESIS.title)

    const userB = await provisionUser(request, { firstName: 'Bravo', lastName: 'User' })
    const { context: contextB, page: pageB } = await newAuthedPage(browser, userB)

    await pageB.goto('/my-journey', { waitUntil: 'domcontentloaded' })
    await expect(savedSection(pageB).getByText('No saved opportunities yet.')).toBeVisible()

    await pageB.goto('/opportunities', { waitUntil: 'domcontentloaded' })
    await expect(pageB.locator('.hk-card')).toHaveCount(3)
    await expect(pageB.locator('.hk-card').getByRole('button', { name: 'Saved', exact: true })).toHaveCount(0)
    await expect(filterButton(pageB, 'Saved (0)')).toBeVisible()

    // A's record still exists; B's list is empty.
    expect(await apiListSaved(request, userA)).toHaveLength(1)
    expect(await apiListSaved(request, userB)).toHaveLength(0)

    await contextB.close()
  })

  // 6. Repeated saves use the backend duplicate behavior, one DB record.
  test('repeated saves reuse the backend duplicate row and create one record', async ({
    page,
    context,
    request,
  }) => {
    const user = await provisionUser(request)
    await uiSignIn(context, user)
    await gotoOpportunities(page)

    const first = await saveCardViaUI(page, GENESIS.title)
    expect(first.status).toBe(201)

    // A second real POST for the same opportunity_id hits the dedupe path.
    const dup = await request.post(`${API_BASE}/students/saved-opportunities/`, {
      headers: authHeaders(user),
      data: { opportunity_id: GENESIS.id, source: 'hackathon', title: GENESIS.title },
    })
    expect(dup.status()).toBe(200)
    expect((await dup.json()).id).toBe(first.body.id)

    const list = await apiListSaved(request, user)
    expect(list).toHaveLength(1)
    expect(list.filter((o) => o.opportunity_id === GENESIS.id)).toHaveLength(1)
  })

  // 7. Numeric and string opportunity_id values are normalized.
  test('numeric and string opportunity_id values normalize to one record', async ({
    page,
    context,
    request,
  }) => {
    const user = await provisionUser(request)
    await uiSignIn(context, user)
    await gotoOpportunities(page)

    // The numeric hackathon id (27282) is sent by the UI as a string.
    const viaUi = await saveCardViaUI(page, GENESIS.title)
    expect(viaUi.requestBody.opportunity_id).toBe('27282')
    expect(typeof viaUi.body.opportunity_id).toBe('string')

    // A raw numeric id is normalized to its string form by the backend.
    const numeric = await request.post(`${API_BASE}/students/saved-opportunities/`, {
      headers: authHeaders(user),
      data: { opportunity_id: 555, source: 'hackathon', title: 'Numeric Id Hackathon' },
    })
    expect(numeric.status()).toBe(201)
    const numericBody = await numeric.json()
    expect(numericBody.opportunity_id).toBe('555')

    // The string form of the same id dedupes onto the numeric-created row.
    const stringy = await request.post(`${API_BASE}/students/saved-opportunities/`, {
      headers: authHeaders(user),
      data: { opportunity_id: '555', source: 'hackathon', title: 'Numeric Id Hackathon' },
    })
    expect(stringy.status()).toBe(200)
    expect((await stringy.json()).id).toBe(numericBody.id)

    const list = await apiListSaved(request, user)
    expect(list.filter((o) => o.opportunity_id === '555')).toHaveLength(1)
  })

  // 8. Removing uses the correct DB record id and updates the UI.
  test('removing a saved opportunity targets its database record id', async ({
    page,
    context,
    request,
  }) => {
    const user = await provisionUser(request)
    await uiSignIn(context, user)
    await gotoOpportunities(page)

    const saved = await saveCardViaUI(page, GENESIS.title)
    const savedId = saved.body.id

    const removed = await removeCardViaUI(page, GENESIS.title)
    expect(removed.status).toBe(200)
    expect(removed.url).toMatch(
      new RegExp(`/api/v1/students/saved-opportunities/${savedId}/$`)
    )

    await expect(page.getByText('Removed from saved').first()).toBeVisible()
    await expect(cardButton(page, GENESIS.title, 'Save')).toBeVisible()
    await expect(filterButton(page, 'Saved (0)')).toBeVisible()
    expect(await apiListSaved(request, user)).toHaveLength(0)
  })

  // 9. A deleted opportunity stays deleted after reloading.
  test('a deleted opportunity stays deleted after reloading', async ({
    page,
    context,
    request,
  }) => {
    const user = await provisionUser(request)
    await uiSignIn(context, user)
    await gotoOpportunities(page)

    await saveCardViaUI(page, GENESIS.title)
    await removeCardViaUI(page, GENESIS.title)

    await page.goto('/my-journey', { waitUntil: 'domcontentloaded' })
    await expect(savedSection(page).getByText('No saved opportunities yet.')).toBeVisible()

    await gotoOpportunities(page)
    await expect(cardButton(page, GENESIS.title, 'Save')).toBeVisible()
    await expect(filterButton(page, 'Saved (0)')).toBeVisible()

    expect(await apiListSaved(request, user)).toHaveLength(0)
  })

  // 10. User B cannot delete User A's saved record (real authenticated 404).
  test("user B cannot delete user A's saved record", async ({ page, context, request }) => {
    const userA = await provisionUser(request, { firstName: 'Alpha', lastName: 'User' })
    await uiSignIn(context, userA)
    await gotoOpportunities(page)
    const saved = await saveCardViaUI(page, GENESIS.title)
    const savedId = saved.body.id

    const userB = await provisionUser(request, { firstName: 'Bravo', lastName: 'User' })

    // B attempts the deletion directly against the real API.
    const attempt = await request.delete(
      `${API_BASE}/students/saved-opportunities/${savedId}/`,
      { headers: authHeaders(userB) }
    )
    expect(attempt.status()).toBe(404)

    // A's record remains intact.
    const list = await apiListSaved(request, userA)
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(savedId)
  })

  // 11. Missing/malformed ids are client errors; bad/foreign pks 404 on delete.
  test('missing or malformed ids return client errors and unknown records 404', async ({
    request,
  }) => {
    const user = await provisionUser(request)
    const endpoint = `${API_BASE}/students/saved-opportunities/`

    const missing = await request.post(endpoint, {
      headers: authHeaders(user),
      data: {},
    })
    expect(missing.status()).toBe(400)
    expect((await missing.json()).error).toBe('opportunity_id is required')

    const blank = await request.post(endpoint, {
      headers: authHeaders(user),
      data: { opportunity_id: '   ' },
    })
    expect(blank.status()).toBe(400)
    expect((await blank.json()).error).toBe('opportunity_id is required')

    for (const bad of [true, 1.5, [], {}]) {
      const res = await request.post(endpoint, {
        headers: authHeaders(user),
        data: { opportunity_id: bad },
      })
      expect(res.status()).toBe(400)
      expect((await res.json()).error).toBe(
        'opportunity_id must be a non-empty string or integer'
      )
    }

    // A nonexistent database record id yields 404, not 500.
    const del = await request.delete(`${endpoint}987654321/`, {
      headers: authHeaders(user),
    })
    expect(del.status()).toBe(404)
    expect((await del.json()).error).toBe('Saved opportunity not found')
  })
})
