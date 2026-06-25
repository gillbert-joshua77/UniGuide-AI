import React, { useState, useRef, useEffect } from 'react'
import Navbar from '../Components/Navbar'
import '../assets/Style/ai.css'
import axios from 'axios'

const SYSTEM_PROMPT = `You are UniGuide AI, an intelligent assistant that helps students plan their education, career, and study abroad journey.
Your responsibilities:
- Suggest universities based on budget, skills, and country preference
- Provide clear step-by-step guidance for study abroad
- Recommend scholarships, internships, and hackathons
- Help with SOP, resume, and career planning
- Give structured and easy-to-read answers
Always:
- Be friendly and motivating
- Use bullet points and sections
- Personalize responses based on user profile if available
- Avoid long paragraphs
Format responses using emojis like 🎓 Universities, 💰 Fees, 📍 Location, 📌 Requirements, 🚀 Next Steps when relevant.`

const QUICK_PROMPTS = [
  { label: '🎓 Study abroad',  text: 'Best universities in Canada for CS with budget under $20,000' },
  { label: '💼 Internships',   text: 'Suggest internships for a 3rd year CS student skilled in Python and React' },
  { label: '📄 SOP help',      text: 'How do I build a strong SOP for MS applications?' },
  { label: '🚀 Career paths',  text: 'Top AI and ML career paths for freshers in 2025' },
  { label: '💰 Scholarships',  text: 'List scholarships available for Indian students in Germany' },
]

const RECENT_CHATS = [
  'Study abroad guide',
  'Career in ML',
  'Internship finder',
  'Resume tips',
]

const UniGuideChat = () => {
  const [messages,   setMessages]   = useState([])
  const [input,      setInput]      = useState('')
  const [isTyping,   setIsTyping]   = useState(false)
  const chatEndRef  = useRef(null)
  const textareaRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  const autoResize = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  const sendMessage = async (text = input) => {
  const trimmed = text.trim()
  if (!trimmed || isTyping) return

  const userMsg = { role: 'user', content: trimmed }
  const updated = [...messages, userMsg]
  setMessages(updated)
  setInput('')
  if (textareaRef.current) textareaRef.current.style.height = 'auto'
  setIsTyping(true)

  try {
    const res = await axios.post(
      'http://localhost:8000/api/v1/uniguide/chat/',
      {
        message:  trimmed,
        messages: messages,
      }
    )
    const reply = res.data.reply || 'Sorry, I could not respond right now.'
    setMessages(prev => [...prev, { role: 'assistant', content: reply }])
  } catch (err) {
    const errMsg = err?.response?.data?.error || '⚠️ Something went wrong. Please try again.'
    setMessages(prev => [...prev, { role: 'assistant', content: errMsg }])
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

  const formatMsg = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')

  const user = JSON.parse(localStorage.getItem("user"));    
  const getInitials = (name) => {
  if (!name) return "";
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join("");
  };

  return (
    <>
      <Navbar />
      <div className="chat-wrapper">

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

          <button className="new-chat-btn" onClick={() => setMessages([])}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Chat
          </button>

          <div className="sidebar-section-label">Recent</div>

          {RECENT_CHATS.map((c, i) => (
            <div className={`sidebar-item ${i === 0 ? 'active' : ''}`} key={c}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              {c}
            </div>
          ))}

          <div className="sidebar-spacer" />

          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(user.full_name)}</div>
            <div>
              <div className="sidebar-user-name">{user.full_name}</div>
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
            <button className="clear-btn" onClick={() => setMessages([])}>Clear</button>
          </div>

          {/* Messages */}
          <div className="chat-messages">

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
                    ? getInitials(user.full_name)
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
                  }
                </div>
                <div className="msg-content-wrap">
                  <div className={`msg-label ${msg.role === 'user' ? 'user-label' : ''}`}>
                    {msg.role === 'user' ? 'You' : 'UniGuide AI'}
                  </div>
                  <div
                    className={`msg-bubble ${msg.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}
                    dangerouslySetInnerHTML={{ __html: formatMsg(msg.content) }}
                  />
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