import React, { useEffect } from 'react';
import Logo from '../assets/Image/UniGuide 1.png';
import '../assets/Style/Maintenance.css';

const DESCRIPTION =
  'UniGuide AI is temporarily unavailable for scheduled maintenance. Please check back soon.';

const Maintenance = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'UniGuide AI — Scheduled Maintenance';

    let descriptionMeta = document.querySelector('meta[name="description"]');
    const createdDescription = !descriptionMeta;
    const previousDescription = descriptionMeta?.getAttribute('content');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.setAttribute('name', 'description');
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.setAttribute('content', DESCRIPTION);

    return () => {
      document.title = previousTitle;
      if (createdDescription) {
        descriptionMeta.remove();
      } else if (previousDescription !== null) {
        descriptionMeta.setAttribute('content', previousDescription);
      }
    };
  }, []);

  return (
    <main className="ug-maintenance" role="main" aria-labelledby="maintenance-title">
      <div className="ug-maintenance-card">
        <div className="ug-maintenance-brand">
          <img src={Logo} alt="UniGuide AI" className="ug-maintenance-logo" />
          <span className="ug-maintenance-brand-name">
            UniGuide <span>AI</span>
          </span>
        </div>

        <div className="ug-maintenance-icon" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>

        <h1 id="maintenance-title" className="ug-maintenance-title">
          We&rsquo;ll be back soon!
        </h1>

        <p className="ug-maintenance-text">
          UniGuide AI is temporarily down for scheduled maintenance while we
          make things better for you.
        </p>
        <p className="ug-maintenance-note">
          Please check back later — we appreciate your patience.
        </p>

        <div className="ug-maintenance-divider" />

        <p className="ug-maintenance-footer">
          &copy; {new Date().getFullYear()} UniGuide AI. All rights reserved.
        </p>
      </div>
    </main>
  );
};

export default Maintenance;
