import React from 'react'
import Navbar from '../Components/Navbar'
import '../assets/Style/Home.css'

const Home = () => {
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
                color: '#00b4d8', bg: 'rgba(0,180,216,0.1)',
                title: 'AI Career Guidance',
                desc: 'Personalized career suggestions based on your skills, interests, and goals.',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              },
              {
                color: '#f77f00', bg: 'rgba(247,127,0,0.1)',
                title: 'Internship Finder',
                desc: 'Browse and apply to the latest internship opportunities matched to your profile.',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              },
              {
                color: '#22c97a', bg: 'rgba(34,201,122,0.1)',
                title: 'Study Abroad Navigator',
                desc: 'Discover universities, scholarships, and global opportunities tailored for you.',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c97a" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
              },
              {
                color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',
                title: 'Skill Tracker',
                desc: 'Add, monitor, and grow your skills with AI-driven learning recommendations.',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              },
              {
                color: '#00b4d8', bg: 'rgba(0,180,216,0.1)',
                title: 'Resume Builder',
                desc: 'Build a professional resume with AI suggestions to stand out to recruiters.',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              },
              {
                color: '#f77f00', bg: 'rgba(247,127,0,0.1)',
                title: 'Smart Recommendations',
                desc: 'Get AI-curated job and internship suggestions based on your unique profile.',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f77f00" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
              },
            ].map((f, i) => (
              <div className="feat-card" key={i}>
                <div className="icon-wrap" style={{ background: f.bg }}>{f.icon}</div>
                <div className="feat-title">{f.title}</div>
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
              { num: '1', color: 'linear-gradient(135deg,#00b4d8,#0077b6)', ring: 'rgba(0,180,216,0.15)', title: 'Create your profile',       desc: 'Sign up and tell us about your background, education, and aspirations.' },
              { num: '2', color: 'linear-gradient(135deg,#f77f00,#e05a00)', ring: 'rgba(247,127,0,0.15)',   title: 'Add skills & interests',    desc: 'Track your skills, set career interests, and let AI understand your strengths.' },
              { num: '3', color: 'linear-gradient(135deg,#22c97a,#0f9e55)', ring: 'rgba(34,201,122,0.15)',  title: 'Get AI recommendations',   desc: 'Receive personalized career paths, internships, and opportunities instantly.' },
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

        {/* Dashboard Preview */}
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
              {[
                { name: 'Python',           pct: 85, color: 'linear-gradient(90deg,#00b4d8,#0077b6)' },
                { name: 'React',            pct: 72, color: 'linear-gradient(90deg,#00b4d8,#0077b6)' },
                { name: 'Machine Learning', pct: 60, color: 'linear-gradient(90deg,#f77f00,#e05a00)' },
              ].map(s => (
                <div className="skill-item" key={s.name}>
                  <div className="skill-meta">
                    <span>{s.name}</span><span>{s.pct}%</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                </div>
              ))}

              <div className="dash-sub-title" style={{ marginTop: '20px' }}>Suggested internships</div>
              {[
                { role: 'Software Engineer Intern', company: 'Google · Remote',    match: '95% match', mc: '#22c97a', mb: 'rgba(34,201,122,0.1)', mbo: 'rgba(34,201,122,0.2)' },
                { role: 'ML Research Intern',       company: 'Microsoft · Hybrid', match: '88% match', mc: '#00b4d8', mb: 'rgba(0,180,216,0.1)',   mbo: 'rgba(0,180,216,0.2)'  },
              ].map(a => (
                <div className="app-row" key={a.role}>
                  <div>
                    <div className="app-role">{a.role}</div>
                    <div className="app-company">{a.company}</div>
                  </div>
                  <span className="app-badge" style={{ color: a.mc, background: a.mb, border: `1px solid ${a.mbo}` }}>{a.match}</span>
                </div>
              ))}
            </div>

            <div className="dashboard-col">
              <div className="dash-sub-title">Recent applications</div>
              {[
                { role: 'Frontend Developer Intern', company: 'Zoho · Chennai',       status: 'Applied',   sc: '#00b4d8', sb: 'rgba(0,180,216,0.1)',   sbo: 'rgba(0,180,216,0.2)'   },
                { role: 'Data Analyst Intern',       company: 'Infosys · Bangalore',  status: 'Interview', sc: '#22c97a', sb: 'rgba(34,201,122,0.1)',  sbo: 'rgba(34,201,122,0.2)'  },
                { role: 'Backend Intern',            company: 'Razorpay · Remote',    status: 'Pending',   sc: '#f77f00', sb: 'rgba(247,127,0,0.1)',   sbo: 'rgba(247,127,0,0.2)'   },
              ].map(a => (
                <div className="app-row" key={a.role}>
                  <div>
                    <div className="app-role">{a.role}</div>
                    <div className="app-company">{a.company}</div>
                  </div>
                  <span className="app-badge" style={{ color: a.sc, background: a.sb, border: `1px solid ${a.sbo}` }}>{a.status}</span>
                </div>
              ))}

              <div className="profile-complete-card">
                <div className="dash-sub-title" style={{ marginBottom: '8px' }}>Profile completion</div>
                <div className="complete-bar-row">
                  <div className="complete-bar-bg">
                    <div className="complete-bar-fill" style={{ width: '78%' }} />
                  </div>
                  <span className="complete-pct">78%</span>
                </div>
                <div className="complete-hint">Add your resume to reach 100%</div>
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
            <h3 className="split-heading">Upcoming hackathons</h3>
            <div className="trend-list">
              {[
                { title: 'Smart India Hackathon', sub: 'Aug 15 · National',  color: '#f77f00', bg: 'rgba(247,127,0,0.1)'   },
                { title: 'HackWithInfy 2025',     sub: 'Sep 3 · Infosys',   color: '#00b4d8', bg: 'rgba(0,180,216,0.1)'   },
                { title: 'Google Solution Challenge', sub: 'Oct 1 · Global', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
              ].map(h => (
                <div className="trend-card" key={h.title}>
                  <div className="trend-icon" style={{ background: h.bg }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={h.color} strokeWidth="1.8" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  </div>
                  <div>
                    <div className="trend-title">{h.title}</div>
                    <div className="trend-sub">{h.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="split-col">
            <div className="section-tag" style={{ display: 'inline-flex' }}>
              <span className="tag-dot green-dot" />Top skills in demand
            </div>
            <h3 className="split-heading">What employers want</h3>
            <div className="skill-demand-list">
              {[
                { name: 'Generative AI / LLMs',      growth: '+42%' },
                { name: 'Full-stack Development',    growth: '+28%' },
                { name: 'Cloud & DevOps',            growth: '+35%' },
                { name: 'Data Science & Analytics',  growth: '+31%' },
              ].map(s => (
                <div className="skill-demand-row" key={s.name}>
                  <span className="skill-demand-name">{s.name}</span>
                  <span className="skill-demand-badge">{s.growth}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="testimonials-section">
          <div className="section-center-head">
            <div className="section-tag" style={{ display: 'inline-flex' }}>
              <span className="tag-dot teal-dot" />Testimonials
            </div>
            <h2 className="section-heading">What students say</h2>
          </div>
          <div className="testimonials-grid">
            {[
              { text: '"UniGuide AI helped me find my first internship at a top MNC. The AI suggestions were spot on and saved me weeks of searching!"', name: 'Arjun Ravi',    role: 'CS Student, VIT',  initials: 'AR', color: 'linear-gradient(135deg,#00b4d8,#0077b6)' },
              { text: '"Best AI tool for career clarity. I had no idea what path to take and UniGuide gave me a complete roadmap. Highly recommend!"',  name: 'Priya Krishnan', role: 'ECE Student, SRM',  initials: 'PK', color: 'linear-gradient(135deg,#f77f00,#e05a00)' },
              { text: '"The study abroad navigator helped me shortlist universities and apply for scholarships. Got into my dream uni in Canada!"',        name: 'Sneha Menon',   role: 'IT Student, PSG',   initials: 'SM', color: 'linear-gradient(135deg,#22c97a,#0f9e55)' },
            ].map(t => (
              <div className="testimonial-card" key={t.name}>
                <div className="stars">★★★★★</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="author-avatar" style={{ background: t.color }}>{t.initials}</div>
                  <div>
                    <div className="author-name">{t.name}</div>
                    <div className="author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="cta-section">
          <div className="cta-glow" />
          <div className="section-tag" style={{ display: 'inline-flex', marginBottom: '20px' }}>
            <span className="tag-dot orange" />Get started today
          </div>
          <h2 className="cta-heading">
            Start your journey with<br />
            <span className="teal">UniGuide AI</span>
          </h2>
          <p className="cta-sub">Join 12,000+ students already navigating their future with AI.</p>
          <div className="hero-btns">
            <button className="cta-primary large">Join Now — It's Free</button>
            <button className="cta-outline large">See How It Works</button>
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