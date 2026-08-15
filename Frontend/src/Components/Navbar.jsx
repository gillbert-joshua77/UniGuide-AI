  import React from 'react'
import { NavLink } from 'react-router-dom'
import '../assets/Style/Navbar.css'
import Logo from '../assets/Image/UniGuide 1.png'

const Navbar = ({ theme = 'dark' }) => {
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
      <div className="nav-links">
        <NavLink to="/home"        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink>
        <NavLink to="/about"       className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>About</NavLink>
        <NavLink to="/ai"          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>UniGuide AI</NavLink>
        <NavLink to="/hackathon"   className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Hackathon</NavLink>
        <NavLink to="/itnews"      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>IT Market News</NavLink>
      </div>

      {/* Profile Button */}
      <NavLink to={user ? "/dashboard" : "/login"} className="profile-btn">
        <div className="nav-avatar">{getInitials(user?.full_name)}</div>
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