import React from 'react';
import './Avatar.css';

const sizes = {
  xs: 'ug-avatar-xs',
  sm: 'ug-avatar-sm',
  md: 'ug-avatar-md',
  lg: 'ug-avatar-lg',
  xl: 'ug-avatar-xl',
};

export default function Avatar({ src, name, size = 'md', gold = false, className = '' }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  return (
    <div className={`ug-avatar ${sizes[size] || ''} ${gold ? 'ug-avatar-gold' : ''} ${className}`}>
      {src ? <img src={src} alt={name || 'Avatar'} /> : <span>{initials}</span>}
    </div>
  );
}
