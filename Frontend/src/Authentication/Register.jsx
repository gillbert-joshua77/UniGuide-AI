import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../Utils/axiosInstance';
import GuidanceCore from '../Components/three/GuidanceCore';
import { Button, Input } from '../Components/ui';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password !== form.password_confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      await axiosInstance.post('/auth/register/', {
        first_name: form.name.split(' ')[0] || form.name,
        last_name: form.name.split(' ').slice(1).join(' ') || '',
        email: form.email,
        password: form.password,
        password2: form.password_confirm,
      });
      navigate('/otp/verify', { state: { email: form.email } });
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || data?.error || Object.values(data?.errors || {})[0]?.[0] || 'Registration failed.');
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
          <motion.h2 className="auth-title" variants={fadeUp} custom={1}>Create your account</motion.h2>
          <motion.p className="auth-subtitle" variants={fadeUp} custom={2}>Start your guided journey today.</motion.p>

          {error && <motion.div className="auth-error" variants={fadeUp}>{error}</motion.div>}

          <motion.div variants={fadeUp} custom={3}>
            <Input label="Full Name" placeholder="Your name" value={form.name} onChange={update('name')} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
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
          <motion.p className="auth-switch" variants={fadeUp} custom={8}>
            Already have an account? <Link to="/login">Sign in</Link>
          </motion.p>
        </motion.form>
      </div>
    </div>
  );
}
