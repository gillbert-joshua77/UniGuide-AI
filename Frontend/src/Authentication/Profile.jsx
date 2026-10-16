import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import axiosInstance from '../Utils/axiosInstance';
import PageLayout from '../Components/layout/PageLayout';
import { Button, Card, Badge, Avatar, Progress, Tabs, Modal, Input, Textarea } from '../Components/ui';
import { useAuth } from '../Context/useAuth';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/Profile.css';

const EDUCATION_LEVELS = [
  'high_school', 'undergraduate', 'postgraduate', 'doctoral', 'diploma', 'other',
];
const YEARS = ['1', '2', '3', '4', '5', 'graduated'];

const LEVELS = [
  { label: 'Beginner', value: 25 },
  { label: 'Intermediate', value: 50 },
  { label: 'Advanced', value: 75 },
  { label: 'Expert', value: 90 },
];

function levelFromPercentage(pct) {
  if (!pct || pct < 31) return 'Beginner';
  if (pct < 56) return 'Intermediate';
  if (pct < 76) return 'Advanced';
  return 'Expert';
}

function splitList(text) {
  if (!text) return [];
  return text.split(',').map((t) => t.trim()).filter(Boolean);
}

function formatYear(year) {
  if (!year) return '';
  if (year === 'graduated') return 'Graduated';
  const suffix =
    year === '1' ? 'st' : year === '2' ? 'nd' : year === '3' ? 'rd' : 'th';
  return `${year}${['1', '2', '3', '4', '5'].includes(year) ? `${suffix} Year` : ''}`;
}

function Field({ label, value, emptyText = 'Not added yet' }) {
  return (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <span className="profile-field-value">
        {value && String(value).trim() ? value : <em className="profile-empty-value">{emptyText}</em>}
      </span>
    </div>
  );
}

const PROFILE_FIELDS = [
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'education_level', label: 'Education level' },
  { key: 'institution', label: 'University / Institution' },
  { key: 'course', label: 'Program / Course' },
  { key: 'year_of_study', label: 'Year of study' },
  { key: 'academic_performance', label: 'Academic performance' },
  { key: 'preferred_location', label: 'Preferred location' },
  { key: 'preferred_country', label: 'Preferred country' },
  { key: 'budget', label: 'Budget' },
  { key: 'interests', label: 'Interests' },
  { key: 'career_goal', label: 'Career goal' },
  { key: 'bio', label: 'Bio' },
];

export default function Profile() {
  const {
    profile, skills, loading, error, loadProfile, isAuthenticated,
    updateProfile, addSkill, deleteSkill,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate' });
  const contentRef = useRef(null);

  const name = profile?.full_name || 'Student';
  const email = profile?.email || '';
  const completion = profile?.profile_completion ?? 0;

  const interests = useMemo(() => splitList(profile?.interests), [profile?.interests]);

  const educationSummary = [
    profile?.education_level ? profile.education_level.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null,
    profile?.course,
    formatYear(profile?.year_of_study),
  ].filter(Boolean).join(' · ');

  const missingFields = useMemo(() => {
    if (!profile) return [];
    return PROFILE_FIELDS.filter((f) => {
      const v = profile[f.key];
      return v === null || v === undefined || String(v).trim() === '';
    }).slice(0, 4);
  }, [profile]);

  const detailsFilled = profile
    ? PROFILE_FIELDS.filter((f) => {
        const v = profile[f.key];
        return v !== null && v !== undefined && String(v).trim() !== '';
      }).length
    : 0;

  const goToSettings = () => {
    setActiveTab('settings');
    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // ── Add skill ────────────────────────────────────────────────
  const handleAddSkill = async () => {
    const skillName = newSkill.name.trim();
    if (!skillName) {
      toast.error('Please enter a skill name');
      return;
    }
    const level = LEVELS.find((l) => l.label === newSkill.level) || LEVELS[1];
    try {
      await addSkill({ name: skillName, percentage: level.value });
      toast.success(`"${skillName}" added to your skills`);
      setNewSkill({ name: '', level: 'Intermediate' });
      setShowAddSkill(false);
    } catch (e) {
      const msg = e?.response?.data?.name?.[0] || e?.response?.data?.error || 'Could not add skill';
      toast.error(msg);
    }
  };

  const handleDeleteSkill = async (id) => {
    try {
      await deleteSkill(id);
      toast.success('Skill removed');
    } catch {
      toast.error('Could not remove skill');
    }
  };

  // ── Edit profile (inline settings) ───────────────────────────
  const [form, setForm] = useState({});
  useEffect(() => {
    if (!profile) return;
    const names = (profile.full_name || '').split(' ');
    setForm({
      first_name: profile.first_name || names[0] || '',
      last_name: profile.last_name || names.slice(1).join(' ') || '',
      profile_picture: null,
      education_level: profile.education_level || '',
      institution: profile.institution || '',
      course: profile.course || '',
      year_of_study: profile.year_of_study || '',
      academic_performance: profile.academic_performance || '',
      interests: profile.interests || '',
      career_goal: profile.career_goal || '',
      preferred_location: profile.preferred_location || '',
      preferred_country: profile.preferred_country || '',
      budget: profile.budget || '',
      bio: profile.bio || '',
    });
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const hasFile = form.profile_picture instanceof File;
      if (hasFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (k === 'profile_picture') {
            fd.append('profile_picture', v);
          } else if (v != null && v !== '') {
            fd.append(k, v);
          }
        });
        await axiosInstance.put('/students/profile/', fd);
      } else {
        const { profile_picture, ...json } = form;
        await updateProfile(json);
      }
      toast.success('Profile updated successfully');
      await loadProfile();
      setActiveTab('overview');
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      const data = e?.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat()[0] : 'Could not save profile';
      toast.error(msg || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <PageLayout>
        <div className="ug-container profile-loading">
          <div className="profile-skeleton-banner" />
          <div className="profile-skeleton-row">
            <div className="profile-skeleton-avatar" />
            <div className="profile-skeleton-lines">
              <div className="profile-skeleton-line lg" />
              <div className="profile-skeleton-line sm" />
            </div>
          </div>
          <div className="profile-skeleton-tabs">
            <div className="profile-skeleton-line sm" />
            <div className="profile-skeleton-line sm" />
            <div className="profile-skeleton-line sm" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error && !profile) {
    if (!isAuthenticated) return <Navigate to="/login" />;
    return (
      <PageLayout>
        <div className="ug-container">
          <Card hover={false} className="profile-error">
            <h3>We couldn&apos;t load your profile</h3>
            <p>{typeof error === 'string' ? error : 'Please try again.'}</p>
            <Button variant="primary" size="sm" onClick={loadProfile}>Retry</Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'skills', label: 'Skills', count: skills.length },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <PageLayout>
      {/* Decorative banner */}
      <div className="profile-banner">
        <div className="profile-banner-glow" />
      </div>

      <div className="ug-container" ref={contentRef}>
        {/* Identity header */}
        <motion.div className="profile-identity" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <Avatar src={profile?.profile_picture} name={name} size="xl" gold />
          <div className="profile-identity-info">
            <div className="profile-identity-top">
              <h1 className="profile-identity-name">{name}</h1>
              <Badge color="gold" size="sm" dot>Active Student</Badge>
            </div>
            <p className="profile-identity-email">{email}</p>
            {educationSummary && <p className="profile-identity-education">{educationSummary}</p>}
          </div>
          <div className="profile-identity-actions">
            <Button variant="outline" size="sm" onClick={goToSettings}>Edit Profile</Button>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div className="profile-stats" variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0}>
            <Card hover={false} className="profile-stat-card">
              <span className="profile-stat-label">Profile Completion</span>
              <div className="profile-stat-value-row">
                <strong className="profile-stat-value">{completion}%</strong>
                {completion === 100 && <Badge color="success" size="sm">Complete</Badge>}
              </div>
              <Progress value={completion} showValue={false} color="gold" size="sm" />
              {completion < 100 ? (
                <p className="profile-stat-hint">
                  {missingFields.length
                    ? `Incomplete — add ${missingFields.slice(0, 3).map((f) => f.label.toLowerCase()).join(', ')}${missingFields.length > 3 ? '…' : ''}.`
                    : 'A few details will refine your guidance.'}
                </p>
              ) : (
                <p className="profile-stat-hint">All set — your profile is ready to power personalized guidance.</p>
              )}
            </Card>
          </motion.div>
          <motion.div variants={fadeUp} custom={1}>
            <Card hover={false} className="profile-stat-card">
              <span className="profile-stat-label">Skills Added</span>
              <strong className="profile-stat-value">{skills.length}</strong>
              <p className="profile-stat-hint">
                {skills.length ? 'Well done — keep growing your profile.' : 'Add your first skill to get started.'}
              </p>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp} custom={2}>
            <Card hover={false} className="profile-stat-card">
              <span className="profile-stat-label">Profile Details</span>
              <strong className="profile-stat-value">{detailsFilled}/{PROFILE_FIELDS.length}</strong>
              <p className="profile-stat-hint">
                {missingFields.length
                  ? `Next: add ${missingFields[0].label.toLowerCase()}.`
                  : 'All details added. Great job!'}
              </p>
            </Card>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <div className="profile-tabs-wrap">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <motion.div className="profile-content" variants={staggerContainer} initial="hidden" animate="visible">
          {activeTab === 'overview' && (
            <>
              {missingFields.length > 0 && (
                <motion.div variants={fadeUp} custom={0}>
                  <Card hover={false} className="profile-checklist">
                    <div className="profile-checklist-head">
                      <div>
                        <h3 className="profile-section-title">Complete your profile</h3>
                        <p className="profile-section-sub">Add these details so UniGuide AI can personalize your guidance.</p>
                      </div>
                      <Button variant="primary" size="sm" onClick={goToSettings}>Complete Now</Button>
                    </div>
                    <div className="profile-checklist-items">
                      {missingFields.map((f) => (
                        <div key={f.key} className="profile-checklist-item">
                          <span className="profile-checklist-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                          </span>
                          <span className="profile-checklist-label">{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              <div className="profile-overview-grid">
                <motion.div variants={fadeUp} custom={1}>
                  <Card hover={false} className="profile-section">
                    <div className="profile-section-head">
                      <h3 className="profile-section-title">About</h3>
                      <Button variant="ghost" size="sm" onClick={goToSettings}>Edit</Button>
                    </div>
                    {profile?.bio && profile.bio.trim() ? (
                      <p className="profile-about-text">{profile.bio}</p>
                    ) : (
                      <div className="profile-empty-action">
                        <p className="profile-empty-value">No bio yet — add a short introduction about yourself.</p>
                        <Button variant="ghost" size="sm" onClick={goToSettings}>Add Bio</Button>
                      </div>
                    )}
                  </Card>
                </motion.div>

                <motion.div variants={fadeUp} custom={2}>
                  <Card hover={false} className="profile-section">
                    <div className="profile-section-head">
                      <h3 className="profile-section-title">Skills</h3>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('skills')}>Manage</Button>
                    </div>
                    {skills.length ? (
                      <div className="profile-chips">
                        {skills.map((s) => (
                          <Badge key={s.id} color="gold" size="sm">{s.name} · {levelFromPercentage(s.percentage)}</Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="profile-empty-action">
                        <p className="profile-empty-value">No skills added yet — show off what you know.</p>
                        <Button variant="ghost" size="sm" onClick={() => setShowAddSkill(true)}>Add Skill</Button>
                      </div>
                    )}
                  </Card>
                </motion.div>

                <motion.div variants={fadeUp} custom={3}>
                  <Card hover={false} className="profile-section">
                    <div className="profile-section-head">
                      <h3 className="profile-section-title">Education</h3>
                      <Button variant="ghost" size="sm" onClick={goToSettings}>Edit</Button>
                    </div>
                    <div className="profile-fields">
                      <Field label="University / Institution" value={profile?.institution} />
                      <Field label="Program / Course" value={profile?.course} />
                      <Field label="Year of Study" value={formatYear(profile?.year_of_study)} />
                      <Field label="Academic Performance" value={profile?.academic_performance} />
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={fadeUp} custom={4}>
                  <Card hover={false} className="profile-section">
                    <div className="profile-section-head">
                      <h3 className="profile-section-title">Preferences</h3>
                      <Button variant="ghost" size="sm" onClick={goToSettings}>Edit</Button>
                    </div>
                    <div className="profile-fields">
                      <Field label="Preferred Location" value={profile?.preferred_location} />
                      <Field label="Preferred Country" value={profile?.preferred_country} />
                      <Field label="Budget" value={profile?.budget} />
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={fadeUp} custom={5}>
                  <Card hover={false} className="profile-section">
                    <div className="profile-section-head">
                      <h3 className="profile-section-title">Interests</h3>
                      <Button variant="ghost" size="sm" onClick={goToSettings}>Edit</Button>
                    </div>
                    {interests.length ? (
                      <div className="profile-chips">
                        {interests.map((i) => <Badge key={i} color="ai" size="sm">{i}</Badge>)}
                      </div>
                    ) : <p className="profile-empty-value">Add your interests to get personalized guidance.</p>}
                  </Card>
                </motion.div>

                <motion.div variants={fadeUp} custom={6}>
                  <Card hover={false} className="profile-section">
                    <div className="profile-section-head">
                      <h3 className="profile-section-title">Career Goals</h3>
                      <Button variant="ghost" size="sm" onClick={goToSettings}>Edit</Button>
                    </div>
                    {profile?.career_goal && profile.career_goal.trim() ? (
                      <p className="profile-goal-text">{profile.career_goal}</p>
                    ) : <p className="profile-empty-value">Not added yet</p>}
                  </Card>
                </motion.div>
              </div>
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
                        <Badge color="gold" size="sm">{levelFromPercentage(skill.percentage)}</Badge>
                      </div>
                      <Progress value={skill.percentage || 0} showValue={false} size="sm" color="gold" />
                      <button className="profile-skill-remove" onClick={() => handleDeleteSkill(skill.id)} aria-label={`Remove ${skill.name}`}>Remove</button>
                    </Card>
                  </motion.div>
                ))}
                {skills.length === 0 && (
                  <Card hover={false} className="profile-empty">
                    <div className="profile-empty-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6-6.3 4.6L8 14 2 9.4h7.6z" />
                      </svg>
                    </div>
                    <p>No skills added yet. Add your first skill to get started.</p>
                    <Button variant="primary" size="sm" onClick={() => setShowAddSkill(true)}>Add a Skill</Button>
                  </Card>
                )}
              </motion.div>
            </>
          )}

          {activeTab === 'settings' && (
            <motion.div variants={fadeUp} custom={0}>
              <Card hover={false} className="profile-section">
                <h3 className="profile-section-title">Edit Profile</h3>
                <p className="profile-section-sub">Update your personal information so UniGuide AI can guide you better.</p>

                <div className="profile-settings">
                  <div className="profile-settings-group">
                    <h4 className="profile-settings-title">Personal</h4>
                    <div className="profile-edit-grid">
                      <Input label="First Name" value={form.first_name || ''} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                      <Input label="Last Name" value={form.last_name || ''} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                      <div className="profile-edit-full">
                        <label className="ug-input-label">Email</label>
                        <Input type="email" value={email} disabled />
                      </div>
                      <div className="profile-edit-full">
                        <label className="ug-input-label">Profile Photo</label>
                        <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, profile_picture: e.target.files?.[0] || null })} className="profile-file-input" />
                      </div>
                    </div>
                  </div>

                  <div className="profile-settings-group">
                    <h4 className="profile-settings-title">Education</h4>
                    <div className="profile-edit-grid">
                      <div className="profile-edit-full profile-edit-inline">
                        <div className="profile-edit-half">
                          <label className="ug-input-label">Education Level</label>
                          <select className="ug-input" value={form.education_level || ''} onChange={(e) => setForm({ ...form, education_level: e.target.value })}>
                            <option value="">Select…</option>
                            {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                          </select>
                        </div>
                        <div className="profile-edit-half">
                          <label className="ug-input-label">Year of Study</label>
                          <select className="ug-input" value={form.year_of_study || ''} onChange={(e) => setForm({ ...form, year_of_study: e.target.value })}>
                            <option value="">Select…</option>
                            {YEARS.map((y) => <option key={y} value={y}>{y === 'graduated' ? 'Graduated' : formatYear(y)}</option>)}
                          </select>
                        </div>
                      </div>
                      <Input label="Institution / University" value={form.institution || ''} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
                      <Input label="Program / Course" value={form.course || ''} onChange={(e) => setForm({ ...form, course: e.target.value })} />
                      <Input label="Academic Performance" placeholder="e.g. CGPA 8.5/10" value={form.academic_performance || ''} onChange={(e) => setForm({ ...form, academic_performance: e.target.value })} />
                    </div>
                  </div>

                  <div className="profile-settings-group">
                    <h4 className="profile-settings-title">Preferences</h4>
                    <div className="profile-edit-grid">
                      <Input label="Preferred Location" value={form.preferred_location || ''} onChange={(e) => setForm({ ...form, preferred_location: e.target.value })} />
                      <Input label="Preferred Country" value={form.preferred_country || ''} onChange={(e) => setForm({ ...form, preferred_country: e.target.value })} />
                      <Input label="Budget" placeholder="e.g. $15,000/year" value={form.budget || ''} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
                    </div>
                  </div>

                  <div className="profile-settings-group">
                    <h4 className="profile-settings-title">About You</h4>
                    <div className="profile-edit-grid">
                      <div className="profile-edit-full">
                        <Textarea label="Interests" placeholder="Comma separated, e.g. AI, Web Development, Design" value={form.interests || ''} onChange={(e) => setForm({ ...form, interests: e.target.value })} />
                      </div>
                      <div className="profile-edit-full">
                        <Textarea label="Career Goal" placeholder="e.g. Become a Machine Learning Engineer" value={form.career_goal || ''} onChange={(e) => setForm({ ...form, career_goal: e.target.value })} />
                      </div>
                      <div className="profile-edit-full">
                        <Textarea label="Bio" placeholder="A short introduction about yourself" value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="profile-settings-actions">
                    <Button variant="primary" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </Button>
                    <Button variant="ghost" onClick={() => setActiveTab('overview')}>Cancel</Button>
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
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
          />
          <div className="profile-modal-levels">
            <label className="profile-modal-label">Proficiency</label>
            <div className="profile-modal-level-grid">
              {LEVELS.map((level) => (
                <button
                  key={level.label}
                  type="button"
                  className={`profile-modal-level-btn ${newSkill.level === level.label ? 'profile-modal-level-active' : ''}`}
                  onClick={() => setNewSkill({ ...newSkill, level: level.label })}
                >
                  {level.label}
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