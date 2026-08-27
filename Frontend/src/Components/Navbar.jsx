import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '../Context/ThemeContext'
import '../assets/Style/Navbar.css'
import Logo from '../assets/Image/UniGuide 1.png'

const Navbar = () => {
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join("");
  };

  let user = null;
  try {
    const stored = localStorage.getItem("user");
    user = stored ? JSON.parse(stored) : null;
  } catch {
    user = null;
  }

  return (
    <nav className={`navbar-wrapper ${theme === 'light' ? 'navbar-light' : ''}`}>

      {/* Brand */}
      <div className="nav-brand">
        <img src={Logo} alt="UniGuide AI" className="nav-logo" />
        <span className="nav-title">UniGuide <span>AI</span></span>
      </div>

      {/* Links */}
      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <NavLink to="/home"        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>Home</NavLink>
        <NavLink to="/about"       className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>About</NavLink>
        <NavLink to="/ai"          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>UniGuide AI</NavLink>
        <NavLink to="/hackathon"   className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>Hackathon</NavLink>
        <NavLink to="/itnews"      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>IT Market News</NavLink>
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

      {/* Profile Button */}
        <NavLink to={user ? "/home" : "/login"} className="profile-btn">
        <div className="nav-avatar">
          {user?.profile_picture ? (
            <img src={user.profile_picture} alt="Profile" className="nav-avatar-img" />
          ) : (
            getInitials(user?.full_name)
          )}
        </div>
        <span className="nav-username">{user?.full_name || "Sign In"}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="#4a7fa0" strokeWidth="2" strokeLinecap="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </NavLink>


    </nav>
  )
}

export default Navbar