import React, { useState } from 'react'
import Logo from '../assets/Image/UniGuide 1.png'
import '../assets/Style/ResetPassword.css'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const ResetPassword = () => {
  const navigate = useNavigate()
  const { uid, token } = useParams()

  const [newPassword, setNewPassword] = useState({
    password: '',
    confirm_password: '',
  })

  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm,  setShowConfirm]    = useState(false)
  const [error,        setError]          = useState('')
  const [success,      setSuccess]        = useState(false)

  const { password, confirm_password } = newPassword

  const strength = (() => {
    const len = password.length
    if (len === 0) return { pct: '0%',   label: '',       color: 'transparent' }
    if (len < 6)   return { pct: '25%',  label: 'Weak',   color: '#e24b4a'     }
    if (len < 8)   return { pct: '50%',  label: 'Fair',   color: '#f77f00'     }
    if (len < 12)  return { pct: '75%',  label: 'Good',   color: '#00b4d8'     }
    return               { pct: '100%', label: 'Strong', color: '#22c97a'     }
  })()

  const handleChange = (e) => {
    setError('')
    setNewPassword({ ...newPassword, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!password || !confirm_password)  return setError('All fields are required.')
    if (password.length < 8)             return setError('Password must be at least 8 characters.')
    if (password !== confirm_password)   return setError('Passwords do not match.')

    const data = {
      "password":         password,
      "confirm_password": confirm_password,
      "uidb64":           uid,
      "token":            token,
    }
      console.log('UID:', uid)
      console.log('TOKEN:', token)
      console.log('DATA SENT:', data)

    try {
      const response = await axios.patch(
        'http://localhost:8000/api/v1/auth/set-new-password/',
        data
      )
      if (response.data.status === 200 || response.status === 200) {
        setSuccess(true)
        toast.success(response.data.message || 'Password reset successful!')
        setTimeout(() => navigate('/login'), 2000)
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Something went wrong. Try again.'
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <div className="reset-wrapper">
      <div className="bg-glow bg-glow-teal" />
      <div className="bg-glow bg-glow-orange" />

      <div className="reset-box">

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
        <div className="reset-card p-4">

          {/* Shield Icon */}
          <div className="d-flex justify-content-center mb-3">
            <div className="reset-icon-wrap">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-4">
            <h2 className="card-title-text mb-1">Reset your password</h2>
            <p className="card-sub-text">
              Enter your new password below.<br />
              Make sure it's strong and secure.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* New Password */}
            <div className="mb-3 field-group">
              <label className="custom-label">New password</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none"
                  stroke="#00b4d8" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="custom-input form-control"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={handleChange}
                />
                <button type="button" className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#4a7fa0" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#4a7fa0" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Strength Bar */}
              {password && (
                <div className="strength-wrap mt-2">
                  <div className="strength-bar-bg">
                    <div className="strength-bar-fill"
                      style={{ width: strength.pct, background: strength.color }} />
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-4 field-group">
              <label className="custom-label">Confirm new password</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none"
                  stroke="#f77f00" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 12l2 2 4-4"/>
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirm_password"
                  className="custom-input form-control"
                  placeholder="Repeat new password"
                  value={confirm_password}
                  onChange={handleChange}
                />
                <button type="button" className="eye-btn"
                  onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#4a7fa0" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#4a7fa0" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Match Indicator */}
              {confirm_password && (
                <div className="match-indicator mt-1">
                  {password === confirm_password ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="#22c97a" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      <span style={{ color: '#22c97a' }}>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="#f77f00" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      <span style={{ color: '#f77f00' }}>Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
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
                Password reset successful! Redirecting to login...
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn reset-btn w-100 mb-3"
              disabled={success}>
              {success ? 'Redirecting...' : 'Reset Password →'}
            </button>

          </form>

          <p className="login-link text-center mb-0">
            <a href="/login">← Back to Sign in</a>
          </p>

        </div>
      </div>
    </div>
  )
}

export default ResetPassword