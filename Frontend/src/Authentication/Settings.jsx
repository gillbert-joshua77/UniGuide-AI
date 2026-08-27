import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import axiosInstance from '../Utils/axiosInstance';
import PageLayout from '../Components/layout/PageLayout';
import { Button, Card, Input, Textarea } from '../Components/ui';
import { useAuth } from '../Context/AuthContext';
import { useTheme } from '../Context/ThemeContext';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/Profile.css';

const EDUCATION_LEVELS = ['high_school', 'undergraduate', 'postgraduate', 'doctoral', 'diploma', 'other'];
const YEARS = ['1', '2', '3', '4', '5', 'graduated'];

export default function Settings() {
  const { profile, updateProfile, changePassword, loadProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [pwd, setPwd] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      const names = (profile.full_name || '').split(' ');
      setForm({
        first_name: profile.first_name || names[0] || '',
        last_name: profile.last_name || names.slice(1).join(' ') || '',
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
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated successfully');
      await loadProfile();
    } catch (e) {
      const data = e?.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat()[0] : 'Could not save profile';
      toast.error(msg || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwd.new_password !== pwd.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwd.new_password.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setPwdSaving(true);
    try {
      await changePassword(pwd);
      toast.success('Password changed successfully');
      setPwd({ old_password: '', new_password: '', confirm_password: '' });
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.detail || 'Could not change password';
      toast.error(msg);
    } finally {
      setPwdSaving(false);
    }
  };

  if (!profile) {
    return (
      <PageLayout>
        <div className="ug-container" style={{ padding: '40px 24px' }}>
          <Card hover={false}>Loading your settings…</Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="ug-container profile-settings-page">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.h1 className="profile-settings-page-title" variants={fadeUp} custom={0}>Settings</motion.h1>
          <motion.p className="profile-settings-page-sub" variants={fadeUp} custom={0}>
            Manage your profile, account and preferences.
          </motion.p>

          {/* Profile information */}
          <motion.div variants={fadeUp} custom={1}>
            <Card hover={false} className="profile-section">
              <h3 className="profile-section-title">Profile Information</h3>
              <div className="profile-edit-grid">
                <Input label="First Name" value={form.first_name || ''} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                <Input label="Last Name" value={form.last_name || ''} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                <div className="profile-edit-inline">
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
                      {YEARS.map((y) => <option key={y} value={y}>{y === 'graduated' ? 'Graduated' : `${y}${y==='1'?'st':y==='2'?'nd':y==='3'?'rd':'th'} Year`}</option>)}
                    </select>
                  </div>
                </div>
                <Input label="Institution / University" value={form.institution || ''} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
                <Input label="Program / Course" value={form.course || ''} onChange={(e) => setForm({ ...form, course: e.target.value })} />
                <Input label="Academic Performance" placeholder="e.g. CGPA 8.5/10" value={form.academic_performance || ''} onChange={(e) => setForm({ ...form, academic_performance: e.target.value })} />
                <Input label="Preferred Location" value={form.preferred_location || ''} onChange={(e) => setForm({ ...form, preferred_location: e.target.value })} />
                <Input label="Preferred Country" value={form.preferred_country || ''} onChange={(e) => setForm({ ...form, preferred_country: e.target.value })} />
                <Input label="Budget" placeholder="e.g. $15,000/year" value={form.budget || ''} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
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
              <div className="profile-edit-actions">
                <Button variant="primary" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Profile'}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Account */}
          <motion.div variants={fadeUp} custom={2}>
            <Card hover={false} className="profile-section">
              <h3 className="profile-section-title">Account</h3>
              <div className="profile-fields">
                <div className="profile-field">
                  <span className="profile-field-label">Email</span>
                  <span className="profile-field-value">{profile.email}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Name</span>
                  <span className="profile-field-value">{profile.full_name}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Change password */}
          <motion.div variants={fadeUp} custom={3}>
            <Card hover={false} className="profile-section">
              <h3 className="profile-section-title">Change Password</h3>
              <div className="profile-edit-grid">
                <Input label="Current Password" type="password" value={pwd.old_password} onChange={(e) => setPwd({ ...pwd, old_password: e.target.value })} />
                <div />
                <Input label="New Password" type="password" value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} />
                <Input label="Confirm New Password" type="password" value={pwd.confirm_password} onChange={(e) => setPwd({ ...pwd, confirm_password: e.target.value })} />
              </div>
              <div className="profile-edit-actions">
                <Button variant="primary" onClick={handleChangePassword} disabled={pwdSaving}>
                  {pwdSaving ? 'Updating…' : 'Update Password'}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Preferences */}
          <motion.div variants={fadeUp} custom={4}>
            <Card hover={false} className="profile-section">
              <h3 className="profile-section-title">Preferences</h3>
              <div className="settings-pref-row">
                <div>
                  <div className="settings-pref-label">Theme</div>
                  <div className="settings-pref-desc">Switch between light and dark mode.</div>
                </div>
                <Button variant="outline" size="sm" onClick={toggleTheme}>
                  {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
