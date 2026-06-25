import React, { useState } from 'react'
import '../assets/Style/Register.css';
import Logo from '../assets/Image/UniGuide 1.png';
import axios from "axios"
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import SocialLoginPopup from './SocialAuthentication';


const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSocialPopup, setShowSocialPopup] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password2: "",
  });

  const [error, setError] = useState("");

  const handleOnChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (
    !formData.email ||
    !formData.first_name ||
    !formData.last_name ||
    !formData.password ||
    !formData.password2
  ) {
    setError("All fields are required");
    return;
  }

  try {
    setLoading(true); // 🔥 START LOADING

    console.log("SENDING 👉", formData);

    const res = await axios.post(
      "http://localhost:8000/api/v1/auth/register/",
      formData
    );

    const response = res.data;

    if (res.status === 201) {
      toast.success(response.message);
      navigate("/otp/verify");
    }
  } catch (err) {
  console.log("ERROR 👉", err.response?.data);

  if (err.response?.data) {
    const errors = err.response.data;

    const firstError = Object.values(errors)[0];
    setError(Array.isArray(firstError) ? firstError[0] : firstError);
  } else {
    setError("Server error");
  }
} finally {
    setLoading(false); // 🔥 STOP LOADING
  }
};
  return (
    <div className="signup-wrapper">
      <div className="bg-glow bg-glow-teal" />
      <div className="bg-glow bg-glow-orange" />
      
      <div className="signup-box">
        
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
        <div className="signup-card p-4">

          <div className="mb-4">
            <h2 className="card-title-text mb-1">Create your account</h2>
            <p className="card-sub-text">Start your guided career journey today</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Name Row */}
            <div className="row g-2 mb-3">
              <div className="col-6 field-group">
                <label className="custom-label">First name</label>
                <div className="input-wrap">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input type="text"
                    name="first_name"
                    className="custom-input form-control"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleOnChange} />
                </div>
              </div>
              <div className="col-6 field-group">
                <label className="custom-label">Last name</label>
                <div className="input-wrap">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input type="text"
                    name="last_name"
                    className="custom-input form-control"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleOnChange} />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="mb-3 field-group">
              <label className="custom-label">Email address</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/>
                </svg>
                <input type="email"
                  name="email"
                  className="custom-input form-control"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleOnChange} />
              </div>
            </div>

            {/* Password */}
            <div className="mb-3 field-group">
              <label className="custom-label">Password</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input type="password"
                  name="password"
                  className="custom-input form-control"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleOnChange} />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-4 field-group">
              <label className="custom-label">Confirm password</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 12l2 2 4-4"/><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input type="password"
                  name="password2"
                  className="custom-input form-control"
                  placeholder="Repeat password"
                  value={formData.password2}
                  onChange={handleOnChange} />
              </div>
            </div>
            {/* Error Message */}
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
            <button 
              type="submit" 
              className="btn signup-btn w-100 mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Creating...
                </>
              ) : (
                "Create Account →"
              )}
            </button> 
          </form>

          {/* Social Authentication*/}
          <div className="divider my-3">
            <span /><em>or</em><span />
          </div>

          <button
            type="button"
            className="btn google-btn w-100 mb-3"
            onClick={() => setShowSocialPopup(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
            </svg>
            Continue with social account
          </button>

          {showSocialPopup && (
            <SocialLoginPopup onClose={() => setShowSocialPopup(false)} />
          )}

          <p className="login-link text-center mb-0">
            Already have an account? <a href="/login">Log in</a>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Register