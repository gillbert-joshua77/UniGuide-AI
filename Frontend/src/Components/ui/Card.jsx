import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

export default function Card({ children, className = '', hover = true, ...props }) {
  return (
    <motion.div
      className={`ug-card ${hover ? 'ug-card-hover' : ''} ${className}`}
      initial="rest"
      whileHover={hover ? 'hover' : undefined}
      variants={{
        rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
        hover: { y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
      }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
