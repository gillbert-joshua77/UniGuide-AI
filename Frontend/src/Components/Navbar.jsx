  import React from 'react'
import { NavLink } from 'react-router-dom'
import '../assets/Style/Navbar.css'
import Logo from '../assets/Image/UniGuide 1.png'

const Navbar = () => {
  const getInitials = (name) => {
  if (!name) return "";
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join("");
  };
  const user = JSON.parse(localStorage.getItem("user"));
  return (
    <nav className="navbar-wrapper">

      {/* Brand */}
      <div className="nav-brand">
        <img src={Logo} alt="UniGuide AI" className="nav-logo" />
        <span className="nav-title">UniGuide <span>AI</span></span>
      </div>

      {/* Links */}
      <div className="nav-links">
        <NavLink to="/home"        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink>
        <NavLink to="/about"       className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>About</NavLink>
        <NavLink to="/ai"    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>UniGuide AI</NavLink>
        <NavLink to="/hackathon"   className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Hackathon</NavLink>
        <NavLink to="/itnews"      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>IT Market News</NavLink>
      </div>

      {/* Profile Button */}
      <NavLink to="/dashboard" className="profile-btn">
        <div className="nav-avatar">{getInitials(user.full_name)}</div>
        <span className="nav-username">{user.full_name }</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="#4a7fa0" strokeWidth="2" strokeLinecap="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </NavLink>

    </nav>
  )
}

export default Navbar