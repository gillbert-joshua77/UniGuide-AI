import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GuidanceCore from '../Components/three/GuidanceCore';
import GoogleOAuthButton from './SocialAuthentication';
import RegisterForm from './RegisterForm';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/Auth.css';

export default function Register() {
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

          <RegisterForm />

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