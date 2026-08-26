import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './Tooltip.css';

export default function Tooltip({ children, content, position = 'top' }) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef(null);

  const open = () => { clearTimeout(timeoutRef.current); setShow(true); };
  const close = () => { timeoutRef.current = setTimeout(() => setShow(false), 100); };

  return (
    <div className="ug-tooltip-wrapper" onMouseEnter={open} onMouseLeave={close} onFocus={open} onBlur={close}>
      {children}
      <AnimatePresence>
        {show && content && (
          <motion.div
            className={`ug-tooltip ug-tooltip-${position}`}
            initial={{ opacity: 0, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0, x: position === 'left' ? 4 : position === 'right' ? -4 : 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
