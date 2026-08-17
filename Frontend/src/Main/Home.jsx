import React, { useState, useEffect } from 'react'
import Navbar from '../Components/Navbar'
import axiosInstance from '../Utils/axiosInstance'
import '../assets/Style/Home.css'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await axiosInstance.get("/students/me/");
        setData(res.data);
      } catch (err) {
        console.error("Home data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const calculateCompletion = () => {
    if (!data) return 0;
    let score = 40;
    if (data.skills?.length > 0) score += 30;
    if (data.applications?.length > 0) score += 30;
    return score > 100 ? 100 : score;
  };

  const handlechat = () => {
    navigate("/ai");
  };

  return (
    <>
      <Navbar />
      <div className="home-wrapper">

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
            <button onClick={handlechat} className="cta-primary">Get Started →</button>
            <button className="cta-outline">Explore Features</button>
          </div>

          <div className="hero-stats fade5">
            <div className="hero-stat">
              <div className="stat-num teal">AI Chat</div>
              <div className="stat-label">24/7 Guidance</div>
            </div>
            <div className="stat-divider" />
            <div className="hero-stat">
              <div className="stat-num orange">Skill</div>
              <div className="stat-label">Tracking & Growth</div>
            </div>
            <div className="stat-divider" />
            <div className="hero-stat">
              <div className="stat-num green">Profile</div>
              <div className="stat-label">Personalized Insights</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="section-center-head">
            <div className="section-tag" style={{ display: 'inline-flex' }}>
              <span className="tag-dot teal-dot" />Features
            </div>
            <h2 className="section-heading">Everything you need to succeed</h2>
            <p className="section-sub">Powered by AI, built for students</p>
          </div>

          <div className="features-grid">
            {[
              {
                color: '#00b4d8', bg: 'var(--color-primary-soft)',
                title: 'UniGuide AI Chat',
                desc: 'Have real-time conversations with AI to get personalized career guidance, internship tips, and study abroad advice.',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              },
              {
                color: '#f77f00', bg: 'var(--color-secondary-soft)',
                title: 'Internship Finder',
                desc: 'Browse and apply to the latest internship opportunities matched to your profile.',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
                comingSoon: true
              },
              {
                color: '#22c97a', bg: 'var(--color-success-soft)',
                title: 'Study Abroad Navigator',
                desc: 'Discover universities, scholarships, and global opportunities tailored for you.',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c97a" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
                comingSoon: true
              },
              {
                color: '#a78bfa', bg: 'var(--color-tertiary)',
                title: 'Skill Tracker',
                desc: 'Add, monitor, and grow your skills with percentage-based progress tracking.',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              },
              {
                color: '#00b4d8', bg: 'var(--color-primary-soft)',
                title: 'Resume Builder',
                desc: 'Build a professional resume with AI suggestions to stand out to recruiters.',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
                comingSoon: true
              },
              {
                color: '#f77f00', bg: 'var(--color-secondary-soft)',
                title: 'Smart Recommendations',
                desc: 'Get AI-curated job and internship suggestions based on your unique profile.',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
                comingSoon: true
              },
            ].map((f, i) => (
              <div className="feat-card" key={i}>
                <div className="icon-wrap" style={{ background: f.bg }}>{f.icon}</div>
                <div className="feat-title">
                  {f.title}
                  {f.comingSoon && <span className="coming-soon-badge">Coming Soon</span>}
                </div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="how-section">
          <div className="section-center-head">
            <div className="section-tag" style={{ display: 'inline-flex' }}>
              <span className="tag-dot green-dot" />How it works
            </div>
            <h2 className="section-heading">Three steps to your dream career</h2>
            <p className="section-sub">Simple, fast, and AI-powered</p>
          </div>

          <div className="steps-grid">
            {[
              { num: '1', color: 'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))', ring: 'var(--color-primary-glow)', title: 'Create your profile', desc: 'Sign up and complete your student profile with education, interests, and career goals.' },
              { num: '2', color: 'linear-gradient(135deg,var(--color-secondary),var(--color-secondary-dark))', ring: 'var(--color-secondary-soft)', title: 'Add skills & interests', desc: 'Track your skills with progress percentages and set your career interests.' },
              { num: '3', color: 'linear-gradient(135deg,var(--color-success),var(--color-success-dark))', ring: 'var(--color-success-soft)', title: 'Get AI guidance', desc: 'Chat with UniGuide AI for personalized career paths, internship advice, and study abroad guidance.' },
            ].map((s, i) => (
              <div className="step-item" key={i}>
                <div className="step-num-wrap">
                  <div className="step-ring" style={{ background: s.ring }} />
                  <div className="step-num" style={{ background: s.color }}>{s.num}</div>
                </div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="dashboard-section">
          <div className="section-center-head">
            <div className="section-tag" style={{ display: 'inline-flex' }}>
              <span className="tag-dot purple-dot" />Dashboard preview
            </div>
            <h2 className="section-heading">Your personalized dashboard</h2>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-col">
              <div className="dash-sub-title">Skills overview</div>
              {data?.skills?.length > 0 ? (
                data.skills.map((s, i) => (
                  <div className="skill-item" key={i}>
                    <div className="skill-meta">
                      <span>{s.name}</span><span>{s.percentage}%</span>
                    </div>
                    <div className="skill-bar">
                      <div className="skill-fill" style={{ width: `${s.percentage}%`, background: s.color || 'linear-gradient(90deg,var(--color-primary),var(--color-primary-dark))' }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No skills added yet. Add skills from your profile to track your progress.</p>
                </div>
              )}

              <div className="dash-sub-title" style={{ marginTop: '20px' }}>Profile info</div>
              {data?.full_name ? (
                <div className="profile-info-list">
                  <div className="profile-info-row">
                    <span className="profile-info-label">Name</span>
                    <span className="profile-info-value">{data.full_name}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Email</span>
                    <span className="profile-info-value">{data.email}</span>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>Complete your profile to see your information here.</p>
                </div>
              )}
            </div>

            <div className="dashboard-col">
              <div className="dash-sub-title">Recent applications</div>
              {data?.applications?.length > 0 ? (
                data.applications.map((app, i) => (
                  <div className="app-row" key={i}>
                    <div>
                      <div className="app-role">{app.role}</div>
                      <div className="app-company">{app.company}</div>
                    </div>
                    <span className="app-badge" style={{
                      color: app.status === 'Applied' ? 'var(--color-primary)' : app.status === 'Interview' ? 'var(--color-success)' : 'var(--color-secondary)',
                      background: 'var(--opacity-hover)',
                      border: '1px solid var(--opacity-hover-text)'
                    }}>{app.status}</span>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No applications yet. Track your applications from your profile.</p>
                </div>
              )}

              <div className="profile-complete-card">
                <div className="dash-sub-title" style={{ marginBottom: '8px' }}>Profile completion</div>
                <div className="complete-bar-row">
                  <div className="complete-bar-bg">
                    <div className="complete-bar-fill" style={{ width: `${calculateCompletion()}%` }} />
                  </div>
                  <span className="complete-pct">{calculateCompletion()}%</span>
                </div>
                <div className="complete-hint">Add skills and applications to increase your completion</div>
              </div>
            </div>
          </div>
        </section>

        {/* Hackathons + Skills */}
        <section className="split-section">
          <div className="split-col">
            <div className="section-tag" style={{ display: 'inline-flex' }}>
              <span className="tag-dot orange" />Hackathons & events
            </div>
            <h3 className="split-heading">Hackathon Hub</h3>
            <div className="coming-soon-block">
              <div className="coming-soon-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div className="coming-soon-title">Hackathon Hub Coming Soon</div>
              <p className="coming-soon-desc">
                Discover and register for hackathons matched to your skills.
                Use the AI Chat guided mode to get personalized hackathon recommendations now.
              </p>
            </div>
          </div>

          <div className="split-col">
            <div className="section-tag" style={{ display: 'inline-flex' }}>
              <span className="tag-dot green-dot" />Popular skills
            </div>
            <h3 className="split-heading">Trending in tech</h3>
            <p className="section-sub" style={{ marginBottom: '16px' }}>Illustrative insights based on industry trends</p>
            <div className="skill-demand-list">
              {[
                { name: 'Generative AI / LLMs',      growth: 'High Demand' },
                { name: 'Full-stack Development',    growth: 'High Demand' },
                { name: 'Cloud & DevOps',            growth: 'High Demand' },
                { name: 'Data Science & Analytics',  growth: 'High Demand' },
              ].map(s => (
                <div className="skill-demand-row" key={s.name}>
                  <span className="skill-demand-name">{s.name}</span>
                  <span className="skill-demand-badge">{s.growth}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="home-footer">
          <div className="footer-brand">UniGuide <span>AI</span></div>
          <div className="footer-copy">© 2025 UniGuide AI. All rights reserved.</div>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
          </div>
        </footer>

      </div>
    </>
  )
}

export default Home
