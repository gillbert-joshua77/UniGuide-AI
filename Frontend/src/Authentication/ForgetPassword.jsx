import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../Utils/axiosInstance';
import { Button, Input } from '../components/ui';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/Auth.css';

export default function ForgetPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    setError('');
    setLoading(true);
    try {
      await axiosInstance.post('/api/auth/password-reset/', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="auth-left-content">
          <h1 className="auth-left-title">Reset your<br />password</h1>
          <p className="auth-left-desc">We'll help you get back into your account securely.</p>
        </div>
      </div>
      <div className="auth-right">
        <motion.form className="auth-form" onSubmit={handleSubmit} variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0}>
            <Link to="/" className="auth-logo">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="#D4AF67" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="5" fill="#D4AF67" />
              </svg>
              <span>UniGuide <span className="auth-logo-ai">AI</span></span>
            </Link>
          </motion.div>
          <motion.h2 className="auth-title" variants={fadeUp} custom={1}>Forgot password?</motion.h2>
          <motion.p className="auth-subtitle" variants={fadeUp} custom={2}>
            {sent ? 'Check your email for a reset link.' : "Enter your email and we'll send you a reset link."}
          </motion.p>

          {error && <motion.div className="auth-error" variants={fadeUp}>{error}</motion.div>}

          {!sent ? (
            <>
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
                <Button type="submit" variant="gold" size="lg" className="auth-submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </motion.div>
            </>
          ) : (
            <motion.div variants={fadeUp} custom={3}>
              <Link to="/login"><Button variant="primary" size="lg" className="auth-submit">Back to Sign In</Button></Link>
            </motion.div>
          )}

          <motion.p className="auth-switch" variants={fadeUp} custom={5}>
            Remember your password? <Link to="/login">Sign in</Link>
          </motion.p>
        </motion.form>
      </div>
    </div>
  );
}
