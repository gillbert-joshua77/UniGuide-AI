import React from 'react';
import './Input.css';

export default function Input({ icon, label, error, className = '', ...props }) {
  return (
    <div className={`ug-input-group ${error ? 'ug-input-error' : ''} ${className}`}>
      {label && <label className="ug-input-label">{label}</label>}
      <div className="ug-input-wrapper">
        {icon && <span className="ug-input-icon">{icon}</span>}
        <input className={`ug-input ${icon ? 'ug-input-with-icon' : ''}`} {...props} />
      </div>
      {error && <span className="ug-input-error-text">{error}</span>}
    </div>
  );
}

export function Textarea({ icon, label, error, className = '', ...props }) {
  return (
    <div className={`ug-input-group ${error ? 'ug-input-error' : ''} ${className}`}>
      {label && <label className="ug-input-label">{label}</label>}
      <div className="ug-input-wrapper">
        {icon && <span className="ug-input-icon">{icon}</span>}
        <textarea className={`ug-textarea ${icon ? 'ug-input-with-icon' : ''}`} {...props} />
      </div>
      {error && <span className="ug-input-error-text">{error}</span>}
    </div>
  );
}
