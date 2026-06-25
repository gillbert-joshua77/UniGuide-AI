import React, { useState, useRef } from 'react'
import Logo from '../assets/Image/UniGuide 1.png';
import '../assets/Style/OtpFrom.css'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const OtpForm = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // ✅ ARRAY
  const [loading, setLoading] = useState(false)
  const inputs = useRef([])
  const navigate = useNavigate()

  // 🔥 Handle input change
  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // move to next box
    if (value && index < 5) {
      inputs.current[index + 1].focus()
    }
  }

  // 🔥 Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus()
    }
  }

  // 🔥 Handle paste
  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").slice(0, 6)
    if (!/^\d+$/.test(paste)) return

    const newOtp = paste.split("")
    setOtp(newOtp)

    newOtp.forEach((val, i) => {
      if (inputs.current[i]) {
        inputs.current[i].value = val
      }
    })
  }

  // 🔥 Submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    const otpValue = otp.join("")

    if (otpValue.length !== 6) {
      toast.error("Enter full OTP")
      return
    }

    try {
      setLoading(true)

      const response = await axios.post(
        "http://localhost:8000/api/v1/auth/verify-email/",
        { otp: otpValue } // ✅ correct
      )

      if (response.status === 200) {
        toast.success(response.data.message)
        navigate('/login')
      }

    } catch (err) {
      console.log("ERROR 👉", err.response?.data)

      if (err.response?.data) {
        const errors = err.response.data
        const firstError = Object.values(errors)[0]
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError)
      } else {
        toast.error("Verification failed")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="otp-wrapper">
      <div className="bg-glow bg-glow-teal" />
      <div className="bg-glow bg-glow-orange" />

      <div className="otp-box">

        {/* Logo */}
        <div className="text-center mb-4 logo-area">
          <img src={Logo} alt="UniGuide AI" className="logo-img mb-2" />
          <h1 className="brand-name mb-1">UniGuide <span>AI</span></h1>
          <span className="brand-tag">
            <i className="dot me-1" />
            AI Career & Internship Navigator
          </span>
        </div>

        {/* ✅ FORM */}
        <form onSubmit={handleSubmit} className="otp-card p-4">

          {/* Icon */}
          <div className="d-flex justify-content-center mb-3">
            <div className="otp-icon-wrap">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M2 8l10 6 10-6"/>
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-4">
            <h2 className="card-title-text mb-1">Verify your email</h2>
            <p className="card-sub-text">
              We sent a 6-digit code to your email.<br />
              Enter it below to continue.
            </p>
          </div>

          {/* 🔥 YOUR ORIGINAL STYLE (FIXED) */}
          <div className="otp-inputs mb-4" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(e.target.value, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                className={`otp-input ${digit ? 'filled' : ''}`}
              />
            ))}
          </div>

          {/* Button */}
          <button type="submit" className="btn verify-btn w-100" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Continue →"}
          </button>

          {/* Divider */}
          <div className="divider my-3">
            <span /><em>or</em><span />
          </div>

          {/* Resend */}
          <div className="text-center">
            <p className="resend-text mb-1">Didn't receive the code?</p>
            <button type="button" className="btn resend-btn">
              Resend OTP
            </button>
          </div>

          {/* Back */}
          <p className="login-link text-center mt-3 mb-0">
            <a href="/">← Back to register</a>
          </p>

        </form>
      </div>
    </div>
  );
};

export default OtpForm;