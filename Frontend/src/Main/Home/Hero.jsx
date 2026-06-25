import React from 'react'

const Hero = () => {
  return (
    <div>
      {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-glow-center" />
          <div className="hero-glow-right" />

          <div className="section-tag fade1">
            <span className="tag-dot orange" />
            AI-Powered Career Navigator
          </div>

          <h1 className="hero-heading fade2">
            Navigate your career<br />
            <span className="teal">with AI</span>
          </h1>

          <p className="hero-sub fade3">
            Find the right career path, internships, and global opportunities
            with personalized AI guidance built for students and freshers.
          </p>

          <div className="hero-btns fade4">
            <button className="cta-primary">Get Started →</button>
            <button className="cta-outline">Explore Opportunities</button>
          </div>

          <div className="hero-stats fade5">
            <div className="hero-stat">
              <div className="stat-num teal">12K+</div>
              <div className="stat-label">Students Guided</div>
            </div>
            <div className="stat-divider" />
            <div className="hero-stat">
              <div className="stat-num orange">800+</div>
              <div className="stat-label">Internships Listed</div>
            </div>
            <div className="stat-divider" />
            <div className="hero-stat">
              <div className="stat-num green">95%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </section>
    </div>
  )
}

export default Hero