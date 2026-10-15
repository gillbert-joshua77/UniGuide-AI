import { test, expect } from '@playwright/test'

import {
  API_BASE,
  authHeaders,
  blockExternal,
  installTokens,
  newAuthedPage,
  provisionUser,
} from './support/flows.js'

// ─── Phase 4C integration: AI chat ──────────────────────────────────
// Drives the REAL frontend against the REAL local Django API and the
// isolated `uniguide_ai_e2e` database. No application API request (chat,
// chat-session, auth) is intercepted or mocked. The deterministic AI
// replies/titles come from the backend test-only provider stub
// (Backend/e2e/stubs.py); only external services (Google, fonts) are blocked.

// The stub encodes the exact inputs it received, so the rendered reply can
// prove both the answer path and that the current user turn was not duplicated
// into the conversation history it was given.
const replyFor = (message, historyTurns = 0, repeated = false) =>
  `E2E test answer to "${message}". ` +
  `[history_turns=${historyTurns} repeated_current=${repeated}]`

const FAILURE_SENTINEL = '__e2e_gemini_failure__'
const FRONTEND_ERROR =
  'I apologize, but I encountered an issue processing your request. Please try again.'

const isChatPost = (r) =>
  /\/api\/v1\/uniguide\/chat\/$/.test(r.url()) && r.request().method() === 'POST'

async function openGuidance(page) {
  await page.goto('/guidance', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.ug-ai-sidebar-brand')).toHaveText('Guidance')
}

// Sends a message and resolves with the real POST response, which is observed
// (never intercepted).
async function sendChat(page, text) {
  const responsePromise = page.waitForResponse(isChatPost)
  await page.getByPlaceholder('Ask for guidance...').fill(text)
  await page.getByPlaceholder('Ask for guidance...').press('Enter')
  return responsePromise
}

// Waits until `substring` has rendered exactly once and the streamed reply for
// this submission has fully revealed (idle means exactly `replies` real bubbles
// and no bubble is still mid-reveal).
async function waitForReply(page, substring, replies) {
  await expect(
    page
      .locator('.ug-ai-msg-assistant .ug-ai-msg-bubble')
      .filter({ hasText: substring })
  ).toHaveCount(1)
  await expect(
    page.locator('.ug-ai-msg-assistant .ug-ai-msg-bubble:not(.ug-ai-typing)')
  ).toHaveCount(replies)
  await expect(page.locator('.ug-ai-msg-bubble-streaming')).toHaveCount(0)
}

async function apiListSessions(request, user) {
  const res = await request.get(`${API_BASE}/uniguide/chat/`, {
    headers: authHeaders(user),
  })
  expect(res.status()).toBe(200)
  return res.json()
}

async function apiGetSession(request, user, sessionId) {
  const res = await request.get(
    `${API_BASE}/uniguide/chat/sessions/${sessionId}/`,
    { headers: authHeaders(user) }
  )
  expect(res.status()).toBe(200)
  return res.json()
}

test.describe('real stack: AI chat', () => {
  test.beforeEach(async ({ context }) => {
    await blockExternal(context)
  })

  // 1. Open Guidance; the first message creates and persists a real session.
  test('opens Guidance and the real backend creates a session for the first message', async ({
    page,
    context,
    request,
  }) => {
    const user = await provisionUser(request)
    await installTokens(context, user)
    await openGuidance(page)

    await expect(page.locator('.ug-ai-empty-title')).toHaveText(
      'How can I guide you today?'
    )

    const response = await sendChat(page, 'hello uniguide')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.session_id).toBeTruthy()
    expect(body.reply).toBe(replyFor('hello uniguide', 0, false))

    // UI: the user bubble plus the deterministic assistant reply render.
    await expect(
      page.locator('.ug-ai-msg-user').getByText('hello uniguide')
    ).toBeVisible()
    await waitForReply(page, replyFor('hello uniguide'), 1)

    // Real API: exactly one user turn then one assistant turn were stored.
    const detail = await apiGetSession(request, user, body.session_id)
    expect(detail.messages.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(detail.messages[0].content).toBe('hello uniguide')
    expect(detail.messages[1].content).toBe(body.reply)
  })

  // 2. The AI-generated smart title replaces the truncated first message.
  test('the first conversation title follows the backend smart-title behavior', async ({
    page,
    context,
    request,
  }) => {
    const user = await provisionUser(request)
    await installTokens(context, user)
    await openGuidance(page)

    const response = await sendChat(page, 'first message title probe')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.title).toBe('E2E Chat')

    await waitForReply(page, replyFor('first message title probe'), 1)
    await expect(page.locator('.ug-ai-sidebar-item')).toHaveText(['E2E Chat'])

    const detail = await apiGetSession(request, user, body.session_id)
    expect(detail.title).toBe('E2E Chat')
    expect(detail.title).not.toBe('first message title probe')
  })

  // 3. Follow-up persists in order; the AI history excludes the current turn.
  test('a follow-up persists in order and the AI history excludes the current user turn', async ({
    page,
    context,
    request,
  }) => {
    const user = await provisionUser(request)
    await installTokens(context, user)
    await openGuidance(page)

    const first = await sendChat(page, 'alpha question')
    const firstBody = await first.json()
    await waitForReply(page, replyFor('alpha question'), 1)

    const second = await sendChat(page, 'beta follow up')
    const secondBody = await second.json()
    expect(secondBody.session_id).toBe(firstBody.session_id)
    // Exactly one prior exchange (user+model) is replayed, and the just-sent
    // turn is passed separately — never duplicated inside the history.
    expect(secondBody.reply).toBe(replyFor('beta follow up', 2, false))
    await waitForReply(page, replyFor('beta follow up', 2, false), 2)

    const detail = await apiGetSession(request, user, firstBody.session_id)
    expect(detail.messages.map((m) => m.role)).toEqual([
      'user',
      'assistant',
      'user',
      'assistant',
    ])
    expect(detail.messages.map((m) => m.content)).toEqual([
      'alpha question',
      firstBody.reply,
      'beta follow up',
      secondBody.reply,
    ])
  })

  // 4. Reloading and reopening restores the persisted conversation.
  test('reloading and reopening the session restores the persisted conversation', async ({
    page,
    context,
    request,
  }) => {
    const user = await provisionUser(request)
    await installTokens(context, user)
    await openGuidance(page)

    const response = await sendChat(page, 'persist me')
    const body = await response.json()
    await waitForReply(page, replyFor('persist me'), 1)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('.ug-ai-sidebar-item')).toHaveText(['E2E Chat'])
    await expect(page.locator('.ug-ai-empty')).toBeVisible()

    await page.locator('.ug-ai-sidebar-item').click()
    await expect(page.locator('.ug-ai-msg')).toHaveCount(2)
    await expect(page.locator('.ug-ai-msg-bubble')).toHaveText([
      'persist me',
      body.reply,
    ])
  })

  // 5. A second conversation does not corrupt the first.
  test('starting a new conversation leaves the earlier session intact', async ({
    page,
    context,
    request,
  }) => {
    const user = await provisionUser(request)
    await installTokens(context, user)
    await openGuidance(page)

    const first = await sendChat(page, 'session one')
    const firstBody = await first.json()
    await waitForReply(page, replyFor('session one'), 1)

    await page.getByRole('button', { name: 'New Session' }).click()
    await expect(page.locator('.ug-ai-empty')).toBeVisible()

    const second = await sendChat(page, 'session two')
    const secondBody = await second.json()
    expect(secondBody.session_id).not.toBe(firstBody.session_id)
    await waitForReply(page, replyFor('session two'), 1)

    // Both conversations persisted independently and remain intact.
    const list = await apiListSessions(request, user)
    expect(list).toHaveLength(2)
    const firstDetail = await apiGetSession(request, user, firstBody.session_id)
    expect(firstDetail.messages.map((m) => m.content)).toEqual([
      'session one',
      firstBody.reply,
    ])
    const secondDetail = await apiGetSession(request, user, secondBody.session_id)
    expect(secondDetail.messages.map((m) => m.content)).toEqual([
      'session two',
      secondBody.reply,
    ])

    // Sidebar shows both; reopening the older one still yields its messages.
    await expect(page.locator('.ug-ai-sidebar-item')).toHaveCount(2)
    await page.locator('.ug-ai-sidebar-item').last().click()
    await expect(page.locator('.ug-ai-msg-bubble')).toHaveText([
      'session one',
      firstBody.reply,
    ])
  })

  // 6. A provider failure follows the real 502 + rollback path.
  test('an AI-provider failure returns an error and rolls back the new session', async ({
    page,
    context,
    request,
  }) => {
    const user = await provisionUser(request)
    await installTokens(context, user)
    await openGuidance(page)

    const failedMessage = `${FAILURE_SENTINEL} please fail`
    const response = await sendChat(page, failedMessage)
    expect(response.status()).toBe(502)
    expect((await response.json()).error).toBe('E2E injected Gemini failure')

    // UI: the frontend surfaces the failure and keeps the attempted turn.
    await expect(
      page.locator('.ug-ai-msg-assistant').getByText(FRONTEND_ERROR)
    ).toBeVisible()
    await expect(
      page.locator('.ug-ai-msg-user').getByText(failedMessage)
    ).toBeVisible()

    // Real API: the brand-new session was rolled back; nothing persisted.
    expect(await apiListSessions(request, user)).toHaveLength(0)

    // Composer recovers for a retry.
    await expect(page.locator('.ug-ai-typing')).toHaveCount(0)
    await page.getByPlaceholder('Ask for guidance...').fill('retry works')
    await expect(page.locator('.ug-ai-send')).toBeEnabled()
  })

  // 7. Another user cannot retrieve or modify someone else's session.
  test('another user cannot retrieve or modify a chat session', async ({
    page,
    context,
    browser,
    request,
  }) => {
    const userA = await provisionUser(request, {
      firstName: 'Alpha',
      lastName: 'User',
    })
    await installTokens(context, userA)
    await openGuidance(page)
    const created = await sendChat(page, 'alpha private chat')
    const sessionId = (await created.json()).session_id
    await waitForReply(page, replyFor('alpha private chat'), 1)

    const userB = await provisionUser(request, {
      firstName: 'Bravo',
      lastName: 'User',
    })

    // B is denied every real access path to A's session (ownership -> 404).
    const getRes = await request.get(
      `${API_BASE}/uniguide/chat/sessions/${sessionId}/`,
      { headers: authHeaders(userB) }
    )
    expect(getRes.status()).toBe(404)
    const patchRes = await request.patch(
      `${API_BASE}/uniguide/chat/sessions/${sessionId}/`,
      { headers: authHeaders(userB), data: { title: 'hacked' } }
    )
    expect(patchRes.status()).toBe(404)
    const deleteRes = await request.delete(
      `${API_BASE}/uniguide/chat/sessions/${sessionId}/`,
      { headers: authHeaders(userB) }
    )
    expect(deleteRes.status()).toBe(404)
    const continueRes = await request.post(`${API_BASE}/uniguide/chat/`, {
      headers: authHeaders(userB),
      data: { message: 'intrude', session_id: sessionId },
    })
    expect(continueRes.status()).toBe(404)

    // A's conversation is untouched.
    const detail = await apiGetSession(request, userA, sessionId)
    expect(detail.messages).toHaveLength(2)
    expect(detail.title).toBe('E2E Chat')

    // UI: B's own sidebar shows no conversations.
    const { context: contextB, page: pageB } = await newAuthedPage(browser, userB)
    await pageB.goto('/guidance', { waitUntil: 'domcontentloaded' })
    await expect(pageB.locator('.ug-ai-sidebar-empty')).toHaveText(
      'No past sessions yet'
    )
    await contextB.close()
  })

  // 8. Invalid/missing input follows the API validation and auth contract.
  test('missing/blank messages, malformed session ids, and unauthenticated calls follow the API contract', async ({
    request,
  }) => {
    const user = await provisionUser(request)
    const endpoint = `${API_BASE}/uniguide/chat/`

    const missing = await request.post(endpoint, {
      headers: authHeaders(user),
      data: {},
    })
    expect(missing.status()).toBe(400)
    expect((await missing.json()).message).toBeTruthy()

    const blank = await request.post(endpoint, {
      headers: authHeaders(user),
      data: { message: '   ' },
    })
    expect(blank.status()).toBe(400)
    // DRF's CharField rejects whitespace-only input with its own blank message
    // before the endpoint's validate_message runs.
    expect((await blank.json()).message[0]).toMatch(/blank/i)

    const badSession = await request.post(endpoint, {
      headers: authHeaders(user),
      data: { message: 'hi', session_id: 'not-a-uuid' },
    })
    expect(badSession.status()).toBe(400)
    expect((await badSession.json()).session_id).toBeTruthy()

    const unauthenticated = await request.post(endpoint, {
      data: { message: 'hi' },
    })
    expect(unauthenticated.status()).toBe(401)
  })
})
