import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  primary: 'ug-btn-primary',
  secondary: 'ug-btn-secondary',
  ghost: 'ug-btn-ghost',
  outline: 'ug-btn-outline',
  gold: 'ug-btn-gold',
};

const sizes = {
  sm: 'ug-btn-sm',
  md: '',
  lg: 'ug-btn-lg',
};

export default function Button({ children, variant = 'primary', size = 'md', className = '', disabled, ...props }) {
  return (
    <motion.button
      className={`ug-btn ${variants[variant] || ''} ${sizes[size] || ''} ${className}`}
      whileHover={disabled ? {} : { y: -1 }}
      whileTap={disabled ? {} : { scale: 0.985 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
