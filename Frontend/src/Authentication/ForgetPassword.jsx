import React, { useState } from 'react'
import Logo from '../assets/Image/UniGuide 1.png'
import { toast } from 'react-toastify'
import '../assets/Style/ForgetPassword.css'
import axios from 'axios'
const ForgetPassword = () => {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!email) {
      setError("Please enter your email")
      return
    }

    try {
      const res = await axios.post('http://localhost:8000/api/v1/auth/password-reset/', {'email' : email})

      if (res.status === 200) {
        toast.success("A link to reset your password has been sent to your email")
        setSuccess(true)
      } else {
        setError("Something went wrong. Please try again.")
      }
    } catch (err) {
      console.log(err)
      if (err.response && err.response.data && err.response.data.email) {
        setError(err.response.data.email[0])
      } else {
        setError("Failed to send reset link. Try again later.")
      }
    }

    setEmail("")
  }

  return (
    <div className="forget-wrapper">
      <div className="bg-glow bg-glow-teal" />
      <div className="bg-glow bg-glow-orange" />

      <div className="forget-box">

        {/* Logo */}
        <div className="text-center mb-4 logo-area">
          <img src={Logo} alt="UniGuide AI" className="logo-img mb-2" />
          <h1 className="brand-name mb-1">UniGuide <span>AI</span></h1>
          <span className="brand-tag">
            <i className="dot me-1" />
            AI Career &amp; Internship Navigator
          </span>
        </div>

        {/* Card */}
        <div className="forget-card p-4">

          {/* Lock Icon */}
          <div className="d-flex justify-content-center mb-3">
            <div className="forget-icon-wrap">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-4">
            <h2 className="card-title-text mb-1">Forgot your password?</h2>
            <p className="card-sub-text">
              No worries! Enter your email and we'll<br />
              send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="mb-4 field-group">
              <label className="custom-label">Email address</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none"
                  stroke="#00b4d8" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M2 8l10 6 10-6"/>
                </svg>
                <input
                  type="email"
                  name="email"
                  className="custom-input form-control"
                  placeholder="john@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="error-msg mb-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#f77f00" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="success-msg mb-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#22c97a" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                Reset link sent! Check your inbox.
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn forget-btn w-100 mb-3">
              Send Reset Link →
            </button>

          </form>

          {/* Divider */}
          <div className="divider my-3">
            <span /><em>or</em><span />
          </div>

          {/* Back Links */}
          <div className="text-center">
            <p className="login-link mb-1">
              Remember your password? <a href="/login">Sign in</a>
            </p>
            <p className="login-link mb-0">
              New here? <a href="/">Create account</a>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ForgetPassword