import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../Context/ThemeContext'
import { useAuth } from '../../Context/AuthContext'
import '../../assets/Style/Navbar.css'
import Logo from '../../assets/Image/UniGuide 1.png'

const Navbar = () => {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word[0]?.toUpperCase())
      .join("");
  };

  const navItems = [
    { to: '/home', label: 'Home' },
    { to: '/guidance', label: 'Guidance' },
    { to: '/opportunities', label: 'Opportunities' },
    { to: '/news', label: 'News' },
    { to: '/my-journey', label: 'My Journey' },
  ];

  const isActive = (to) => location.pathname === to;

  return (
    <nav className={`navbar-wrapper ${theme === 'light' ? 'navbar-light' : ''}`}>

      {/* Brand */}
      <div className="nav-brand">
        <img src={Logo} alt="UniGuide AI" className="nav-logo" />
        <span className="nav-title">UniGuide <span>AI</span></span>
      </div>

      {/* Links */}
      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={() => isActive(item.to) ? 'nav-link active' : 'nav-link'}
            onClick={closeMenu}
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Mobile menu toggle */}
      <button
        className={`nav-menu-toggle ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Theme Toggle */}
      <button
        className="nav-theme-toggle"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle light and dark mode"
      >
        {theme === 'dark' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        )}
      </button>

      {/* User menu */}
      <div className="nav-user-menu" ref={userMenuRef}>
        <button
          className="profile-btn"
          onClick={() => setUserMenuOpen(o => !o)}
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
        >
          <div className="nav-avatar">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt="Profile" className="nav-avatar-img" />
            ) : (
              getInitials(user?.full_name)
            )}
          </div>
          <span className="nav-username">{user?.full_name || "Sign In"}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>

        {userMenuOpen && (
          <div className="nav-dropdown" role="menu">
            <div className="nav-dropdown-header">
              <span className="nav-dropdown-name">{user?.full_name || "Student"}</span>
              <span className="nav-dropdown-email">{user?.email || ""}</span>
            </div>
            <button className="nav-dropdown-item" role="menuitem" onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}>
              Profile
            </button>
            <button className="nav-dropdown-item" role="menuitem" onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}>
              Settings
            </button>
            <button className="nav-dropdown-item" role="menuitem" onClick={() => { setUserMenuOpen(false); navigate('/my-journey'); }}>
              My Journey
            </button>
            <div className="nav-dropdown-divider" />
            <button className="nav-dropdown-item nav-dropdown-logout" role="menuitem" onClick={() => { setUserMenuOpen(false); logout(); }}>
              Log Out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
