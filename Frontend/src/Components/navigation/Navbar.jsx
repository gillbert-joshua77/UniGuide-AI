import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../Context/ThemeContext';
import Avatar from '../ui/Avatar';
import './Navbar.css';

const navLinks = [
  { path: '/home', label: 'Home' },
  { path: '/ai', label: 'Guidance' },
  { path: '/hackathon', label: 'Opportunities' },
  { path: '/itnews', label: 'News' },
  { path: '/dashboard', label: 'My Journey' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const userName = localStorage.getItem('uniguide_user_name') || 'Student';
  const userEmail = localStorage.getItem('uniguide_user_email') || '';

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('uniguide_user_name');
    localStorage.removeItem('uniguide_user_email');
    navigate('/login');
    setProfileOpen(false);
  };

  return (
    <header className="ug-nav">
      <div className="ug-nav-inner">
        <Link to="/home" className="ug-nav-brand">
          <div className="ug-nav-logo">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#D4AF67" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="5" fill="#D4AF67" />
              <path d="M16 2 L20 8" stroke="#D4AF67" strokeWidth="1" strokeLinecap="round" />
              <path d="M16 2 L12 8" stroke="#D4AF67" strokeWidth="1" strokeLinecap="round" />
              <ellipse cx="16" cy="16" rx="14" ry="6" stroke="#D9D9D6" strokeWidth="0.75" transform="rotate(30 16 16)" />
            </svg>
          </div>
          <span className="ug-nav-brand-text">UniGuide <span className="ug-nav-brand-ai">AI</span></span>
        </Link>

        <nav className="ug-nav-links" role="navigation">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`ug-nav-link ${location.pathname === link.path ? 'ug-nav-link-active' : ''}`}
            >
              {link.label}
              {location.pathname === link.path && (
                <motion.div className="ug-nav-link-indicator" layoutId="nav-indicator" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
              )}
            </Link>
          ))}
        </nav>

        <div className="ug-nav-actions">
          <button className="ug-nav-theme" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          <div className="ug-nav-profile-wrapper">
            <button className="ug-nav-profile" onClick={() => setProfileOpen(!profileOpen)}>
              <Avatar name={userName} size="sm" gold />
              <span className="ug-nav-profile-name">{userName.split(' ')[0]}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <AnimatePresence>
              {profileOpen && (
                <>
                  <div className="ug-nav-dropdown-backdrop" onClick={() => setProfileOpen(false)} />
                  <motion.div
                    className="ug-nav-dropdown"
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="ug-nav-dropdown-header">
                      <Avatar name={userName} size="md" gold />
                      <div>
                        <div className="ug-nav-dropdown-name">{userName}</div>
                        {userEmail && <div className="ug-nav-dropdown-email">{userEmail}</div>}
                      </div>
                    </div>
                    <div className="ug-nav-dropdown-divider" />
                    <Link to="/dashboard" className="ug-nav-dropdown-item" onClick={() => setProfileOpen(false)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      My Journey
                    </Link>
                    <button className="ug-nav-dropdown-item ug-nav-dropdown-danger" onClick={handleLogout}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign Out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button className="ug-nav-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="ug-nav-mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <nav className="ug-nav-mobile-links">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`ug-nav-mobile-link ${location.pathname === link.path ? 'ug-nav-mobile-link-active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="ug-nav-mobile-footer">
              <button className="ug-nav-mobile-logout" onClick={handleLogout}>Sign Out</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
