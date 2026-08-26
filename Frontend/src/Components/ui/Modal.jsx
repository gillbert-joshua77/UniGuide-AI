import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, className = '' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="ug-modal-overlay" onClick={onClose}>
          <motion.div
            className={`ug-modal ${className}`}
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.2 } }}
          >
            {title && (
              <div className="ug-modal-header">
                <h3 className="ug-modal-title">{title}</h3>
                <button className="ug-modal-close" onClick={onClose} aria-label="Close">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
            <div className="ug-modal-body">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
