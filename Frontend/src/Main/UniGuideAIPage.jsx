import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Navbar from '../Components/Navbar'
import '../assets/Style/ai.css'
import axiosInstance from '../Utils/axiosInstance'

const QUICK_PROMPTS = [
  { label: '🎓 Study abroad',  text: 'Best universities in Canada for CS with budget under $20,000' },
  { label: '💼 Internships',   text: 'Suggest internships for a 3rd year CS student skilled in Python and React' },
  { label: '📄 SOP help',      text: 'How do I build a strong SOP for MS applications?' },
  { label: '🚀 Career paths',  text: 'Top AI and ML career paths for freshers in 2025' },
  { label: '💰 Scholarships',  text: 'List scholarships available for Indian students in Germany' },
]

const EDUCATION_LEVEL_CHOICES = [
  { value: '', label: 'Select education level' },
  { value: 'high_school', label: 'High School' },
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'postgraduate', label: 'Postgraduate / Masters' },
  { value: 'doctoral', label: 'Doctoral / PhD' },
  { value: 'diploma', label: 'Diploma / Certificate' },
  { value: 'other', label: 'Other' },
]

const YEAR_OF_STUDY_CHOICES = [
  { value: '', label: 'Select year' },
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
  { value: '5', label: '5th Year or above' },
  { value: 'graduated', label: 'Graduated' },
]

const EMPTY_PROFILE = {
  full_name: '',
  email: '',
  education_level: '',
  institution: '',
  course: '',
  year_of_study: '',
  academic_performance: '',
  interests: '',
  career_goal: '',
  preferred_location: '',
  preferred_country: '',
  budget: '',
  bio: '',
}

const ACTIVE_SESSION_STORAGE_KEY = 'uniguide_active_session_id'
const PINNED_SESSIONS_STORAGE_KEY = 'uniguide_pinned_session_ids'
const THEME_STORAGE_KEY = 'uniguide_theme'

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

  const [showProfile, setShowProfile] = useState(false)
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSavedAt, setProfileSavedAt] = useState('')
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      return savedTheme === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })

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
    fetchStudentProfile()
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
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

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

  const fetchStudentProfile = async () => {
    setProfileLoading(true)
    setProfileError('')
    try {
      const res = await axiosInstance.get('students/profile/')
      setProfile({ ...EMPTY_PROFILE, ...res.data })
    } catch {
      setProfileError('Could not load student profile.')
    } finally {
      setProfileLoading(false)
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

  const onProfileChange = (e) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError('')
    setProfileSavedAt('')

    try {
      const payload = {
        education_level: profile.education_level,
        institution: profile.institution,
        course: profile.course,
        year_of_study: profile.year_of_study,
        academic_performance: profile.academic_performance,
        interests: profile.interests,
        career_goal: profile.career_goal,
        preferred_location: profile.preferred_location,
        preferred_country: profile.preferred_country,
        budget: profile.budget,
        bio: profile.bio,
      }

      const res = await axiosInstance.put('students/profile/', payload)
      setProfile((prev) => ({ ...prev, ...res.data }))
      setProfileSavedAt('Profile saved')
    } catch (err) {
      const data = err?.response?.data
      if (typeof data === 'object' && data !== null) {
        const firstError = Object.values(data)?.[0]
        if (Array.isArray(firstError)) {
          setProfileError(firstError[0])
        } else if (typeof firstError === 'string') {
          setProfileError(firstError)
        } else {
          setProfileError('Could not save profile.')
        }
      } else {
        setProfileError('Could not save profile.')
      }
    } finally {
      setProfileSaving(false)
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <>
      <Navbar theme={theme} />
      <div className={`chat-wrapper ${theme === 'light' ? 'theme-light' : ''}`}>

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
          </div>

          <button className="new-chat-btn" onClick={createNewChat} disabled={creatingChat}>
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
                onClick={() => openSession(session.id)}
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
            <div className="sidebar-avatar">{getInitials(user?.full_name)}</div>
            <div>
              <div className="sidebar-user-name">{user?.full_name || "Student"}</div>
              <div className="sidebar-user-role">Pro Member</div>
            </div>
          </div>
        </aside>


        {/* Main Chat */}
        <main className="chat-main">

          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-header-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <div className="chat-header-name">UniGuide AI</div>
                <div className="chat-header-status">
                  <span className="status-dot" />Ready to guide you
                </div>
              </div>
            </div>
            <div className="chat-header-actions">
              <button className="clear-btn" onClick={toggleTheme}>
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button className="clear-btn" onClick={() => setShowProfile((prev) => !prev)}>
                {showProfile ? 'Hide Profile' : 'Edit Profile'}
              </button>
              <button className="clear-btn" onClick={clearCurrentChat}>Clear</button>
            </div>
          </div>

          {showProfile && (
            <div className="student-profile-panel">
              <div className="profile-panel-title">Student Profile</div>
              <div className="profile-panel-subtitle">
                Keep this updated so UniGuide AI can tailor responses better.
              </div>

              {profileLoading ? (
                <div className="profile-panel-note">Loading profile...</div>
              ) : (
                <form className="profile-form-grid" onSubmit={saveProfile}>
                  <div className="profile-field">
                    <label>Education Level</label>
                    <select name="education_level" value={profile.education_level || ''} onChange={onProfileChange}>
                      {EDUCATION_LEVEL_CHOICES.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="profile-field">
                    <label>Year of Study</label>
                    <select name="year_of_study" value={profile.year_of_study || ''} onChange={onProfileChange}>
                      {YEAR_OF_STUDY_CHOICES.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="profile-field">
                    <label>Institution</label>
                    <input name="institution" value={profile.institution || ''} onChange={onProfileChange} placeholder="Your college/university" />
                  </div>

                  <div className="profile-field">
                    <label>Course</label>
                    <input name="course" value={profile.course || ''} onChange={onProfileChange} placeholder="Program or major" />
                  </div>

                  <div className="profile-field">
                    <label>Academic Performance</label>
                    <input
                      name="academic_performance"
                      value={profile.academic_performance || ''}
                      onChange={onProfileChange}
                      placeholder="CGPA 8.5/10 or 85%"
                    />
                  </div>

                  <div className="profile-field">
                    <label>Career Goal</label>
                    <input name="career_goal" value={profile.career_goal || ''} onChange={onProfileChange} placeholder="Target role" />
                  </div>

                  <div className="profile-field">
                    <label>Preferred Location</label>
                    <input
                      name="preferred_location"
                      value={profile.preferred_location || ''}
                      onChange={onProfileChange}
                      placeholder="City or region"
                    />
                  </div>

                  <div className="profile-field">
                    <label>Preferred Country</label>
                    <input
                      name="preferred_country"
                      value={profile.preferred_country || ''}
                      onChange={onProfileChange}
                      placeholder="Country"
                    />
                  </div>

                  <div className="profile-field">
                    <label>Budget</label>
                    <input name="budget" value={profile.budget || ''} onChange={onProfileChange} placeholder="$15,000/year" />
                  </div>

                  <div className="profile-field profile-field-full">
                    <label>Interests</label>
                    <textarea
                      name="interests"
                      value={profile.interests || ''}
                      onChange={onProfileChange}
                      rows={2}
                      placeholder="AI, cloud, product engineering"
                    />
                  </div>

                  <div className="profile-field profile-field-full">
                    <label>Bio</label>
                    <textarea
                      name="bio"
                      value={profile.bio || ''}
                      onChange={onProfileChange}
                      rows={3}
                      placeholder="Any extra context about your background"
                    />
                  </div>

                  <div className="profile-form-actions profile-field-full">
                    <button className="save-profile-btn" type="submit" disabled={profileSaving}>
                      {profileSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                    {profileSavedAt && <span className="profile-success-text">{profileSavedAt}</span>}
                    {profileError && <span className="profile-error-text">{profileError}</span>}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages">

            {sessionLoading && <div className="chat-inline-note">Loading conversation...</div>}

            {messages.length === 0 && (
              <div className="chat-welcome">
                <div className="welcome-heading">How can I guide you today? 🎓</div>
                <div className="welcome-sub">Ask me anything about careers, internships, study abroad, or skills</div>

                <div className="quick-prompts">
                  {QUICK_PROMPTS.map(q => (
                    <button key={q.label} className="quick-btn" onClick={() => sendMessage(q.text)}>
                      {q.label}
                    </button>
                  ))}
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
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || ''}</ReactMarkdown>
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
            <div className="chat-footer-hint">
              UniGuide AI · Personalized for students · Press Enter to send, Shift+Enter for new line
            </div>
          </div>

        </main>
      </div>
    </>
  )
}

export default UniGuideChat