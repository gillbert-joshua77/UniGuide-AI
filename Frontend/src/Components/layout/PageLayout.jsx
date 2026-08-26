import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../navigation/Navbar';
import './PageLayout.css';

export default function PageLayout({ children, className = '' }) {
  return (
    <div className="ug-page">
      <Navbar />
      <motion.main
        className={`ug-page-content ${className}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.main>
      <footer className="ug-footer">
        <div className="ug-footer-inner">
          <div className="ug-footer-brand">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#D4AF67" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="5" fill="#D4AF67" />
            </svg>
            <span>UniGuide AI</span>
          </div>
          <div className="ug-footer-copy">&copy; {new Date().getFullYear()} UniGuide AI. All rights reserved.</div>
          <div className="ug-footer-links">
            <a href="/about">About</a>
            <a href="/home">Home</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
