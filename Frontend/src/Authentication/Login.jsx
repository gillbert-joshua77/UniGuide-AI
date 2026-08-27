import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../Utils/axiosInstance';
import GuidanceCore from '../Components/three/GuidanceCore';
import GoogleOAuthButton from './SocialAuthentication';
import { Button, Input } from '../Components/ui';
import { useAuth } from '../Context/AuthContext';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loadProfile } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await axiosInstance.post('/auth/login/', { email, password });
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      // Load the authenticated user's real profile before navigating.
      await loadProfile().catch(() => {});
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="auth-left-content">
          <GuidanceCore size={280} />
          <h1 className="auth-left-title">Your future,<br />better guided.</h1>
          <p className="auth-left-desc">AI-powered academic, career, and opportunity guidance for students.</p>
        </div>
      </div>
      <div className="auth-right">
        <motion.div className="auth-form" variants={staggerContainer} initial="hidden" animate="visible">
          <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <motion.div variants={fadeUp} custom={0}>
              <Link to="/" className="auth-logo">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="14" stroke="#D4AF67" strokeWidth="1.5" />
                  <circle cx="16" cy="16" r="5" fill="#D4AF67" />
                </svg>
                <span>UniGuide <span className="auth-logo-ai">AI</span></span>
              </Link>
            </motion.div>
            <motion.h2 className="auth-title" variants={fadeUp} custom={1}>Welcome back</motion.h2>
            <motion.p className="auth-subtitle" variants={fadeUp} custom={2}>Sign in to continue your guidance journey.</motion.p>

            {error && <motion.div className="auth-error" variants={fadeUp}>{error}</motion.div>}

            <motion.div variants={fadeUp} custom={3}>
              <Input
                label="Email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
              />
            </motion.div>
            <motion.div variants={fadeUp} custom={4}>
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              />
            </motion.div>
            <motion.div className="auth-options" variants={fadeUp} custom={5}>
              <Link to="/forgetpassword" className="auth-link">Forgot password?</Link>
            </motion.div>
            <motion.div variants={fadeUp} custom={6}>
              <Button type="submit" variant="gold" size="lg" className="auth-submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </motion.div>
          </form>

          <motion.div variants={fadeUp} custom={7}>
            <div className="auth-divider">or</div>
          </motion.div>
          <motion.div variants={fadeUp} custom={8}>
            <GoogleOAuthButton />
          </motion.div>
          <motion.p className="auth-switch" variants={fadeUp} custom={9}>
            Don't have an account? <Link to="/register">Create one</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
