import React from 'react'
import Logo from '../assets/Image/UniGuide 1.png';
import '../assets/Style/Login.css';
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOnChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, password } = loginData;

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const res = await axios.post(
        "http://localhost:8000/api/v1/auth/login/",
        { email, password }
      );
      console.log(res.data);

      if (res.status === 200) {
        toast.success("Login Success 🎉");
        localStorage.setItem("accessToken", res.data.access_token);
        localStorage.setItem("refreshToken", res.data.refresh_token);
        localStorage.setItem("user", JSON.stringify({
          email: res.data.email,
          full_name: res.data.full_name
        }));
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }

    } catch (err) {
      if (err.response) {
        setError(err.response.data.detail || "Login failed");
        toast.error(err.response.data.detail || "Invalid credentials ❌");
      } else {
        setError("Server error. Please try again.");
        toast.error("Server error ⚠️");
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="login-wrapper">
      <div className="bg-glow bg-glow-teal" />
      <div className="bg-glow bg-glow-orange" />

      <div className="login-box">

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
        <div className="login-card p-4">

          {/* Heading */}
          <div className="mb-4">
            <h2 className="card-title-text mb-1">Welcome back</h2>
            <p className="card-sub-text">Sign in to continue your journey</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="mb-3 field-group">
              <label className="custom-label">Email address</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none"
                  stroke="#00b4d8" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 8l10 6 10-6" />
                </svg>
                <input
                  type="email"
                  name="email"
                  className="custom-input form-control"
                  placeholder="john@example.com"
                  value={loginData.email}
                  onChange={handleOnChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-2 field-group">
              <label className="custom-label">Password</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none"
                  stroke="#00b4d8" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="custom-input form-control"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={handleOnChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#4a7fa0" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#4a7fa0" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message mt-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Forgot Password */}
            <div className="text-end mb-4 mt-2">
              <a href="/forgetpassword" className="forgot-link">Forgot password?</a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="btn login-btn w-100 mb-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="btn-loading-content">
                  <span className="spinner" />
                  Signing in...
                </span>
              ) : (
                'Sign In →'
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="divider my-3">
            <span /><em>or</em><span />
          </div>

          {/* Google */}
          <button className="btn google-btn w-100 mb-3" disabled={isLoading}>
            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
              <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0112 5c1.69 0 3.21.6 4.4 1.57l3.29-3.29A12 12 0 000 12c0 1.94.46 3.77 1.28 5.38z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.67-3.02A7.1 7.1 0 0112 19.1c-3.4 0-6.28-2.3-7.31-5.4L.82 17.1A12 12 0 0012 24z" />
              <path fill="#4A90E2" d="M23.76 12.27c0-.82-.07-1.62-.2-2.4H12v4.54h6.61A5.65 5.65 0 0116.27 18l3.67 3.02C22.19 18.99 23.76 15.87 23.76 12.27z" />
              <path fill="#FBBC05" d="M4.69 13.7A7.14 7.14 0 014.62 12c0-.6.08-1.17.22-1.72L1.28 6.62A12 12 0 000 12c0 1.94.46 3.77 1.28 5.38z" />
            </svg>
            Continue with Google
          </button>

          <p className="login-link text-center mb-0">
            Don't have an account? <a href="/">Sign up</a>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;
