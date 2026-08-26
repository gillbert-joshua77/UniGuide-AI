import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../Utils/axiosInstance';
import { Button, Input } from '../Components/ui';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/Auth.css';

export default function ResetPassword() {
  const { uid, token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirm) { setError('Please fill in all fields.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      await axiosInstance.post('/api/auth/password-reset-confirm/', { uid, token, new_password: password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="auth-left-content">
          <h1 className="auth-left-title">Set new<br />password</h1>
          <p className="auth-left-desc">Choose a strong password for your account.</p>
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
          <motion.h2 className="auth-title" variants={fadeUp} custom={1}>Reset password</motion.h2>
          <motion.p className="auth-subtitle" variants={fadeUp} custom={2}>
            {success ? 'Password reset successfully! Redirecting...' : 'Enter your new password below.'}
          </motion.p>

          {error && <motion.div className="auth-error" variants={fadeUp}>{error}</motion.div>}

          {!success && (
            <>
              <motion.div variants={fadeUp} custom={3}>
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                />
              </motion.div>
              <motion.div variants={fadeUp} custom={4}>
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                />
              </motion.div>
              <motion.div variants={fadeUp} custom={5}>
                <Button type="submit" variant="gold" size="lg" className="auth-submit" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </motion.div>
            </>
          )}
        </motion.form>
      </div>
    </div>
  );
}
