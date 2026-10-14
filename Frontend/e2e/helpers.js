import {
  changePasswordEndpoint,
  chatListEndpoint,
  chatSessionEndpoint,
  hackathonsEndpoint,
  journeyEndpoint,
  loginEndpoint,
  newsEndpoint,
  otpResendEndpoint,
  otpVerifyEndpoint,
  profileEndpoint,
  registerEndpoint,
  resetPasswordEndpoint,
  savedOpportunitiesEndpoint,
  savedOpportunityDetailEndpoint,
  setNewPasswordEndpoint,
  skillDetailEndpoint,
  skillsAddEndpoint,
} from './endpoints.js'

const CORS = { 'access-control-allow-origin': '*' }

const CORS_PREFLIGHT = {
  ...CORS,
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
}

export function makeJwt(overrides = {}) {
  const now = Math.floor(Date.now() / 1000)
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const header = encode({ alg: 'none', typ: 'JWT' })
  const payload = encode({
    sub: '1',
    exp: now + 3600,
    email: 'student@example.com',
    ...overrides,
  })
  return `${header}.${payload}.`
}

async function fulfill(route, status, body) {
  const request = route.request()
  if (request.method() === 'OPTIONS') {
    return route.fulfill({ status: 204, headers: CORS_PREFLIGHT })
  }
  return route.fulfill({
    status,
    contentType: 'application/json',
    headers: CORS,
    body: JSON.stringify(body),
  })
}

export async function mockLogin(context, { status, body }) {
  await context.route(loginEndpoint, (route) => fulfill(route, status, body))
}

export async function mockProfile(context, { user = {}, saved = [] } = {}) {
  await context.route(/\/api\/v1\/students\/profile\/?$/, (route) =>
    fulfill(route, 200, {
      full_name: 'Test Student',
      email: 'student@example.com',
      profile_picture: null,
      skills: [],
      ...user,
    })
  )
  await context.route(/\/api\/v1\/students\/saved-opportunities\/?$/, (route) =>
    fulfill(route, 200, saved)
  )
}

export async function mockLoginSuccess(context, { user = {}, saved = [] } = {}) {
  await context.route(loginEndpoint, (route) =>
    fulfill(route, 200, {
      email: 'student@example.com',
      full_name: 'Test Student',
      access_token: makeJwt({ email: user.email || 'student@example.com' }),
      refresh_token: makeJwt({ exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 }),
      ...user,
    })
  )
  await mockProfile(context, { user, saved })
}

export async function blockExternalNetwork(context) {
  await context.route('https://accounts.google.com/**', (route) => route.abort())
}

export async function mockRegisterSuccess(context, { data = {}, message = 'passcode sent', onRequest } = {}) {
  await context.route(registerEndpoint, async (route) => {
    if (onRequest) onRequest(route.request())
    await fulfill(route, 201, { data, message })
  })
}

export async function mockRegisterFailure(context, { status = 400, body = {}, onRequest } = {}) {
  await context.route(registerEndpoint, async (route) => {
    if (onRequest) onRequest(route.request())
    await fulfill(route, status, body)
  })
}

export async function mockOtpVerify(context, { status = 200, body = {}, onRequest } = {}) {
  await context.route(otpVerifyEndpoint, async (route) => {
    if (onRequest) onRequest(route.request())
    await fulfill(route, status, body)
  })
}

export async function mockOtpResend(context, { status = 200, body = {}, onRequest } = {}) {
  await context.route(otpResendEndpoint, async (route) => {
    if (onRequest) onRequest(route.request())
    await fulfill(route, status, body)
  })
}

export async function mockResetPasswordRequest(context, { status = 200, body = {}, onRequest } = {}) {
  await context.route(resetPasswordEndpoint, async (route) => {
    if (onRequest) onRequest(route.request())
    await fulfill(route, status, body)
  })
}

export async function mockSetNewPassword(context, { status = 200, body = {}, onRequest } = {}) {
  await context.route(setNewPasswordEndpoint, async (route) => {
    if (onRequest) onRequest(route.request())
    await fulfill(route, status, body)
  })
}

export async function mockChangePassword(context, { status = 200, body = {}, onRequest } = {}) {
  await context.route(changePasswordEndpoint, async (route) => {
    if (onRequest) onRequest(route.request())
    await fulfill(route, status, body)
  })
}

// ─── Profile & skills (students app) ─────────────────────────────────

export function makeProfile(overrides = {}) {
  return {
    full_name: 'Ava Chen',
    email: 'ava@example.com',
    first_name: 'Ava',
    last_name: 'Chen',
    profile_picture: null,
    education_level: 'undergraduate',
    institution: 'Cape Town University',
    course: 'Computer Science',
    year_of_study: '3',
    academic_performance: 'CGPA 8.5/10',
    interests: 'AI, Web Development',
    career_goal: 'Become a Machine Learning Engineer',
    preferred_location: 'Cape Town',
    preferred_country: 'South Africa',
    budget: '$15,000/year',
    bio: 'Passionate CS student.',
    updated_at: '2026-10-11T00:00:00Z',
    skills: [],
    applications: [],
    profile_completion: 60,
    ...overrides,
  }
}

// A mocked, stateful profile+skills session:
//   - login        → 200 with tokens for profile.email
//   - GET profile  → current profile object
//   - PUT profile  → onPut may return {status, body} to force a response;
//                    otherwise it merges the payload into `profile` and
//                    responds 200 (what the backend serializer does).
//   - saved-opp    → `saved` array (GET /students/saved-opportunities/)
//   - skills/add   → onSkillAdd may return {status, body}; otherwise it
//                    appends a new skill and responds 201.
//   - skills/<pk>/ → onSkillDelete may return {status, body}; otherwise it
//                    removes the skill and responds 200 (real backend does
//                    this with {"message": "Skill removed successfully"}).
export async function mockProfilePage(context, {
  profile = makeProfile(),
  saved = [],
  onPut = null,
  onSkillAdd = null,
  onSkillDelete = null,
} = {}) {
  await context.route(profileEndpoint, async (route) => {
    const req = route.request()
    if (req.method() === 'PUT') {
      const handled = onPut ? await onPut(req, profile) : null
      if (handled) return fulfill(route, handled.status ?? 200, handled.body ?? {})
      Object.assign(profile, req.postDataJSON())
      return fulfill(route, 200, { ...profile })
    }
    if (req.method() === 'GET') return fulfill(route, 200, { ...profile })
    return fulfill(route, 405, {})
  })
  await context.route(savedOpportunitiesEndpoint, (route) => fulfill(route, 200, saved))
  await context.route(skillsAddEndpoint, async (route) => {
    const req = route.request()
    const handled = onSkillAdd ? await onSkillAdd(req, profile) : null
    if (handled) return fulfill(route, handled.status ?? 201, handled.body ?? {})
    const body = req.postDataJSON()
    const skill = {
      id: 900 + (profile.skills?.length || 0) + 1,
      name: body.name,
      percentage: body.percentage ?? 0,
      color: '#4F6BFF',
    }
    profile.skills = [...(profile.skills || []), skill]
    return fulfill(route, 201, skill)
  })
  await context.route(skillDetailEndpoint, async (route) => {
    const req = route.request()
    const handled = onSkillDelete ? await onSkillDelete(req, profile) : null
    if (handled) return fulfill(route, handled.status ?? 200, handled.body ?? {})
    const pk = Number(req.url().match(/skills\/(\d+)\/$/)?.[1])
    profile.skills = (profile.skills || []).filter((s) => Number(s.id) !== pk)
    return fulfill(route, 200, { message: 'Skill removed successfully' })
  })
  await context.route(loginEndpoint, (route) =>
    fulfill(route, 200, {
      email: profile.email,
      full_name: profile.full_name,
      access_token: makeJwt({ email: profile.email }),
      refresh_token: makeJwt({ exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 }),
    })
  )
}

// ─── Opportunities & saved opportunities ────────────────────────────

export function makeHackathon(overrides = {}) {
  return {
    id: '101',
    title: 'Genesis AI Hackathon',
    url: 'https://genesis.devpost.com',
    organizer: 'Genesis Labs',
    status: 'open',
    mode: 'Online',
    deadline: 'Jan 15, 2027',
    prize: '$10,000',
    participants: 1200,
    tags: ['AI', 'Machine Learning'],
    image: null,
    featured: false,
    ...overrides,
  }
}

function makeSavedOpportunity(payload, id) {
  return {
    id,
    opportunity_id: payload.opportunity_id,
    source: payload.source ?? 'hackathon',
    title: payload.title ?? '',
    url: payload.url ?? '',
    organizer: payload.organizer ?? '',
    location: payload.location ?? '',
    deadline: payload.deadline ?? '',
    prize: payload.prize ?? '',
    created_at: '2026-10-11T00:00:00Z',
  }
}

// A mocked, stateful opportunities session:
//   - login          → 200 with tokens for profile.email
//   - GET profile    → current profile object (AuthContext loads it on mount)
//   - GET/POST saved → POST mirrors the backend dedupe (existing row for the
//                      same opportunity_id comes back as 200; a new row is
//                      created as 201); GET returns the current list.
//   - DELETE saved   → onSavedDelete may force a response without mutating;
//                      otherwise the row is removed and 200 returned (the real
//                      backend returns {"message": "Removed from saved
//                      opportunities"} with 200). Unknown pk → 404.
//   - GET hackathons → onHackathons may force a response; otherwise returns
//                      {total, page, hackathons} (real backend shape).
export async function mockOpportunitiesPage(context, {
  profile = makeProfile(),
  saved = [],
  hackathons = [],
  onHackathons = null,
  onSavedPost = null,
  onSavedDelete = null,
} = {}) {
  let savedNextId = 1000
  await context.route(loginEndpoint, (route) =>
    fulfill(route, 200, {
      email: profile.email,
      full_name: profile.full_name,
      access_token: makeJwt({ email: profile.email }),
      refresh_token: makeJwt({ exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 }),
    })
  )
  await context.route(profileEndpoint, async (route) => {
    if (route.request().method() === 'PUT') return fulfill(route, 200, { ...profile })
    return fulfill(route, 200, { ...profile })
  })
  await context.route(savedOpportunitiesEndpoint, async (route) => {
    const req = route.request()
    if (req.method() === 'POST') {
      const handled = onSavedPost ? await onSavedPost(req, saved) : null
      if (handled) return fulfill(route, handled.status ?? 201, handled.body ?? {})
      const existing = saved.find((o) => o.opportunity_id === req.postDataJSON().opportunity_id)
      if (existing) return fulfill(route, 200, existing)
      const row = makeSavedOpportunity(req.postDataJSON(), savedNextId++)
      saved.unshift(row)
      return fulfill(route, 201, row)
    }
    return fulfill(route, 200, [...saved])
  })
  await context.route(savedOpportunityDetailEndpoint, async (route) => {
    const req = route.request()
    const handled = onSavedDelete ? await onSavedDelete(req, saved) : null
    if (handled) return fulfill(route, handled.status ?? 200, handled.body ?? {})
    const pk = Number(req.url().match(/saved-opportunities\/(\d+)\/$/)?.[1])
    const idx = saved.findIndex((o) => o.id === pk)
    if (idx === -1) return fulfill(route, 404, { error: 'Saved opportunity not found' })
    saved.splice(idx, 1)
    return fulfill(route, 200, { message: 'Removed from saved opportunities' })
  })
  await context.route(hackathonsEndpoint, async (route) => {
    const handled = onHackathons ? await onHackathons(route.request()) : null
    if (handled) return fulfill(route, handled.status ?? 200, handled.body ?? {})
    return fulfill(route, 200, { total: hackathons.length, page: 1, hackathons })
  })
}

// ─── AI chat / guidance page ─────────────────────────────────────────

export function makeChatSession(overrides = {}) {
  return {
    id: '0f3d0f0a-0000-4000-8000-000000000001',
    title: 'Course recommendation',
    created_at: '2026-10-10T09:00:00Z',
    updated_at: '2026-10-10T09:05:00Z',
    message_count: 2,
    last_message: {
      role: 'model',
      content: 'Consider machine learning electives.',
      timestamp: '2026-10-10T09:05:00Z',
    },
    messages: [
      { role: 'user', content: 'Recommend a course', timestamp: '2026-10-10T09:00:00Z' },
      { role: 'model', content: 'Consider machine learning electives.', timestamp: '2026-10-10T09:05:00Z' },
    ],
    ...overrides,
  }
}

// A mocked, stateful guidance/chat session that mirrors the backend chat
// contract (ai/urls.py + ai/views.py UniGuideChatView):
//   - GET  /uniguide/chat/            → list of the user's sessions
//   - POST /uniguide/chat/            → {message, session_id}; creates a
//                                      session when session_id is null,
//                                      appends messages otherwise, returns
//                                      {session_id, title, reply}
//   - GET  /uniguide/chat/sessions/<id>/ → session detail with messages[]
//                                       (roles 'user'/'model', which the page
//                                       maps 'model' → 'assistant')
// Hooks may force a response: returning {status, body} short-circuits the
// default behavior. `replies` is a per-request queue of reply texts for the
// success path; `chatPostDelayMs` simulates a slow upstream reply so the
// typing indicator is observable.
export async function mockGuidancePage(context, {
  profile = makeProfile(),
  sessions = [],
  replies = [],
  onChatList = null,
  onChatPost = null,
  onSessionDetail = null,
  chatPostDelayMs = 0,
} = {}) {
  let nextId = 2
  const now = () => new Date().toISOString()
  const nextSessionId = () => `0f3d0f0a-0000-4000-8000-${String(nextId++).padStart(12, '0')}`
  const state = {
    sessions: sessions.map((s) => ({ ...s, messages: [...(s.messages || [])] })),
    replies: [...replies],
    posts: 0,
  }
  const shorten = (content) =>
    content.length > 120 ? content.slice(0, 120) + '...' : content

  await context.route(loginEndpoint, (route) =>
    fulfill(route, 200, {
      email: profile.email,
      full_name: profile.full_name,
      access_token: makeJwt({ email: profile.email }),
      refresh_token: makeJwt({ exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 }),
    })
  )
  await context.route(profileEndpoint, (route) =>
    fulfill(route, 200, { ...profile })
  )
  // AuthContext also loads the user's saved-opportunities list on mount; keep
  // it served so the guidance page never falls through to the API proxy.
  await context.route(savedOpportunitiesEndpoint, (route) => fulfill(route, 200, []))
  await context.route(chatListEndpoint, async (route) => {
    const req = route.request()
    if (req.method() === 'GET') {
      const handled = onChatList ? await onChatList(req, state) : null
      if (handled) return fulfill(route, handled.status ?? 200, handled.body ?? {})
      return fulfill(
        route,
        200,
        state.sessions.map(({ messages, ...s }) => s)
      )
    }
    if (req.method() === 'POST') {
      state.posts += 1
      const handled = onChatPost ? await onChatPost(req, state) : null
      if (handled) return fulfill(route, handled.status ?? 200, handled.body ?? {})
      if (chatPostDelayMs) await new Promise((resolve) => setTimeout(resolve, chatPostDelayMs))
      const body = req.postDataJSON()
      let session = state.sessions.find((s) => s.id === body.session_id)
      if (!session) {
        if (body.session_id) return fulfill(route, 404, { error: 'Session not found' })
        session = {
          id: nextSessionId(),
          title: 'New Chat',
          created_at: now(),
          updated_at: now(),
          message_count: 0,
          last_message: null,
          messages: [],
        }
        state.sessions.push(session)
      }
      const reply = state.replies.length ? state.replies.shift() : `Here is some guidance to help with "${body.message}".`
      const timestamp = now()
      session.messages.push({ role: 'user', content: body.message, timestamp })
      if (session.title === 'New Chat') session.title = body.message.slice(0, 60)
      session.messages.push({ role: 'model', content: reply, timestamp })
      session.message_count = session.messages.length
      session.last_message = { role: 'model', content: shorten(reply), timestamp }
      session.updated_at = timestamp
      return fulfill(route, 200, { session_id: session.id, title: session.title, reply })
    }
    return fulfill(route, 405, {})
  })
  await context.route(chatSessionEndpoint, async (route) => {
    const req = route.request()
    const handled = onSessionDetail ? await onSessionDetail(req, state) : null
    if (handled) return fulfill(route, handled.status ?? 200, handled.body ?? {})
    const id = req.url().match(/sessions\/([^\/]+)\/$/)?.[1]
    const session = state.sessions.find((s) => s.id === id)
    if (!session) return fulfill(route, 404, { error: 'Session not found' })
    const { messages, ...meta } = session
    return fulfill(route, 200, { ...meta, messages })
  })
}

// ─── News page (/uniguide/news/) ─────────────────────────────────────

export function makeArticle(overrides = {}) {
  return {
    id: 'ai-0',
    title: 'AI Funding Rebounds in 2026',
    summary: 'Investment in applied AI startups climbs again this quarter.',
    category: 'AI',
    source: 'TechWire',
    author: 'Jane Doe',
    image: null,
    url: 'https://example.com/ai-funding',
    publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    readTime: 3,
    ...overrides,
  }
}

// A mocked news page session:
//   - login        → 200 with tokens for profile.email
//   - GET profile  → current profile object (AuthContext loads it on mount)
//   - GET saved    → [] (AuthContext loads it on mount)
//   - GET /uniguide/news/ → {category, total, articles, source}; onNews may
//                      force a response, otherwise articles are filtered by the
//                      `category` query param the same way the backend maps
//                      e.g. "ai" → "AI".
export async function mockNewsPage(context, {
  profile = makeProfile(),
  articles = [],
  onNews = null,
} = {}) {
  await context.route(loginEndpoint, (route) =>
    fulfill(route, 200, {
      email: profile.email,
      full_name: profile.full_name,
      access_token: makeJwt({ email: profile.email }),
      refresh_token: makeJwt({ exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 }),
    })
  )
  await context.route(profileEndpoint, (route) => fulfill(route, 200, { ...profile }))
  await context.route(savedOpportunitiesEndpoint, (route) => fulfill(route, 200, []))
  await context.route(newsEndpoint, async (route) => {
    const handled = onNews ? await onNews(route.request(), articles) : null
    if (handled) return fulfill(route, handled.status ?? 200, handled.body ?? {})
    const category = new URL(route.request().url()).searchParams.get('category') || 'all'
    const filtered = category === 'all'
      ? articles
      : articles.filter((a) => (a.category || '').toLowerCase() === category)
    return fulfill(route, 200, {
      category,
      total: filtered.length,
      articles: filtered,
      source: 'NewsAPI.org',
    })
  })
}

// ─── My Journey page (/students/journey/) ────────────────────────────

export function makeJourney(overrides = {}) {
  return {
    profile_completion: 60,
    career_readiness: 55,
    current_goals: 'Become a Machine Learning Engineer',
    interests: ['ai', 'web development'],
    skills_count: 2,
    skills: [
      { id: 1, name: 'Python', percentage: 40, color: '#4F6BFF' },
      { id: 2, name: 'React', percentage: 30, color: '#4F6BFF' },
    ],
    skills_to_develop: [{ name: 'Statistics' }],
    applications: [{ role: 'Data Intern', company: 'Acme', status: 'applied', color: 'ai' }],
    saved_opportunities_count: 1,
    ai_insight: 'You are around 55% career-ready. Keep building real projects with your current skills to stay on track.',
    ...overrides,
  }
}

// A mocked My Journey session. It reuses the opportunities page plumbing
// (login, profile, saved-opportunities GET/POST/DELETE, hackathons) so that
// saving/removing recommended opportunities works, and adds the journey GET.
export async function mockJourneyPage(context, {
  profile = makeProfile(),
  journey = makeJourney(),
  saved = [],
  hackathons = [],
  onJourney = null,
  onHackathons = null,
  onSavedPost = null,
  onSavedDelete = null,
} = {}) {
  await mockOpportunitiesPage(context, { profile, saved, hackathons, onHackathons, onSavedPost, onSavedDelete })
  await context.route(journeyEndpoint, async (route) => {
    const handled = onJourney ? await onJourney(route.request(), journey) : null
    if (handled) return fulfill(route, handled.status ?? 200, handled.body ?? {})
    return fulfill(route, 200, { ...journey })
  })
}