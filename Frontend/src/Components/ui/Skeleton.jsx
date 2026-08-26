import React from 'react';
import './Skeleton.css';

export default function Skeleton({ width, height, radius = 'md', className = '' }) {
  return (
    <div
      className={`ug-skeleton ug-skeleton-${radius} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`ug-skeleton-text ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="ug-skeleton-line" style={{ width: i === lines - 1 ? '60%' : '100%' }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`ug-skeleton-card ${className}`} aria-hidden="true">
      <Skeleton width="100%" height="160px" radius="md" />
      <div style={{ padding: '16px 0 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Skeleton width="70%" height="14px" />
        <Skeleton width="100%" height="10px" />
        <Skeleton width="40%" height="10px" />
      </div>
    </div>
  );
}
