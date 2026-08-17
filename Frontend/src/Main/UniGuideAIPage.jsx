import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Navbar from '../Components/Navbar'
import GuidedOptionsModal from '../Components/GuidedOptionsModal'
import '../assets/Style/ai.css'
import axiosInstance from '../Utils/axiosInstance'

const renderAIContent = (content) => {
  if (!content) return null
  const numberMatches = content.match(/\n\s*\d+\.\s/g)
  if (!numberMatches || numberMatches.length < 2) {
    return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  }

  const introLines = []
  const cardSections = []
  let currentCard = ''
  let inCard = false
  const lines = content.split('\n')

  for (const line of lines) {
    const isNewCard = /^\s*\d+\.\s/.test(line)
    if (isNewCard) {
      if (currentCard) cardSections.push(currentCard.trim())
      currentCard = line
      inCard = true
    } else if (inCard) {
      currentCard += '\n' + line
    } else {
      introLines.push(line)
    }
  }
  if (currentCard) cardSections.push(currentCard.trim())

  const intro = introLines.join('\n').trim()

  return (
    <>
      {intro && <ReactMarkdown remarkPlugins={[remarkGfm]}>{intro}</ReactMarkdown>}
      {cardSections.map((section, i) => (
        <div key={i} className="ai-response-card">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{section}</ReactMarkdown>
        </div>
      ))}
    </>
  )
}

const ACTIVE_SESSION_STORAGE_KEY = 'uniguide_active_session_id'
const PINNED_SESSIONS_STORAGE_KEY = 'uniguide_pinned_session_ids'

const UniGuideChat = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState('')
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [creatingChat, setCreatingChat] = useState(false)
  const [renamingSessionId, setRenamingSessionId] = useState(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [pinnedSessionIds, setPinnedSessionIds] = useState(() => {
    try {
      const raw = localStorage.getItem(PINNED_SESSIONS_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    sessionId: null,
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [guidedMode, setGuidedMode] = useState(null)

  const chatEndRef = useRef(null)
  const textareaRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId)
      return
    }
    localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
  }, [activeSessionId])

  useEffect(() => {
    localStorage.setItem(PINNED_SESSIONS_STORAGE_KEY, JSON.stringify(pinnedSessionIds))
  }, [pinnedSessionIds])

  useEffect(() => {
    const closeContextMenu = () => {
      setContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev))
    }

    window.addEventListener('click', closeContextMenu)
    window.addEventListener('scroll', closeContextMenu, true)
    window.addEventListener('resize', closeContextMenu)

    return () => {
      window.removeEventListener('click', closeContextMenu)
      window.removeEventListener('scroll', closeContextMenu, true)
      window.removeEventListener('resize', closeContextMenu)
    }
  }, [])

  const getCurrentUser = () => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  const user = getCurrentUser()

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('')
  }

  const formatSessionTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)
    if (diffMin < 1) return 'now'
    if (diffMin < 60) return `${diffMin}m`
    if (diffHr < 24) return `${diffHr}h`
    if (diffDay < 7) return `${diffDay}d`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const fetchSessions = async () => {
    setSessionsLoading(true)
    setSessionsError('')
    try {
      const res = await axiosInstance.get('uniguide/chat/')
      const nextSessions = Array.isArray(res.data) ? res.data : []
      setSessions(nextSessions)
      setPinnedSessionIds((prev) => prev.filter((id) => nextSessions.some((session) => session.id === id)))

      if (!activeSessionId && nextSessions.length > 0) {
        const savedSessionId = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
        if (savedSessionId && nextSessions.some((session) => session.id === savedSessionId)) {
          openSession(savedSessionId)
        }
      }
    } catch (err) {
      const errMsg = err?.response?.data?.error || 'Failed to load chats.'
      setSessionsError(errMsg)
    } finally {
      setSessionsLoading(false)
    }
  }

  const openSession = async (sessionId) => {
    if (!sessionId) return
    setSessionLoading(true)
    setSessionError('')
    try {
      const res = await axiosInstance.get(`uniguide/chat/sessions/${sessionId}/`)
      const sessionMessages = (res.data.messages || []).map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }))
      setMessages(sessionMessages)
      setActiveSessionId(res.data.id)
      setSessionError('')
    } catch (err) {
      const errMsg = err?.response?.data?.error || 'Failed to open this chat.'
      setSessionError(errMsg)
    } finally {
      setSessionLoading(false)
    }
  }

  const createNewChat = async () => {
    setCreatingChat(true)
    setSessionError('')
    try {
      const res = await axiosInstance.post('uniguide/chat/sessions/', { title: 'New Chat' })
      const newSession = res.data
      setSessions((prev) => [newSession, ...prev])
      setActiveSessionId(newSession.id)
      setMessages([])
      setRenamingSessionId(null)
      setRenameTitle('')
    } catch {
      setActiveSessionId(null)
      setMessages([])
      setSessionError('Could not create a new chat right now.')
    } finally {
      setCreatingChat(false)
    }
  }

  const clearCurrentChat = () => {
    setMessages([])
    setSessionError('')
  }

  const handleDeleteSession = async (sessionId) => {
    if (!sessionId || !window.confirm('Delete this chat?')) return
    try {
      await axiosInstance.delete(`uniguide/chat/sessions/${sessionId}/`)
      setSessions((prev) => prev.filter((session) => session.id !== sessionId))
      setPinnedSessionIds((prev) => prev.filter((id) => id !== sessionId))
      if (sessionId === activeSessionId) {
        setActiveSessionId(null)
        setMessages([])
      }
    } catch {
      setSessionError('Unable to delete this chat.')
    }
  }

  const startRenameSession = (session) => {
    setRenamingSessionId(session.id)
    setRenameTitle(session.title || '')
  }

  const togglePinSession = (sessionId) => {
    setPinnedSessionIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [sessionId, ...prev]
    )
  }

  const openSessionContextMenu = (event, sessionId) => {
    event.preventDefault()
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      sessionId,
    })
  }

  const displayedSessions = [...sessions].sort((a, b) => {
    const aPinned = pinnedSessionIds.includes(a.id)
    const bPinned = pinnedSessionIds.includes(b.id)

    if (aPinned && !bPinned) return -1
    if (!aPinned && bPinned) return 1
    return 0
  })

  const submitRenameSession = async (sessionId) => {
    const nextTitle = renameTitle.trim()
    if (!nextTitle) {
      setSessionError('Title cannot be empty.')
      return
    }

    try {
      const res = await axiosInstance.patch(`uniguide/chat/sessions/${sessionId}/`, {
        title: nextTitle,
      })
      setSessions((prev) =>
        prev.map((session) => (session.id === sessionId ? { ...session, ...res.data } : session))
      )
      setRenamingSessionId(null)
      setRenameTitle('')
      setSessionError('')
    } catch {
      setSessionError('Unable to rename this chat.')
    }
  }

  const autoResize = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  const sendMessage = async (text = input) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping || sessionLoading || creatingChat) return

    const userMsg = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsTyping(true)

    try {
      let sessionId = activeSessionId

      if (!sessionId) {
        const createdSession = await axiosInstance.post('uniguide/chat/sessions/', { title: 'New Chat' })
        const newSession = createdSession.data
        sessionId = newSession.id
        setActiveSessionId(sessionId)
        setSessions((prev) => [newSession, ...prev])
      }

      const res = await axiosInstance.post('uniguide/chat/', {
        message: trimmed,
        session_id: sessionId,
      })

      const reply = res.data.reply || 'Sorry, I could not respond right now.'
      const returnedSessionId = res.data.session_id || sessionId
      if (returnedSessionId) {
        setActiveSessionId(returnedSessionId)
      }

      if (res.data.title && returnedSessionId) {
        setSessions((prev) => {
          const existing = prev.find((session) => session.id === returnedSessionId)
          if (!existing) {
            return [
              {
                id: returnedSessionId,
                title: res.data.title,
                message_count: 0,
              },
              ...prev,
            ]
          }
          return prev.map((session) =>
            session.id === returnedSessionId
              ? {
                  ...session,
                  title: res.data.title,
                }
              : session
          )
        })
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      fetchSessions()
    } catch (err) {
      const errMsg = err?.response?.data?.error || '⚠️ Something went wrong. Please try again.'
      setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <Navbar />
      <div className={`chat-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>

        {/* Sidebar */}
        <aside className="chat-sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <svg width="26" height="26" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="#0a1e30" stroke="#1a3d5c" strokeWidth="2"/>
                <polygon points="100,25 112,88 175,100 112,112 100,175 88,112 25,100 88,88" fill="#0e6e9e" opacity="0.7"/>
                <polygon points="100,42 107,88 152,100 107,112 100,158 93,112 48,100 93,88" fill="#00b4d8" opacity="0.9"/>
                <polygon points="100,58 128,95 142,100 128,105 100,142 72,105 58,100 72,95" fill="#f77f00" opacity="0.9"/>
                <circle cx="100" cy="100" r="18" fill="#040d16" stroke="#00b4d8" strokeWidth="1.5"/>
              </svg>
              <div>
                <div className="sidebar-brand-name">UniGuide <span>AI</span></div>
                <div className="sidebar-status">
                  <span className="status-dot" />Online
                </div>
              </div>
            </div>
            <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close chat menu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <button className="new-chat-btn" onClick={() => { createNewChat(); setSidebarOpen(false); }} disabled={creatingChat}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {creatingChat ? 'Creating...' : 'New Chat'}
          </button>

          <div className="sidebar-section-label">Your Chats</div>

          {sessionsLoading && <div className="sidebar-note">Loading chats...</div>}
          {!sessionsLoading && sessionsError && <div className="sidebar-note error">{sessionsError}</div>}
          {!sessionsLoading && !sessionsError && sessions.length === 0 && (
            <div className="sidebar-note">No chats yet. Start a new one.</div>
          )}

          {!sessionsLoading && !sessionsError && displayedSessions.map((session) => (
            <div
              className={`sidebar-item-wrap ${activeSessionId === session.id ? 'active' : ''} ${pinnedSessionIds.includes(session.id) ? 'pinned' : ''}`}
              key={session.id}
              onContextMenu={(event) => openSessionContextMenu(event, session.id)}
              title="Right click for options"
            >
              <button
                className={`sidebar-item ${activeSessionId === session.id ? 'active' : ''}`}
                onClick={() => { openSession(session.id); setSidebarOpen(false); }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                {renamingSessionId === session.id ? (
                  <input
                    className="session-rename-input"
                    value={renameTitle}
                    onChange={(e) => setRenameTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        submitRenameSession(session.id)
                      }
                      if (e.key === 'Escape') {
                        setRenamingSessionId(null)
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <>
                    {pinnedSessionIds.includes(session.id) && <span className="session-pin-indicator">📌</span>}
                    <span className="session-title-text">{session.title || 'New Chat'}</span>
                    <span className="session-timestamp">{formatSessionTime(session.updated_at)}</span>
                  </>
                )}
              </button>
            </div>
          ))}

          {contextMenu.visible && (
            <div
              className="session-context-menu"
              style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="session-context-item"
                onClick={() => {
                  const target = sessions.find((session) => session.id === contextMenu.sessionId)
                  if (target) {
                    startRenameSession(target)
                  }
                  setContextMenu((prev) => ({ ...prev, visible: false }))
                }}
              >
                Rename
              </button>
              <button
                className="session-context-item"
                onClick={() => {
                  if (contextMenu.sessionId) {
                    togglePinSession(contextMenu.sessionId)
                  }
                  setContextMenu((prev) => ({ ...prev, visible: false }))
                }}
              >
                {pinnedSessionIds.includes(contextMenu.sessionId) ? 'Unpin' : 'Pin'}
              </button>
              <button
                className="session-context-item danger"
                onClick={() => {
                  if (contextMenu.sessionId) {
                    handleDeleteSession(contextMenu.sessionId)
                  }
                  setContextMenu((prev) => ({ ...prev, visible: false }))
                }}
              >
                Delete
              </button>
            </div>
          )}

          {sessionError && <div className="sidebar-note error">{sessionError}</div>}

          <div className="sidebar-spacer" />

          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="Profile" className="sidebar-avatar-img" />
              ) : (
                getInitials(user?.full_name)
              )}
            </div>
            <div>
              <div className="sidebar-user-name">{user?.full_name || "Student"}</div>
            </div>
          </div>
        </aside>

        {sidebarOpen && <div className="chat-backdrop" onClick={() => setSidebarOpen(false)} />}

        {/* Main Chat */}
        <main className="chat-main">

          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <button className="chat-menu-btn" onClick={() => setSidebarOpen((open) => !open)} aria-label="Toggle chat menu">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                </svg>
              </button>
              <div className="chat-header-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <div className="chat-header-name">
                  UniGuide AI
                  <span className="chat-verified-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                </div>
                <div className="chat-header-status">
                  <span className="status-dot" />Ready to guide you
                </div>
              </div>
            </div>
            <div className="chat-header-actions">
              <button className="clear-btn" onClick={clearCurrentChat} title="Clear conversation">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                Clear
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">

            {sessionLoading && <div className="chat-inline-note">Loading conversation...</div>}

            {messages.length === 0 && (
              <div className="chat-welcome">
                <div className="welcome-heading">How can I guide you today? 🎓</div>
                <div className="welcome-sub">Ask me anything about careers, internships, study abroad, or skills</div>

                <div className="guided-section">
                  <div className="guided-options">
                    <button className="guided-option" onClick={() => setGuidedMode('internship')}>
                      <span className="guided-option-label">💼 Internship</span>
                      <span className="guided-option-desc">Find internships that fit you</span>
                    </button>
                    <button className="guided-option" onClick={() => setGuidedMode('hackathon')}>
                      <span className="guided-option-label">🚀 Hackathon</span>
                      <span className="guided-option-desc">Hackathons, ideas & prep</span>
                    </button>
                    <button className="guided-option" onClick={() => setGuidedMode('university')}>
                      <span className="guided-option-label">🎓 University / College</span>
                      <span className="guided-option-desc">Pick the right program</span>
                    </button>
                  </div>
                </div>

                {/* Welcome bot message */}
                <div className="msg-row bot">
                  <div className="msg-avatar bot-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                    </svg>
                  </div>
                  <div className="msg-content-wrap">
                    <div className="msg-label">UniGuide AI</div>
                    <div className="msg-bubble bot-bubble">
                      👋 Hello! I'm <strong>UniGuide AI</strong>, your personal career and education assistant.<br/><br/>
                      I can help you with:<br/>
                      🎓 <strong>University selection</strong> based on budget & skills<br/>
                      💼 <strong>Internship & hackathon</strong> recommendations<br/>
                      🌍 <strong>Study abroad</strong> guidance step-by-step<br/>
                      📄 <strong>SOP, resume</strong> & career planning<br/>
                      💰 <strong>Scholarships</strong> tailored to your profile<br/><br/>
                      What would you like to explore today? 🚀
                    </div>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`msg-row ${msg.role === 'user' ? 'user' : 'bot'}`}>
                <div className={`msg-avatar ${msg.role === 'user' ? 'user-avatar' : 'bot-avatar'}`}>
                  {msg.role === 'user'
                    ? getInitials(user?.full_name)
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
                  }
                </div>
                <div className="msg-content-wrap">
                  <div className={`msg-label ${msg.role === 'user' ? 'user-label' : ''}`}>
                    {msg.role === 'user' ? 'You' : 'UniGuide AI'}
                  </div>
                  <div className={`msg-bubble ${msg.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      renderAIContent(msg.content)
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="msg-row bot">
                <div className="msg-avatar bot-avatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                  </svg>
                </div>
                <div className="typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <div className="chat-input-row">
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                placeholder="Ask UniGuide AI anything... e.g. 'Best universities in Canada for CS'"
                value={input}
                onChange={e => { setInput(e.target.value); autoResize() }}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button className="send-btn" onClick={() => sendMessage()} disabled={isTyping || !input.trim()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            {!activeSessionId && messages.length === 0 && (
              <div className="quick-chips-row">
                <button className="quick-chip" onClick={() => setGuidedMode('internship')}>
                  <span className="quick-chip-icon">💼</span>Internship
                </button>
                <button className="quick-chip" onClick={() => setGuidedMode('hackathon')}>
                  <span className="quick-chip-icon">🚀</span>Hackathon
                </button>
                <button className="quick-chip" onClick={() => setGuidedMode('university')}>
                  <span className="quick-chip-icon">🎓</span>University / College
                </button>
              </div>
            )}
            <div className="chat-footer-hint">
              Press Enter to send, Shift+Enter for new line
            </div>
            <div className="chat-disclaimer">
              UniGuide AI can make mistakes. Consider checking important information.
            </div>
          </div>

        </main>
      </div>

      <GuidedOptionsModal
        mode={guidedMode}
        onClose={() => setGuidedMode(null)}
        onComplete={(prompt) => {
          setGuidedMode(null)
          sendMessage(prompt)
        }}
      />
    </>
  )
}

export default UniGuideChat