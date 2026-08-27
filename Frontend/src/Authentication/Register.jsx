import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../Utils/axiosInstance';
import GuidanceCore from '../Components/three/GuidanceCore';
import GoogleOAuthButton from './SocialAuthentication';
import { Button, Input } from '../Components/ui';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/Auth.css';

function extractApiError(data) {
  if (!data) return 'Registration failed.';
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (data.error) return data.error;
  if (data.non_field_errors) return Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
  const first = Object.values(data)[0];
  return Array.isArray(first) ? first[0] : (first || 'Registration failed.');
}

export default function Register() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', password_confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password !== form.password_confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      await axiosInstance.post('/auth/register/', {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        password2: form.password_confirm,
      });
      navigate('/otp/verify', { state: { email: form.email } });
    } catch (err) {
      const data = err.response?.data;
      setError(extractApiError(data));
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
          <p className="auth-left-desc">Join thousands of students making informed decisions about their future.</p>
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
            <motion.h2 className="auth-title" variants={fadeUp} custom={1}>Create your account</motion.h2>
            <motion.p className="auth-subtitle" variants={fadeUp} custom={2}>Start your guided journey today.</motion.p>

            {error && <motion.div className="auth-error" variants={fadeUp}>{error}</motion.div>}

            <motion.div variants={fadeUp} custom={3}>
              <div className="auth-field-row">
                <Input label="First Name" placeholder="Your first name" value={form.first_name} onChange={update('first_name')} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
                <Input label="Last Name" placeholder="Your last name" value={form.last_name} onChange={update('last_name')} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={4}>
              <Input label="Email" type="email" placeholder="you@university.edu" value={form.email} onChange={update('email')} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} />
            </motion.div>
            <motion.div variants={fadeUp} custom={5}>
              <Input label="Password" type="password" placeholder="Create a password" value={form.password} onChange={update('password')} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
            </motion.div>
            <motion.div variants={fadeUp} custom={6}>
              <Input label="Confirm Password" type="password" placeholder="Confirm your password" value={form.password_confirm} onChange={update('password_confirm')} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
            </motion.div>
            <motion.div variants={fadeUp} custom={7}>
              <Button type="submit" variant="gold" size="lg" className="auth-submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </motion.div>
          </form>

          <motion.div variants={fadeUp} custom={8}>
            <div className="auth-divider">or</div>
          </motion.div>
          <motion.div variants={fadeUp} custom={9}>
            <GoogleOAuthButton />
          </motion.div>
          <motion.p className="auth-switch" variants={fadeUp} custom={10}>
            Already have an account? <Link to="/login">Sign in</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
