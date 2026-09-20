import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Modal, Tabs } from './ui';
import LoginForm from '../Authentication/LoginForm';
import RegisterForm from '../Authentication/RegisterForm';
import GoogleOAuthButton from '../Authentication/SocialAuthentication';
import { useAuth } from '../Context/AuthContext';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/AuthModal.css';

const AuthModal = () => {
  const { authModalOpen, closeAuthModal, authModalTarget, isAuthenticated } = useAuth();
  const [tab, setTab] = useState('signin');
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-close when the user becomes authenticated (e.g. via Google OAuth).
  useEffect(() => {
    if (isAuthenticated) closeAuthModal();
  }, [isAuthenticated, closeAuthModal]);

  useEffect(() => {
    if (authModalOpen) setTab('signin');
  }, [authModalOpen]);

  // Close if the user navigates away from the page that opened the modal
  // (e.g. clicking "Forgot password?" or the About link inside the modal).
  useEffect(() => {
    if (authModalOpen) closeAuthModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLoginSuccess = () => {
    closeAuthModal();
    navigate(authModalTarget || location.pathname || '/', { replace: true });
  };

  const handleRegisterSuccess = (email) => {
    closeAuthModal();
    navigate('/otp/verify', { state: { email } });
  };

  return (
    <Modal
      isOpen={authModalOpen}
      onClose={closeAuthModal}
      className="ug-auth-modal"
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div variants={fadeUp} custom={0}>
          <div className="ug-auth-modal-head">
            <div className="ug-auth-modal-logo">
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="#D4AF67" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="5" fill="#D4AF67" />
              </svg>
            </div>
            <h2 className="ug-auth-modal-title">
              {tab === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="ug-auth-modal-subtitle">
              {tab === 'signin'
                ? 'Sign in to access your guidance, opportunities and more.'
                : 'Sign up to start your guided journey today.'}
            </p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={1}>
          <Tabs
            className="ug-auth-modal-tabs"
            activeTab={tab}
            onTabChange={setTab}
            tabs={[
              { id: 'signin', label: 'Sign In' },
              { id: 'signup', label: 'Create Account' },
            ]}
          />
        </motion.div>

        <div className="ug-auth-modal-body">
          {tab === 'signin' ? (
            <LoginForm onSuccess={handleLoginSuccess} />
          ) : (
            <RegisterForm onSuccess={handleRegisterSuccess} />
          )}

          <motion.div variants={fadeUp} custom={8}>
            <div className="auth-divider">or</div>
          </motion.div>
          <motion.div variants={fadeUp} custom={9}>
            <GoogleOAuthButton redirectPath={authModalTarget || location.pathname || '/'} />
          </motion.div>
          <motion.div variants={fadeUp} custom={10}>
            <p className="auth-switch">
              {tab === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button type="button" className="auth-link-btn" onClick={() => setTab('signup')}>Create one</button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" className="auth-link-btn" onClick={() => setTab('signin')}>Sign in</button>
                </>
              )}
            </p>
          </motion.div>
        </div>

        <motion.p className="ug-auth-modal-terms" variants={fadeUp} custom={11}>
          By continuing you agree to our terms. <Link to="/about" onClick={closeAuthModal}>Learn more</Link>
        </motion.p>
      </motion.div>
    </Modal>
  );
};

export default AuthModal;