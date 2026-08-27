import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '../Components/layout/PageLayout';
import GuidanceCore from '../Components/three/GuidanceCore';
import { Button, Card, Badge } from '../Components/ui';
import { fadeUp, staggerContainer, fadeIn, slideInLeft, slideInRight } from '../lib/motion';
import '../assets/Style/Home.css';

const features = [
  { icon: '🎯', title: 'AI Career Matching', desc: 'Get personalized career recommendations based on your skills, interests, and goals.' },
  { icon: '📊', title: 'Skills Intelligence', desc: 'Discover which skills to develop next with AI-powered market analysis.' },
  { icon: '🎓', title: 'Academic Guidance', desc: 'Navigate your educational journey with data-driven course and university suggestions.' },
  { icon: '💼', title: 'Opportunity Discovery', desc: 'Find internships, hackathons, and scholarships matched to your profile.' },
  { icon: '📈', title: 'Progress Tracking', desc: 'Monitor your growth with visual dashboards and achievement milestones.' },
  { icon: '🤖', title: 'AI Advisor', desc: 'Chat with your personal guidance AI that understands your unique journey.' },
];

const steps = [
  { num: '01', title: 'Create Your Profile', desc: 'Tell us about your education, skills, interests, and career aspirations.' },
  { num: '02', title: 'AI Analyzes', desc: 'Our AI processes your information against market data and academic trends.' },
  { num: '03', title: 'Get Guidance', desc: 'Receive personalized recommendations, matched opportunities, and clear next steps.' },
];

export default function Home() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="home-hero">
        <div className="ug-container home-hero-inner">
          <motion.div className="home-hero-text" variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0}>
              <Badge color="gold" size="sm">AI-POWERED STUDENT GUIDANCE</Badge>
            </motion.div>
            <motion.h1 className="home-hero-title" variants={fadeUp} custom={1}>
              Your future,<br /><span className="home-hero-highlight">better guided.</span>
            </motion.h1>
            <motion.p className="home-hero-desc" variants={fadeUp} custom={2}>
              Personalized academic, career, and opportunity guidance powered by artificial intelligence.
            </motion.p>
            <motion.div className="home-hero-actions" variants={fadeUp} custom={3}>
              <Link to="/guidance"><Button variant="primary" size="lg">Talk to UniGuide AI</Button></Link>
              <Link to="/about"><Button variant="secondary" size="lg">Explore UniGuide</Button></Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="home-hero-visual"
            variants={slideInRight}
            initial="hidden"
            animate="visible"
          >
            <GuidanceCore size={380} />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="ug-container">
          <motion.div className="home-section-header" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <motion.div variants={fadeUp} custom={0}>
              <Badge color="silver" size="sm">CAPABILITIES</Badge>
            </motion.div>
            <motion.h2 className="home-section-title" variants={fadeUp} custom={1}>Everything you need to navigate your future</motion.h2>
          </motion.div>
          <motion.div className="home-features-grid" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <Card className="home-feature-card" hover>
                  <span className="home-feature-icon">{f.icon}</span>
                  <h3 className="home-feature-title">{f.title}</h3>
                  <p className="home-feature-desc">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="home-steps">
        <div className="ug-container">
          <motion.div className="home-section-header" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <motion.div variants={fadeUp} custom={0}>
              <Badge color="gold" size="sm">HOW IT WORKS</Badge>
            </motion.div>
            <motion.h2 className="home-section-title" variants={fadeUp} custom={1}>Guided in three simple steps</motion.h2>
          </motion.div>
          <motion.div className="home-steps-grid" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
            {steps.map((s, i) => (
              <motion.div key={i} className="home-step" variants={fadeUp} custom={i}>
                <span className="home-step-num">{s.num}</span>
                <h3 className="home-step-title">{s.title}</h3>
                <p className="home-step-desc">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="ug-container">
          <motion.div className="home-cta-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <h2 className="home-cta-title">Ready to discover your path?</h2>
            <p className="home-cta-desc">Join thousands of students making informed decisions about their future.</p>
            <Link to="/"><Button variant="gold" size="lg">Get Started Free</Button></Link>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
