import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../Context/AuthContext";
import { Button } from "../Components/ui";
import { fadeUp, staggerContainer } from "../lib/motion";
import "../assets/Style/RequireAuth.css";

const RequireAuth = ({ children }) => {
  const { isAuthenticated, ready, openAuthModal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      openAuthModal(location.pathname);
    }
  }, [ready, isAuthenticated, openAuthModal, location.pathname]);

  if (!ready) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="ug-require auth-layout">
        <motion.div
          className="ug-require-card"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="ug-require-icon" variants={fadeUp} custom={0}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </motion.div>
          <motion.h1 className="ug-require-title" variants={fadeUp} custom={1}>
            Members only
          </motion.h1>
          <motion.p className="ug-require-desc" variants={fadeUp} custom={2}>
            This page is available to signed-in students. Create an account or
            sign in to continue your guided journey.
          </motion.p>
          <motion.div className="ug-require-actions" variants={fadeUp} custom={3}>
            <Button
              variant="gold"
              size="lg"
              onClick={() => openAuthModal(location.pathname)}
            >
              Sign In / Create Account
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return children;
};

export default RequireAuth;