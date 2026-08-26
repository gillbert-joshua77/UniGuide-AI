import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../Utils/axiosInstance';
import { Button, Badge, Avatar, Card } from '../components/ui';
import { fadeUp, fadeIn, staggerFast, slideInRight } from '../lib/motion';
import '../assets/Style/ai.css';

const quickActions = [
  { icon: '💼', label: 'Internship', prompt: 'Recommend internship opportunities matching my skills' },
  { icon: '🏆', label: 'Hackathon', prompt: 'Suggest hackathons I should participate in' },
  { icon: '🎓', label: 'University', prompt: 'Recommend universities for my academic goals' },
  { icon: '🧭', label: 'Career', prompt: 'Guide me on career paths based on my profile' },
  { icon: '📈', label: 'Skills', prompt: 'What skills should I learn next?' },
];

export default function UniGuideAIPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const userName = localStorage.getItem('uniguide_user_name') || 'Student';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const createNewConversation = () => {
    const id = Date.now().toString();
    const conv = { id, title: 'New Guidance Session', createdAt: new Date() };
    setConversations(prev => [conv, ...prev]);
    setActiveConversation(conv);
    setMessages([]);
    setMobileSidebarOpen(false);
  };

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/api/ai/chat/', { message: text });
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data?.response || response.data?.message || 'I received your message. Let me think about that.',
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'I apologize, but I encountered an issue processing your request. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="ug-ai-layout">
      {/* Sidebar */}
      <aside className={`ug-ai-sidebar ${mobileSidebarOpen ? 'ug-ai-sidebar-open' : ''}`}>
        <div className="ug-ai-sidebar-header">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#D4AF67" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="5" fill="#D4AF67" />
          </svg>
          <span className="ug-ai-sidebar-brand">Guidance</span>
        </div>

        <Button variant="primary" size="sm" className="ug-ai-new-chat" onClick={createNewConversation}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Session
        </Button>

        <div className="ug-ai-sidebar-list">
          {conversations.map(conv => (
            <button
              key={conv.id}
              className={`ug-ai-sidebar-item ${activeConversation?.id === conv.id ? 'ug-ai-sidebar-item-active' : ''}`}
              onClick={() => { setActiveConversation(conv); setMessages([]); setMobileSidebarOpen(false); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>{conv.title}</span>
            </button>
          ))}
        </div>

        <div className="ug-ai-sidebar-footer">
          <Avatar name={userName} size="sm" gold />
          <span className="ug-ai-sidebar-user">{userName.split(' ')[0]}</span>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileSidebarOpen && <div className="ug-ai-mobile-overlay" onClick={() => setMobileSidebarOpen(false)} />}

      {/* Main chat */}
      <div className="ug-ai-main">
        <div className="ug-ai-header">
          <button className="ug-ai-mobile-menu" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="ug-ai-header-info">
            <div className="ug-ai-header-title">
              AI Guidance
              <Badge color="ai" size="sm">AI</Badge>
            </div>
            <div className="ug-ai-header-sub">Your personal guidance advisor</div>
          </div>
        </div>

        <div className="ug-ai-messages">
          {messages.length === 0 ? (
            <motion.div className="ug-ai-empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="ug-ai-empty-icon">
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="14" stroke="#D4AF67" strokeWidth="1" />
                  <circle cx="16" cy="16" r="5" fill="#D4AF67" />
                </svg>
              </div>
              <h2 className="ug-ai-empty-title">How can I guide you today?</h2>
              <p className="ug-ai-empty-desc">Ask me about career paths, skills, opportunities, or academic decisions.</p>
              <div className="ug-ai-quick-actions">
                {quickActions.map((qa, i) => (
                  <motion.button
                    key={i}
                    className="ug-ai-quick-btn"
                    onClick={() => sendMessage(qa.prompt)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    whileHover={{ y: -2 }}
                  >
                    <span>{qa.icon}</span>
                    {qa.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="ug-ai-messages-list">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`ug-ai-msg ${msg.role === 'user' ? 'ug-ai-msg-user' : 'ug-ai-msg-assistant'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {msg.role === 'assistant' && (
                    <div className="ug-ai-msg-avatar">
                      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" stroke="#D4AF67" strokeWidth="1" />
                        <circle cx="16" cy="16" r="4" fill="#D4AF67" />
                      </svg>
                    </div>
                  )}
                  <div className="ug-ai-msg-bubble">
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <Avatar name={userName} size="sm" />
                  )}
                </motion.div>
              ))}
              {loading && (
                <motion.div className="ug-ai-msg ug-ai-msg-assistant" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="ug-ai-msg-avatar">
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="14" stroke="#D4AF67" strokeWidth="1" />
                      <circle cx="16" cy="16" r="4" fill="#D4AF67" />
                    </svg>
                  </div>
                  <div className="ug-ai-msg-bubble ug-ai-typing">
                    <span /><span /><span />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="ug-ai-input-area">
          <div className="ug-ai-input-wrapper">
            <textarea
              ref={inputRef}
              className="ug-ai-input"
              placeholder="Ask for guidance..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="ug-ai-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div className="ug-ai-input-footer">UniGuide AI may produce inaccurate information. Verify important decisions.</div>
        </div>
      </div>

      {/* Context panel (desktop) */}
      <aside className="ug-ai-context">
        <div className="ug-ai-context-header">
          <h3>Student Context</h3>
        </div>
        <div className="ug-ai-context-body">
          <div className="ug-ai-context-section">
            <h4>Skills</h4>
            <div className="ug-ai-context-tags">
              <Badge color="gold" size="sm">Python</Badge>
              <Badge color="gold" size="sm">SQL</Badge>
              <Badge color="gold" size="sm">Analytics</Badge>
              <Badge color="silver" size="sm">React</Badge>
            </div>
          </div>
          <div className="ug-ai-context-section">
            <h4>Interests</h4>
            <div className="ug-ai-context-tags">
              <Badge color="ai" size="sm">Data Science</Badge>
              <Badge color="ai" size="sm">AI/ML</Badge>
            </div>
          </div>
          <div className="ug-ai-context-section">
            <h4>Goals</h4>
            <div className="ug-ai-context-tags">
              <Badge color="success" size="sm">Internship</Badge>
              <Badge color="success" size="sm">Career Switch</Badge>
            </div>
          </div>
          <div className="ug-ai-context-section">
            <h4>Education</h4>
            <p className="ug-ai-context-text">Computer Science — 3rd Year</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
