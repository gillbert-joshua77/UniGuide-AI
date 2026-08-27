import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '../Components/layout/PageLayout';
import GuidanceCore from '../Components/three/GuidanceCore';
import { Button, Card, Badge } from '../Components/ui';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/About.css';

const values = [
  { icon: '🎓', title: 'Academic Excellence', desc: 'We believe every student deserves guidance that understands the academic landscape.' },
  { icon: '🤝', title: 'Human-Centered AI', desc: 'Technology that amplifies human potential, not replaces personal judgment.' },
  { icon: '🔮', title: 'Future-Ready', desc: 'Preparing students not just for today, but for careers that will define tomorrow.' },
  { icon: '🌍', title: 'Inclusive Access', desc: 'Quality guidance should not be a privilege — it should be available to all students.' },
  { icon: '📊', title: 'Data-Driven', desc: 'Recommendations backed by real market data, academic research, and career trends.' },
  { icon: '🛡️', title: 'Trust & Privacy', desc: 'Your data is yours. We protect it with the highest standards of security.' },
];

const team = [
  { name: 'AI Engine', role: 'Guidance Intelligence', initial: 'AI' },
  { name: 'Market Data', role: 'Career Intelligence', initial: 'MD' },
  { name: 'Student First', role: 'Core Philosophy', initial: 'SF' },
];

export default function About() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="about-hero">
        <div className="ug-container about-hero-inner">
          <motion.div className="about-hero-text" variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0}>
              <Badge color="gold" size="sm">ABOUT UNIGUIDE</Badge>
            </motion.div>
            <motion.h1 className="about-hero-title" variants={fadeUp} custom={1}>
              Guiding the next generation<br />of <span className="about-hero-highlight">student success.</span>
            </motion.h1>
            <motion.p className="about-hero-desc" variants={fadeUp} custom={2}>
              UniGuide AI was built to solve a simple but profound problem: students have incredible potential but lack personalized guidance to unlock it.
            </motion.p>
          </motion.div>
          <motion.div className="about-hero-visual" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <GuidanceCore size={320} />
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="about-mission">
        <div className="ug-container">
          <div className="about-mission-grid">
            <motion.div className="about-mission-text" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
              <motion.div variants={fadeUp} custom={0}><Badge color="silver" size="sm">OUR MISSION</Badge></motion.div>
              <motion.h2 className="about-mission-title" variants={fadeUp} custom={1}>Make expert guidance accessible to every student</motion.h2>
              <motion.p className="about-mission-desc" variants={fadeUp} custom={2}>
                We combine artificial intelligence with deep academic and career knowledge to deliver personalized guidance that was previously only available through expensive consultants and advisors.
              </motion.p>
            </motion.div>
            <motion.div className="about-mission-cards" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
              {[
                { label: 'Founded', value: '2024' },
                { label: 'Students Served', value: '10,000+' },
                { label: 'AI Accuracy', value: '94%' },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} custom={i}>
                  <Card className="about-mission-stat" hover={false}>
                    <span className="about-mission-stat-value">{item.value}</span>
                    <span className="about-mission-stat-label">{item.label}</span>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-values">
        <div className="ug-container">
          <motion.div className="home-section-header" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <motion.div variants={fadeUp} custom={0}><Badge color="gold" size="sm">OUR VALUES</Badge></motion.div>
            <motion.h2 className="home-section-title" variants={fadeUp} custom={1}>What drives us</motion.h2>
          </motion.div>
          <motion.div className="about-values-grid" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
            {values.map((v, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <Card className="about-value-card" hover>
                  <span className="about-value-icon">{v.icon}</span>
                  <h3 className="about-value-title">{v.title}</h3>
                  <p className="about-value-desc">{v.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="about-team">
        <div className="ug-container">
          <motion.div className="home-section-header" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <motion.div variants={fadeUp} custom={0}><Badge color="silver" size="sm">POWERED BY</Badge></motion.div>
            <motion.h2 className="home-section-title" variants={fadeUp} custom={1}>The intelligence behind UniGuide</motion.h2>
          </motion.div>
          <motion.div className="about-team-grid" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
            {team.map((t, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <Card className="about-team-card" hover={false}>
                  <div className="about-team-avatar">{t.initial}</div>
                  <h3 className="about-team-name">{t.name}</h3>
                  <p className="about-team-role">{t.role}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="ug-container">
          <motion.div className="home-cta-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <h2 className="home-cta-title">Start your guided journey today</h2>
            <p className="home-cta-desc">Experience the future of student guidance.</p>
            <Link to="/"><Button variant="gold" size="lg">Get Started</Button></Link>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
