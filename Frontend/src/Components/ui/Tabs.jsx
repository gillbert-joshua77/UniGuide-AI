import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Tabs.css';

export default function Tabs({ tabs, activeTab, onTabChange, className = '' }) {
  const [active, setActive] = useState(activeTab || tabs[0]?.id);
  const current = activeTab ?? active;

  const handleChange = (id) => {
    setActive(id);
    onTabChange?.(id);
  };

  return (
    <div className={`ug-tabs ${className}`} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={current === tab.id}
          className={`ug-tab ${current === tab.id ? 'ug-tab-active' : ''}`}
          onClick={() => handleChange(tab.id)}
        >
          {tab.icon && <span className="ug-tab-icon">{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && <span className="ug-tab-count">{tab.count}</span>}
          {current === tab.id && (
            <motion.div className="ug-tab-indicator" layoutId="ug-tab-indicator" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
          )}
        </button>
      ))}
    </div>
  );
}
