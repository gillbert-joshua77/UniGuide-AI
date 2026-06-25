import React from 'react'
import Navbar from '../Components/Navbar'
import '../assets/Style/About.css'
import { useNavigate } from 'react-router-dom'

const About = () => {
  // ✅ 1. Initialize the hook here (at the top level)
  const navigate = useNavigate();

  // ✅ 2. Use the "navigate" function inside your event handler
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
            An intelligent career and internship navigation platform designed
            to guide students toward the right opportunities using the power
            of Artificial Intelligence.
          </p>
          <div className="hero-btns fade3">
            <button onClick={handlechat} className="cta-primary">Get Started →</button>
            <button className="cta-outline">Explore Features</button>
          </div>

          <div className="about-stats fade3">
            <div className="about-stat-box">
              <div className="about-stat-num teal">12K+</div>
              <div className="about-stat-label">Students Guided</div>
            </div>
            <div className="about-stat-box">
              <div className="about-stat-num orange">800+</div>
              <div className="about-stat-label">Internships Listed</div>
            </div>
            <div className="about-stat-box">
              <div className="about-stat-num green">95%</div>
              <div className="about-stat-label">Success Rate</div>
            </div>
            <div className="about-stat-box">
              <div className="about-stat-num purple">50+</div>
              <div className="about-stat-label">Partner Companies</div>
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
                In today's fast-changing world, students often feel confused about
                choosing the right career path, finding internships, or preparing
                for global opportunities. UniGuide AI solves this by providing
                personalized, data-driven guidance tailored to each student.
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
                  color: '#00b4d8', bg: 'rgba(0,180,216,0.1)',
                  title: 'Personalized guidance',
                  desc: 'AI-tailored advice based on your unique skills and goals — not one-size-fits-all.',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                },
                {
                  color: '#f77f00', bg: 'rgba(247,127,0,0.1)',
                  title: 'Real-time opportunities',
                  desc: 'Always up-to-date internships, hackathons, and career openings matched to your profile.',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                },
                {
                  color: '#22c97a', bg: 'rgba(34,201,122,0.1)',
                  title: 'Student-first community',
                  desc: 'Built by students for students — we understand your challenges from the inside.',
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
              { color: '#00b4d8', bg: 'rgba(0,180,216,0.1)',  title: 'Career Path Suggestions',   desc: 'Suggests career paths based on your interests, skills, and academic background.',         icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
              { color: '#f77f00', bg: 'rgba(247,127,0,0.1)',  title: 'Internship Recommendations', desc: 'Recommends real-world internship opportunities matched to your profile.',                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg> },
              { color: '#22c97a', bg: 'rgba(34,201,122,0.1)', title: 'Study Abroad Explorer',      desc: 'Helps students explore global universities, scholarships, and study abroad options.',      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c97a" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
              { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',title: 'Skill Development Tracker',  desc: 'Tracks your skill growth and suggests learning resources to close the gap.',               icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
              { color: '#00b4d8', bg: 'rgba(0,180,216,0.1)',  title: 'Resume & Profile Builder',   desc: 'Builds a strong professional profile with AI-powered resume suggestions.',                 icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg> },
              { color: '#f77f00', bg: 'rgba(247,127,0,0.1)',  title: 'AI Smart Recommendations',  desc: 'Curates personalized job, internship, and course suggestions using AI.',                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/></svg> },
            ].map(f => (
              <div className="about-feat-card" key={f.title}>
                <div className="icon-box" style={{ background: f.bg }}>{f.icon}</div>
                <div className="feat-title">{f.title}</div>
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
              { num: '1', color: 'linear-gradient(135deg,#00b4d8,#0077b6)', ring: 'rgba(0,180,216,0.15)', delay: '0s',   title: 'Create your profile',    desc: 'Sign up and tell us about your background, education, and aspirations.' },
              { num: '2', color: 'linear-gradient(135deg,#f77f00,#e05a00)', ring: 'rgba(247,127,0,0.15)',  delay: '0.5s', title: 'Add skills & interests',  desc: 'Track your skills, set career interests, and let AI understand your strengths.' },
              { num: '3', color: 'linear-gradient(135deg,#22c97a,#0f9e55)', ring: 'rgba(34,201,122,0.15)', delay: '1s',   title: 'Get AI recommendations', desc: 'Receive personalized career paths, internships, and opportunities instantly.' },
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
              { emoji: '🎯', title: 'Personalized',   border: 'rgba(0,180,216,0.15)',   desc: 'Not generic advice — guidance built around you.'                    },
              { emoji: '⚡', title: 'Easy to Use',    border: 'rgba(247,127,0,0.15)',   desc: 'Student-friendly interface designed for simplicity.'                },
              { emoji: '🌐', title: 'All-in-One',     border: 'rgba(34,201,122,0.15)',  desc: 'Career, internships, skills, and study abroad — one platform.'      },
              { emoji: '🤖', title: 'AI Powered',     border: 'rgba(167,139,250,0.15)', desc: 'Cutting-edge AI for smarter, faster decisions.'                     },
              { emoji: '🔒', title: 'Secure & Private',border: 'rgba(0,180,216,0.15)', desc: 'Your data is safe and never shared with third parties.'             },
              { emoji: '📈', title: 'Track Growth',   border: 'rgba(247,127,0,0.15)',   desc: 'Monitor your progress and celebrate every milestone.'               },
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
              { initials: 'GR', name: 'Gillbert Raj',  role: 'Full Stack Developer', desc: 'Lead developer & AI integration',    color: 'linear-gradient(135deg,#00b4d8,#0077b6)' },
              { initials: 'UI', name: 'UI Designer',   role: 'Design Lead',          desc: 'User experience & interface design', color: 'linear-gradient(135deg,#f77f00,#e05a00)' },
              { initials: 'BE', name: 'Backend Dev',   role: 'API & Database',       desc: 'Django REST & database architecture',color: 'linear-gradient(135deg,#22c97a,#0f9e55)' },
              { initials: 'AI', name: 'AI Engineer',   role: 'ML & Recommendations', desc: 'Machine learning model development', color: 'linear-gradient(135deg,#a78bfa,#7c3aed)' },
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