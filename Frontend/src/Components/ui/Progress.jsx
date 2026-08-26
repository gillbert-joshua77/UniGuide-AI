import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import './Progress.css';

export default function Progress({ value = 0, label, showValue = true, color = 'gold', size = 'md', className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div ref={ref} className={`ug-progress ${size === 'sm' ? 'ug-progress-sm' : ''} ${className}`}>
      {(label || showValue) && (
        <div className="ug-progress-header">
          {label && <span className="ug-progress-label">{label}</span>}
          {showValue && <span className="ug-progress-value">{clamped}%</span>}
        </div>
      )}
      <div className="ug-progress-track">
        <motion.div
          className={`ug-progress-fill ug-progress-fill-${color}`}
          initial={{ width: 0 }}
          animate={inView ? { width: `${clamped}%` } : { width: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />
      </div>
    </div>
  );
}
