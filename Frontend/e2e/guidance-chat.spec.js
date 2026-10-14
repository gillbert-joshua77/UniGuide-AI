import { test, expect } from '@playwright/test'
import {
  blockExternalNetwork,
  makeChatSession,
  makeProfile,
  mockGuidancePage,
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

async function openGuidance(page) {
  await page.goto('/guidance', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.ug-ai-empty')).toBeVisible()
}

async function sendMessage(page, text) {
  await page.getByPlaceholder('Ask for guidance...').fill(text)
  await page.getByPlaceholder('Ask for guidance...').press('Enter')
}

// A submission renders its user bubble immediately, but the assistant reply
// for that submission only appears once its POST resolves and the simulated
// typewriter finishes revealing it. Waiting only for the streaming bubble to
// disappear can therefore return on a pre-existing idle state (before the new
// reply ever mounts), so callers pass `replies`: the number of assistant
// replies this submission makes us owe. Idle means exactly that many real
// reply bubbles exist (the typing indicator is excluded) and none of them is
// still mid-reveal.
async function waitForIdle(page, { replies }) {
  await expect(
    page.locator('.ug-ai-msg-assistant .ug-ai-msg-bubble:not(.ug-ai-typing)')
  ).toHaveCount(replies)
  await expect(page.locator('.ug-ai-msg-bubble-streaming')).toHaveCount(0)
}

async function waitForReply(page, reply, { replies }) {
  await expect(page.locator('.ug-ai-msg-assistant').getByText(reply)).toBeVisible()
  await waitForIdle(page, { replies })
}

// A manually released request gate: the mocked chat route awaits `promise`
// before answering, so the test controls exactly when the in-flight request
// settles. Always release it in a `finally` so a failing assertion can never
// leave an unresolved request or hanging route behind.
function createDeferred() {
  let resolve
  const promise = new Promise((r) => {
    resolve = r
  })
  return { promise, resolve }
}

test.describe('guidance page and AI chat', () => {
  test('an authenticated user can open the guidance page and sees its initial UI', async ({ page }) => {
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
      sessions: [],
    })
    await signIn(page)
    await openGuidance(page)

    // Header.
    await expect(page.locator('.ug-ai-header-title')).toContainText('AI Guidance')
    await expect(page.locator('.ug-ai-header-sub')).toHaveText('Your personal guidance advisor')

    // Sidebar with a created session button and the empty-sidebar copy.
    await expect(page.locator('.ug-ai-sidebar-brand')).toHaveText('Guidance')
    await expect(page.getByRole('button', { name: 'New Session' })).toBeVisible()
    await expect(page.locator('.ug-ai-sidebar-empty')).toHaveText('No past sessions yet')

    // Empty conversation welcome state and quick actions.
    await expect(page.locator('.ug-ai-empty-title')).toHaveText('How can I guide you today?')
    await expect(page.locator('.ug-ai-empty-desc')).toHaveText('Ask me about career paths, skills, opportunities, or academic decisions.')
    for (const label of ['Internship', 'Hackathon', 'University', 'Career', 'Skills']) {
      await expect(page.locator('.ug-ai-quick-actions').getByRole('button', { name: new RegExp(label) })).toBeVisible()
    }

    // Composer: the send button starts disabled while there is no text.
    await expect(page.getByPlaceholder('Ask for guidance...')).toBeVisible()
    await expect(page.locator('.ug-ai-send')).toBeDisabled()
    await expect(page.locator('.ug-ai-input-footer')).toHaveText('UniGuide AI may produce inaccurate information. Verify important decisions.')

    // Context panel reflects the mocked profile.
    await expect(page.locator('.ug-ai-context').getByRole('heading', { name: 'Student Context' })).toBeVisible()
    await expect(page.locator('.ug-ai-context-body')).toContainText('Not added yet')
    await expect(page.locator('.ug-ai-context-body').getByText('AI', { exact: true })).toBeVisible()
    await expect(page.locator('.ug-ai-context-body')).toContainText('Become a Machine Learning Engineer')
    await expect(page.locator('.ug-ai-context-text')).toHaveText('Cape Town University · Computer Science · 3')
  })

  test('loading, empty, and API-error states behave correctly', async ({ page }) => {
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
      chatPostDelayMs: 1000,
    })
    await signIn(page)
    await openGuidance(page)

    // Empty state already asserted by openGuidance; submit while the upstream
    // is slow to surface the typing indicator and a disabled send button.
    await sendMessage(page, 'Recommend an internship')
    await expect(page.locator('.ug-ai-typing')).toBeVisible()
    await expect(page.locator('.ug-ai-send')).toBeDisabled()

    // Once the reply arrives the typing indicator goes away and the composer
    // is usable again (the send button needs a new message since the input was
    // cleared).
    await waitForReply(page, 'Here is some guidance to help with "Recommend an internship".', { replies: 1 })
    await expect(page.locator('.ug-ai-typing')).toHaveCount(0)
    await expect(page.getByPlaceholder('Ask for guidance...')).toHaveValue('')
    await page.getByPlaceholder('Ask for guidance...').fill('follow up')
    await expect(page.locator('.ug-ai-send')).toBeEnabled()
  })

  test('a held chat request keeps the loading UI until the reply is released', async ({ page }) => {
    const gate = createDeferred()
    let posts = 0
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
      onChatPost: async () => {
        posts += 1
        // Hold the request open until the test releases the gate.
        await gate.promise
        return null
      },
    })
    await signIn(page)
    await openGuidance(page)

    try {
      await sendMessage(page, 'Recommend an internship for me')

      // With the POST held open the page stays in its loading state: typing
      // indicator up, send button disabled, input cleared, and no assistant
      // reply bubble rendered yet.
      await expect(page.locator('.ug-ai-typing')).toBeVisible()
      await expect(page.locator('.ug-ai-send')).toBeDisabled()
      await expect(page.getByPlaceholder('Ask for guidance...')).toHaveValue('')
      await expect(page.locator('.ug-ai-msg-user').getByText('Recommend an internship for me')).toBeVisible()
      await expect(page.locator('.ug-ai-msg-assistant .ug-ai-msg-bubble:not(.ug-ai-typing)')).toHaveCount(0)

      // The gate makes the pending state stable: it is still loading after the
      // UI has settled and exactly one request was issued.
      await page.waitForTimeout(250)
      await expect(page.locator('.ug-ai-typing')).toBeVisible()
      expect(posts).toBe(1)
    } finally {
      // Release the gate even if an assertion above failed so the in-flight
      // route always settles and nothing is left hanging.
      gate.resolve()
    }

    // Once released the reply streams in and the composer recovers.
    await waitForReply(page, 'Here is some guidance to help with "Recommend an internship for me".', { replies: 1 })
    await expect(page.locator('.ug-ai-typing')).toHaveCount(0)
    await page.getByPlaceholder('Ask for guidance...').fill('follow up')
    await expect(page.locator('.ug-ai-send')).toBeEnabled()
    expect(posts).toBe(1)
  })

  test('submissions made while a chat request is in flight are ignored', async ({ page }) => {
    const gate = createDeferred()
    let posts = 0
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
      onChatPost: async () => {
        posts += 1
        await gate.promise
        return null
      },
    })
    await signIn(page)
    await openGuidance(page)

    try {
      await sendMessage(page, 'first question')
      await expect(page.locator('.ug-ai-typing')).toBeVisible()

      // Enter (and the disabled send button) must not fire a second request
      // while the first is still open.
      await sendMessage(page, 'second question')
      await expect(page.locator('.ug-ai-msg-user')).toHaveCount(1)
      expect(posts).toBe(1)
    } finally {
      gate.resolve()
    }

    await waitForReply(page, 'Here is some guidance to help with "first question".', { replies: 1 })

    // After the first exchange completes the composer accepts the next message.
    await sendMessage(page, 'second question')
    await waitForReply(page, 'Here is some guidance to help with "second question".', { replies: 2 })
    expect(posts).toBe(2)
  })

  test('a user can type and submit a chat message with the real UI', async ({ page }) => {
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
    })
    await signIn(page)
    await openGuidance(page)

    // Enter submits.
    await sendMessage(page, 'Recommend an internship for me')
    await expect(page.locator('.ug-ai-msg-user').getByText('Recommend an internship for me')).toBeVisible()
    await expect(page.getByPlaceholder('Ask for guidance...')).toHaveValue('')
    await waitForReply(page, 'Here is some guidance to help with "Recommend an internship for me".', { replies: 1 })

    // The send button submits too once re-enabled.
    await page.getByPlaceholder('Ask for guidance...').fill('Suggest a hackathon')
    await page.locator('.ug-ai-send').click()
    await expect(page.locator('.ug-ai-msg-user').getByText('Suggest a hackathon')).toBeVisible()
    await expect(page.getByPlaceholder('Ask for guidance...')).toHaveValue('')
    await waitForReply(page, 'Here is some guidance to help with "Suggest a hackathon".', { replies: 2 })
  })

  test('the frontend sends the expected payload to the chat endpoint', async ({ page }) => {
    const posts = []
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
      onChatPost: async (req, state) => {
        posts.push({ url: req.url(), method: req.method(), body: req.postDataJSON(), order: state.posts })
        return null
      },
    })
    await signIn(page)
    await openGuidance(page)

    await sendMessage(page, 'Recommend an internship for me')
    await waitForReply(page, 'Here is some guidance to help with "Recommend an internship for me".', { replies: 1 })

    await sendMessage(page, 'What about hackathons?')
    await waitForReply(page, 'Here is some guidance to help with "What about hackathons?".', { replies: 2 })

    expect(posts).toHaveLength(2)
    expect(posts[0].url).toMatch(/\/api\/v1\/uniguide\/chat\/$/)
    expect(posts[0].method).toBe('POST')
    expect(posts[0].body).toEqual({ message: 'Recommend an internship for me', session_id: null })

    // The second message continues the session created by the first exchange.
    expect(posts[1].url).toMatch(/\/api\/v1\/uniguide\/chat\/$/)
    expect(posts[1].method).toBe('POST')
    expect(posts[1].body.message).toBe('What about hackathons?')
    expect(posts[0].body.session_id).toBeNull()
    expect(posts[1].body.session_id).toBeTruthy()
  })

  test('a successful mocked response appears in the conversation with the correct roles', async ({ page }) => {
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
      replies: ['Check out the [MDN docs](https://developer.mozilla.org/) for more.'],
    })
    await signIn(page)
    await openGuidance(page)

    await sendMessage(page, 'Tell me about web documentation')

    // User on the left as a plain text bubble, assistant on the right with the
    // markdown rendered (including the link) from the mocked reply.
    const userMsg = page.locator('.ug-ai-msg-user')
    const assistantMsg = page.locator('.ug-ai-msg-assistant')
    await expect(userMsg).toHaveCount(1)
    await expect(assistantMsg).toHaveCount(1)
    await expect(userMsg.getByText('Tell me about web documentation')).toBeVisible()
    await expect(assistantMsg.getByText('Check out the', { exact: false })).toBeVisible()
    await expect(assistantMsg.getByText('for more.', { exact: false })).toBeVisible()
    await expect(assistantMsg.getByRole('link', { name: 'MDN docs' })).toHaveAttribute('href', 'https://developer.mozilla.org/')
  })

  test('sending a follow-up message preserves the conversation in order', async ({ page }) => {
    const replies = ['The skill to learn next is Python.', 'Machine learning comes after Python.']
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
      replies,
    })
    await signIn(page)
    await openGuidance(page)

    await sendMessage(page, 'What skills should I learn?')
    await waitForReply(page, replies[0], { replies: 1 })

    await sendMessage(page, 'What comes next?')
    await waitForReply(page, replies[1], { replies: 2 })

    const messages = page.locator('.ug-ai-msg')
    await expect(messages).toHaveCount(4)

    // Roles alternate user, assistant, user, assistant.
    await expect(messages.nth(0)).toHaveClass(/ug-ai-msg-user/)
    await expect(messages.nth(1)).toHaveClass(/ug-ai-msg-assistant/)
    await expect(messages.nth(2)).toHaveClass(/ug-ai-msg-user/)
    await expect(messages.nth(3)).toHaveClass(/ug-ai-msg-assistant/)

    // Content is in the exact expected order.
    await expect(page.locator('.ug-ai-msg-bubble')).toHaveText([
      'What skills should I learn?',
      replies[0],
      'What comes next?',
      replies[1],
    ])
  })

  test('existing chat sessions and history load into the page correctly', async ({ page }) => {
    const seeded = makeChatSession()
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
      sessions: [seeded],
    })
    await signIn(page)
    await openGuidance(page)

    // The sidebar lists the past session and the empty sidebar copy is gone.
    await expect(page.locator('.ug-ai-sidebar-empty')).toHaveCount(0)
    await expect(page.locator('.ug-ai-sidebar-item')).toHaveText(['Course recommendation'])
    await expect(page.locator('.ug-ai-sidebar-item')).toHaveCount(1)

    // The chat area starts empty; clicking the session loads its history.
    await expect(page.locator('.ug-ai-messages-list')).toHaveCount(0)
    await page.locator('.ug-ai-sidebar-item').click()
    await expect(page.locator('.ug-ai-sidebar-item')).toHaveClass(/ug-ai-sidebar-item-active/)

    const messages = page.locator('.ug-ai-msg')
    await expect(messages).toHaveCount(2)
    await expect(messages.nth(0)).toHaveClass(/ug-ai-msg-user/)
    await expect(messages.nth(1)).toHaveClass(/ug-ai-msg-assistant/)
    await expect(page.locator('.ug-ai-msg-bubble')).toHaveText([
      'Recommend a course',
      'Consider machine learning electives.',
    ])
    await expect(page.locator('.ug-ai-empty')).toHaveCount(0)
  })

  test('a failed chat request shows feedback and does not leave the composer stuck', async ({ page }) => {
    let posts = 0
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
      onChatPost: async () => {
        posts += 1
        return { status: 502, body: { error: 'Service unavailable' } }
      },
    })
    await signIn(page)
    await openGuidance(page)

    await sendMessage(page, 'ping')

    const errorBubble = page.locator('.ug-ai-msg-assistant')
    await expect(errorBubble.getByText('I apologize, but I encountered an issue processing your request. Please try again.')).toBeVisible()
    await expect(page.locator('.ug-ai-msg-user').getByText('ping')).toBeVisible()

    // No typing indicator, the input was still cleared, and the composer is
    // usable again (typing enables the send button for another attempt).
    await expect(page.locator('.ug-ai-typing')).toHaveCount(0)
    await expect(page.getByPlaceholder('Ask for guidance...')).toHaveValue('')
    await page.getByPlaceholder('Ask for guidance...').fill('retry')
    await expect(page.locator('.ug-ai-send')).toBeEnabled()
    expect(posts).toBe(1)
  })

  test('retrying after a failed request works', async ({ page }) => {
    let posts = 0
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
      onChatPost: async () => {
        posts += 1
        return posts === 1 ? { status: 500, body: { error: 'boom' } } : null
      },
    })
    await signIn(page)
    await openGuidance(page)

    await sendMessage(page, 'hello')
    await expect(page.locator('.ug-ai-msg-assistant').getByText('I apologize, but I encountered an issue processing your request. Please try again.')).toBeVisible()

    await sendMessage(page, 'hello again')
    await expect(page.locator('.ug-ai-msg-assistant').getByText('Here is some guidance to help with "hello again".')).toBeVisible()
    await waitForIdle(page, { replies: 2 })
    expect(posts).toBe(2)
  })

  test('empty-message submission is blocked by the application before any network call', async ({ page }) => {
    let posts = 0
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
      onChatPost: async () => {
        posts += 1
        return null
      },
    })
    await signIn(page)
    await openGuidance(page)

    const input = page.getByPlaceholder('Ask for guidance...')
    await expect(page.locator('.ug-ai-send')).toBeDisabled()
    await input.press('Enter')
    expect(posts).toBe(0)

    // Whitespace-only input is still treated as empty.
    await input.fill('   ')
    await expect(page.locator('.ug-ai-send')).toBeDisabled()
    await input.press('Enter')
    expect(posts).toBe(0)

    // Typed text enables the button; clearing it disables it again.
    await input.fill('hello')
    await expect(page.locator('.ug-ai-send')).toBeEnabled()
    await input.fill('')
    await expect(page.locator('.ug-ai-send')).toBeDisabled()
    await input.press('Enter')
    expect(posts).toBe(0)

    // Nothing was ever submitted.
    await expect(page.locator('.ug-ai-msg')).toHaveCount(0)
  })

  test('navigating away and returning persists the session in the sidebar and loads it on click', async ({ page }) => {
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
    })
    await signIn(page)
    await openGuidance(page)

    await sendMessage(page, 'Recommend an internship for me')
    await waitForIdle(page, { replies: 1 })

    // Leave and come back: the server-side session survives, but the chat area
    // starts fresh (no client-side message persistence) until the user opens it.
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.profile-identity-name')).toBeVisible()
    await page.goto('/guidance', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('.ug-ai-empty')).toBeVisible()
    await expect(page.locator('.ug-ai-sidebar-item')).toHaveText(['Recommend an internship for me'])

    await page.locator('.ug-ai-sidebar-item').click()
    const messages = page.locator('.ug-ai-msg')
    await expect(messages).toHaveCount(2)
    await expect(messages.nth(0)).toHaveClass(/ug-ai-msg-user/)
    await expect(messages.nth(1)).toHaveClass(/ug-ai-msg-assistant/)
    await expect(page.locator('.ug-ai-msg-bubble')).toHaveText([
      'Recommend an internship for me',
      'Here is some guidance to help with "Recommend an internship for me".',
    ])
  })

  test('one frontend submission triggers exactly one chat API request', async ({ page }) => {
    let posts = 0
    const listGets = []
    await mockGuidancePage(page.context(), {
      profile: makeProfile(),
      onChatPost: async () => {
        posts += 1
        return null
      },
      onChatList: async (req) => {
        listGets.push(req.method())
        return null
      },
    })
    await signIn(page)
    await openGuidance(page)

    // A quick action submits one message through the same path.
    await page.locator('.ug-ai-quick-actions').getByRole('button', { name: /Skills/ }).click()
    await waitForReply(page, 'Here is some guidance to help with "What skills should I learn next?".', { replies: 1 })
    expect(posts).toBe(1)
    expect(listGets.filter((m) => m === 'GET').length).toBeGreaterThan(0)

    // A typed submission also produces exactly one POST and no duplicate sends.
    await sendMessage(page, 'Recommend a university')
    await waitForReply(page, 'Here is some guidance to help with "Recommend a university".', { replies: 2 })
    expect(posts).toBe(2)
    await expect(page.locator('.ug-ai-msg')).toHaveCount(4)
  })
})