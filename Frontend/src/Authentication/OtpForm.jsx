import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../Utils/axiosInstance';
import { Button } from '../Components/ui';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/Auth.css';

export default function OtpForm() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      await axiosInstance.post('/api/auth/otp/verify/', { email, otp: code });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await axiosInstance.post('/api/auth/otp/resend/', { email });
      setResendTimer(60);
    } catch { /* silent */ }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="auth-left-content">
          <h1 className="auth-left-title">Verify your<br />account</h1>
          <p className="auth-left-desc">We've sent a verification code to your email address.</p>
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
          <motion.h2 className="auth-title" variants={fadeUp} custom={1}>Enter verification code</motion.h2>
          <motion.p className="auth-subtitle" variants={fadeUp} custom={2}>
            Code sent to <strong>{email || 'your email'}</strong>
          </motion.p>

          {error && <motion.div className="auth-error" variants={fadeUp}>{error}</motion.div>}

          <motion.div className="otp-inputs" variants={fadeUp} custom={3}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="otp-input"
              />
            ))}
          </motion.div>

          <motion.div variants={fadeUp} custom={4}>
            <Button type="submit" variant="gold" size="lg" className="auth-submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} custom={5}>
            {resendTimer > 0 ? (
              <p className="auth-subtitle" style={{ textAlign: 'center' }}>Resend code in {resendTimer}s</p>
            ) : (
              <button type="button" className="auth-link" onClick={handleResend} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center' }}>
                Resend code
              </button>
            )}
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
}
