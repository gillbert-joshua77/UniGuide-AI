import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../Utils/axiosInstance';
import PageLayout from '../Components/layout/PageLayout';
import { Button, Card, Badge, Avatar, Progress, Tabs, Modal, Input } from '../Components/ui';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/Profile.css';

const skillColors = ['gold', 'ai', 'success', 'silver'];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [skills, setSkills] = useState([]);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate', color: '#D4AF67' });
  const [loading, setLoading] = useState(true);

  const userName = localStorage.getItem('uniguide_user_name') || 'Student';
  const userEmail = localStorage.getItem('uniguide_user_email') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, skillsRes] = await Promise.all([
          axiosInstance.get('/students/me/').catch(() => ({ data: {} })),
          axiosInstance.get('/students/skills/').catch(() => ({ data: [] })),
        ]);
        setUser(profileRes.data);
        setSkills(Array.isArray(skillsRes.data) ? skillsRes.data : skillsRes.data?.results || []);
      } catch { /* fallback */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) return;
    try {
      const res = await axiosInstance.post('/students/skills/', newSkill);
      setSkills(prev => [...prev, res.data]);
      setNewSkill({ name: '', level: 'Intermediate', color: '#D4AF67' });
      setShowAddSkill(false);
    } catch { /* silent */ }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'skills', label: 'Skills', count: skills.length },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <PageLayout>
      {/* Banner */}
      <div className="profile-banner">
        <div className="ug-container">
          <div className="profile-banner-content" />
        </div>
      </div>

      {/* Profile card */}
      <div className="ug-container">
        <motion.div className="profile-identity" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <Avatar name={userName} size="xl" gold />
          <div className="profile-identity-info">
            <h1 className="profile-identity-name">{userName}</h1>
            <p className="profile-identity-email">{userEmail}</p>
            <div className="profile-identity-badges">
              <Badge color="gold" size="sm" dot>Active Student</Badge>
              <Badge color="ai" size="sm">AI Guided</Badge>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="profile-tabs-wrap">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content */}
        <motion.div className="profile-content" variants={staggerContainer} initial="hidden" animate="visible">
          {activeTab === 'overview' && (
            <>
              {/* Greeting */}
              <motion.div variants={fadeUp} custom={0}>
                <Card className="profile-greeting" hover={false}>
                  <div className="profile-greeting-text">
                    <h2>{getGreeting()}, {userName.split(' ')[0]}.</h2>
                    <p>Here's what your AI guide recommends today.</p>
                  </div>
                  <div className="profile-greeting-ai">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="14" stroke="#D4AF67" strokeWidth="1" />
                      <circle cx="16" cy="16" r="5" fill="#D4AF67" />
                    </svg>
                  </div>
                </Card>
              </motion.div>

              {/* AI Insight */}
              <motion.div variants={fadeUp} custom={1}>
                <Card className="profile-ai-insight" hover={false}>
                  <Badge color="gold" size="sm">AI INSIGHT</Badge>
                  <h3>You are close to being internship-ready.</h3>
                  <p>Focus on completing your SQL skills and build 2 portfolio projects to reach 90% readiness.</p>
                  <div className="profile-ai-insight-actions">
                    <Button variant="primary" size="sm">View Recommendations</Button>
                    <Button variant="ghost" size="sm">Dismiss</Button>
                  </div>
                </Card>
              </motion.div>

              {/* Stats */}
              <motion.div className="profile-stats-grid" variants={fadeUp} custom={2}>
                {[
                  { label: 'Profile', value: '72%', color: 'gold' },
                  { label: 'Skills', value: skills.length.toString(), color: 'ai' },
                  { label: 'Match Score', value: '85%', color: 'success' },
                  { label: 'Readiness', value: '78%', color: 'gold' },
                ].map((s, i) => (
                  <Card key={i} className="profile-stat-card" hover={false}>
                    <span className={`profile-stat-value profile-stat-${s.color}`}>{s.value}</span>
                    <span className="profile-stat-label">{s.label}</span>
                  </Card>
                ))}
              </motion.div>

              {/* Progress */}
              <motion.div variants={fadeUp} custom={3}>
                <Card hover={false}>
                  <h3 className="profile-section-title">Academic Progress</h3>
                  <div className="profile-progress-list">
                    <Progress value={72} label="Profile Completeness" color="gold" />
                    <Progress value={85} label="Career Match" color="ai" />
                    <Progress value={45} label="Skills Coverage" color="success" />
                    <Progress value={78} label="Internship Readiness" color="gold" />
                  </div>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={fadeUp} custom={4}>
                <Card hover={false}>
                  <h3 className="profile-section-title">Recommended Actions</h3>
                  <div className="profile-actions">
                    <Button variant="secondary" size="sm">Complete Profile</Button>
                    <Button variant="secondary" size="sm">Add Skills</Button>
                    <Button variant="secondary" size="sm">Explore Opportunities</Button>
                    <Button variant="secondary" size="sm">Talk to AI Guide</Button>
                  </div>
                </Card>
              </motion.div>
            </>
          )}

          {activeTab === 'skills' && (
            <>
              <motion.div className="profile-skills-header" variants={fadeUp} custom={0}>
                <h2 className="profile-section-title">Your Skills</h2>
                <Button variant="primary" size="sm" onClick={() => setShowAddSkill(true)}>Add Skill</Button>
              </motion.div>
              <motion.div className="profile-skills-grid" variants={staggerContainer} initial="hidden" animate="visible">
                {skills.map((skill, i) => (
                  <motion.div key={skill.id || i} variants={fadeUp} custom={i}>
                    <Card className="profile-skill-card" hover>
                      <div className="profile-skill-header">
                        <span className="profile-skill-name">{skill.name}</span>
                        <Badge color={skillColors[i % skillColors.length]} size="sm">{skill.level}</Badge>
                      </div>
                      <Progress
                        value={skill.level === 'Expert' ? 90 : skill.level === 'Advanced' ? 75 : skill.level === 'Intermediate' ? 55 : 30}
                        showValue={false}
                        size="sm"
                        color={skillColors[i % skillColors.length]}
                      />
                    </Card>
                  </motion.div>
                ))}
                {skills.length === 0 && !loading && (
                  <Card hover={false} className="profile-empty">
                    <p>No skills added yet. Add your first skill to get started.</p>
                  </Card>
                )}
              </motion.div>
            </>
          )}

          {activeTab === 'settings' && (
            <motion.div variants={fadeUp} custom={0}>
              <Card hover={false}>
                <h3 className="profile-section-title">Account Settings</h3>
                <div className="profile-settings">
                  <Input label="Full Name" defaultValue={userName} />
                  <Input label="Email" defaultValue={userEmail} type="email" />
                  <div className="profile-settings-actions">
                    <Button variant="primary" size="sm">Save Changes</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Add Skill Modal */}
      <Modal isOpen={showAddSkill} onClose={() => setShowAddSkill(false)} title="Add Skill">
        <div className="profile-modal-form">
          <Input
            label="Skill Name"
            placeholder="e.g. Python, Design, Marketing"
            value={newSkill.name}
            onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
          />
          <div className="profile-modal-levels">
            <label className="profile-modal-label">Level</label>
            <div className="profile-modal-level-grid">
              {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(level => (
                <button
                  key={level}
                  className={`profile-modal-level-btn ${newSkill.level === level ? 'profile-modal-level-active' : ''}`}
                  onClick={() => setNewSkill({ ...newSkill, level })}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <Button variant="primary" onClick={handleAddSkill}>Add Skill</Button>
        </div>
      </Modal>
    </PageLayout>
  );
}
