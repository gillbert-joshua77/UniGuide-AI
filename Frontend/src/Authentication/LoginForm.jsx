import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../Utils/axiosInstance';
import { Button, Input } from '../Components/ui';
import { useAuth } from '../Context/useAuth';
import { fadeUp } from '../lib/motion';
import '../assets/Style/Auth.css';

export default function LoginForm({ onSuccess, redirectTo, className = '' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await axiosInstance.post('/auth/login/', { email, password });
      await login(data);
      if (onSuccess) {
        onSuccess(data);
        return;
      }
      navigate(redirectTo || '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
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
  );
}