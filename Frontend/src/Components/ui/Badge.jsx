import React from 'react';
import './Badge.css';

const colorMap = {
  gold: 'ug-badge-gold',
  silver: 'ug-badge-silver',
  ai: 'ug-badge-ai',
  success: 'ug-badge-success',
  warning: 'ug-badge-warning',
  danger: 'ug-badge-danger',
  muted: 'ug-badge-muted',
};

const sizeMap = {
  sm: 'ug-badge-sm',
  md: '',
  lg: 'ug-badge-lg',
};

export default function Badge({ children, color = 'gold', size = 'md', dot = false, className = '' }) {
  return (
    <span className={`ug-badge ${colorMap[color] || ''} ${sizeMap[size] || ''} ${dot ? 'ug-badge-dot' : ''} ${className}`}>
      {dot && <span className="ug-badge-dot-indicator" />}
      {children}
    </span>
  );
}
