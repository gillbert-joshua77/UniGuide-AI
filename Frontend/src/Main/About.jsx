import React from 'react'
import Navbar from '../Components/Navbar'
import '../assets/Style/About.css'
import { useNavigate } from 'react-router-dom'

const About = () => {
  const navigate = useNavigate();

  const handlechat = () => {
    navigate("/ai");
  };
  return (
    <>
      <Navbar />
      <div className="about-wrapper">

        {/* Hero */}
        <section className="about-hero">
          <div className="about-hero-glow-center" />
          <div className="about-hero-glow-right" />

          <div className="section-tag fade1" style={{ display: 'inline-flex' }}>
            <span className="tag-dot orange-dot" />Our story
          </div>
          <h1 className="about-hero-heading fade2">
            About <span className="teal">UniGuide AI</span>
          </h1>
          <p className="about-hero-sub fade3">
            An intelligent student guidance platform designed to help students
            make better decisions about education, careers, skills, and
            opportunities using AI.
          </p>
          <div className="hero-btns fade3">
            <button onClick={handlechat} className="cta-primary">Get Started →</button>
            <button className="cta-outline">Explore Features</button>
          </div>

          <div className="about-stats fade3">
            <div className="about-stat-box">
              <div className="about-stat-num teal">AI Chat</div>
              <div className="about-stat-label">Real-Time Guidance</div>
            </div>
            <div className="about-stat-box">
              <div className="about-stat-num orange">Profile</div>
              <div className="about-stat-label">Student Dashboard</div>
            </div>
            <div className="about-stat-box">
              <div className="about-stat-num green">Skills</div>
              <div className="about-stat-label">Progress Tracking</div>
            </div>
            <div className="about-stat-box">
              <div className="about-stat-num purple">Free</div>
              <div className="about-stat-label">For All Students</div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="about-mission-section">
          <div className="mission-grid">
            <div className="mission-left">
              <div className="section-tag" style={{ display: 'inline-flex' }}>
                <span className="tag-dot teal-dot" />Our mission
              </div>
              <h2 className="mission-heading">
                Empowering students with AI-driven career insights
              </h2>
              <p className="mission-para">
                Students often struggle to choose the right courses, careers,
                and opportunities in today&apos;s fast-changing world. UniGuide AI
                solves this by providing personalized guidance using your profile
                information and AI-powered conversations.
              </p>
              <p className="mission-para">
                We believe every student deserves a clear roadmap — not generic
                advice. Our AI understands your unique background, skills, and
                aspirations to deliver guidance that truly fits you.
              </p>
            </div>

            <div className="mission-right">
              {[
                {
                  color: '#00b4d8', bg: 'var(--color-primary-soft)',
                  title: 'Personalized guidance',
                  desc: 'AI-tailored advice based on your unique skills and goals — not one-size-fits-all.',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                },
                {
                  color: '#f77f00', bg: 'var(--color-secondary-soft)',
                  title: 'Guided AI conversations',
                  desc: 'Interactive guided question flows for internships, hackathons, and study abroad planning.',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                },
                {
                  color: '#22c97a', bg: 'var(--color-success-soft)',
                  title: 'Built by students',
                  desc: 'Created by students who understand the challenges of career planning firsthand.',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c97a" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                },
              ].map(v => (
                <div className="val-item" key={v.title}>
                  <div className="icon-box" style={{ background: v.bg }}>{v.icon}</div>
                  <div>
                    <div className="val-title">{v.title}</div>
                    <div className="val-desc">{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="about-features-section">
          <div className="section-center-head">
            <div className="section-tag" style={{ display: 'inline-flex' }}>
              <span className="tag-dot purple-dot" />What we do
            </div>
            <h2 className="section-heading">UniGuide AI acts as your smart assistant</h2>
            <p className="section-sub">Everything you need, in one place</p>
          </div>

          <div className="about-features-grid">
            {[
              { color: '#00b4d8', bg: 'var(--color-primary-soft)',  title: 'AI Career Guidance',            desc: 'Chat with AI to get personalized career suggestions based on your skills, interests, and goals.',         icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
              { color: '#f77f00', bg: 'var(--color-secondary-soft)',  title: 'Internship Guidance',          desc: 'Get AI-powered internship recommendations through guided conversations tailored to your profile.',          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>, comingSoon: true },
              { color: '#22c97a', bg: 'var(--color-success-soft)', title: 'Study Abroad Guidance',        desc: 'Get AI-guided advice on universities, scholarships, and study abroad options tailored to you.',             icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c97a" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>, comingSoon: true },
              { color: '#a78bfa', bg: 'var(--color-tertiary)',title: 'Skill Development Tracker',    desc: 'Add and monitor your skills with progress percentages to track your growth over time.',                   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
              { color: '#00b4d8', bg: 'var(--color-primary-soft)',  title: 'Resume Builder',               desc: 'Build a strong professional resume with AI-powered suggestions.',                                            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>, comingSoon: true },
              { color: '#f77f00', bg: 'var(--color-secondary-soft)',  title: 'IT Market News',               desc: 'Stay updated with the latest tech, AI, cybersecurity, and startup news curated for students.',             icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/></svg> },
            ].map(f => (
              <div className="about-feat-card" key={f.title}>
                <div className="icon-box" style={{ background: f.bg }}>{f.icon}</div>
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
        <section className="about-how-section">
          <div className="section-center-head">
            <div className="section-tag" style={{ display: 'inline-flex' }}>
              <span className="tag-dot green-dot" />How it works
            </div>
            <h2 className="section-heading">Three simple steps</h2>
            <p className="section-sub">Get started in minutes</p>
          </div>
          <div className="steps-grid">
            {[
              { num: '1', color: 'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))', ring: 'var(--color-primary-glow)', delay: '0s',   title: 'Create your profile', desc: 'Sign up and complete your student profile with education, interests, and career goals.' },
              { num: '2', color: 'linear-gradient(135deg,var(--color-secondary),var(--color-secondary-dark))', ring: 'var(--color-secondary-soft)',  delay: '0.5s', title: 'Add skills & interests', desc: 'Track your skills with progress percentages and set your career interests.' },
              { num: '3', color: 'linear-gradient(135deg,var(--color-success),var(--color-success-dark))', ring: 'var(--color-success-soft)', delay: '1s',   title: 'Get AI guidance', desc: 'Chat with UniGuide AI for personalized career paths, internship advice, and study abroad guidance.' },
            ].map(s => (
              <div className="step-item" key={s.num}>
                <div className="step-num-wrap">
                  <div className="step-ring" style={{ background: s.ring, animationDelay: s.delay }} />
                  <div className="step-num" style={{ background: s.color }}>{s.num}</div>
                </div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Why UniGuide */}
        <section className="about-why-section">
          <div className="section-center-head">
            <div className="section-tag" style={{ display: 'inline-flex' }}>
              <span className="tag-dot orange-dot" />Why choose us
            </div>
            <h2 className="section-heading">Why UniGuide AI?</h2>
            <p className="section-sub">What makes us different</p>
          </div>
          <div className="why-grid">
            {[
              { emoji: '🎯', title: 'Personalized',   border: 'var(--color-primary-glow)',   desc: 'Not generic advice — guidance built around your profile and skills.'                    },
              { emoji: '⚡', title: 'Easy to Use',    border: 'var(--color-secondary-soft)',   desc: 'Student-friendly interface designed for simplicity.'                },
              { emoji: '🌐', title: 'All-in-One',     border: 'var(--color-success-soft)',  desc: 'Career guidance, skill tracking, and news — one platform.'      },
              { emoji: '🤖', title: 'AI Powered',     border: 'var(--color-tertiary)', desc: 'Powered by Google Gemini for smarter, faster decisions.'                     },
              { emoji: '🔒', title: 'Secure & Private',border: 'var(--color-primary-glow)', desc: 'Your data is safe and never shared with third parties.'             },
              { emoji: '📈', title: 'Track Growth',   border: 'var(--color-secondary-soft)',   desc: 'Monitor your skill progress and celebrate every milestone.'               },
            ].map(w => (
              <div className="why-card" key={w.title} style={{ border: `1px solid ${w.border}` }}>
                <div className="why-emoji">{w.emoji}</div>
                <div className="why-title">{w.title}</div>
                <div className="why-desc">{w.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="about-team-section">
          <div className="section-center-head">
            <div className="section-tag" style={{ display: 'inline-flex' }}>
              <span className="tag-dot teal-dot" />The team
            </div>
            <h2 className="section-heading">Built by students, for students</h2>
            <p className="section-sub" style={{ maxWidth: '500px', margin: '0 auto' }}>
              UniGuide AI is developed by a passionate team of students solving
              real-world problems in career planning and internship search.
            </p>
          </div>
          <div className="team-grid">
            {[
              { initials: 'GJ', name: 'Gillbert Joshua MJ', role: 'AI / Full Stack Developer', desc: 'AI-focused developer working on the UniGuide AI project, with interests in AI research, machine learning, and full-stack development.', color: 'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))' },
            ].map(t => (
              <div className="team-card" key={t.name}>
                <div className="team-avatar" style={{ background: t.color }}>{t.initials}</div>
                <div className="team-name">{t.name}</div>
                <div className="team-role">{t.role}</div>
                <div className="team-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="about-footer">
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

export default About
