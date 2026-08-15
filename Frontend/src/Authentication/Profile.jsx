import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import axiosInstance from '../Utils/axiosInstance';
import { toast } from 'react-toastify';
import '../assets/Style/Profile.css';

const POPULAR_SKILLS = [
  "Python", "React", "JavaScript", "TypeScript", "Django", "Node.js", 
  "SQL", "Machine Learning", "AWS", "Docker", "Git", "Java", "C++", "Tailwind CSS"
];

const SKILL_LEVELS = [
  { label: "Beginner", percentage: 30, icon: "🌱" },
  { label: "Intermediate", percentage: 60, icon: "🚀" },
  { label: "Advanced", percentage: 85, icon: "⭐" },
  { label: "Expert", percentage: 95, icon: "👑" }
];

const COLOR_PALETTE = [
  "#00b4d8", "#3b82f6", "#8b5cf6", "#ec4899", "#f77f00", "#10b981"
];

const EDUCATION_LABELS = {
  high_school: 'High School',
  undergraduate: 'Undergraduate',
  postgraduate: 'Postgraduate / Masters',
  doctoral: 'Doctoral / PhD',
  diploma: 'Diploma / Certificate',
  other: 'Other',
};

const YEAR_LABELS = {
  '1': '1st Year',
  '2': '2nd Year',
  '3': '3rd Year',
  '4': '4th Year',
  '5': '5th Year or above',
  graduated: 'Graduated',
};

const EMPTY_STUDENT_PROFILE = {
  education_level: '',
  institution: '',
  course: '',
  year_of_study: '',
  academic_performance: '',
  interests: '',
  career_goal: '',
  preferred_location: '',
  preferred_country: '',
  budget: '',
  bio: '',
};

const Profile = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [studentProfile, setStudentProfile] = useState(EMPTY_STUDENT_PROFILE);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [newSkill, setNewSkill] = useState({
    name: '',
    percentage: 85,
    color: '#00b4d8',
    level: 'Advanced'
  });

  const token = localStorage.getItem("accessToken");
  let user = null;
  try {
    const stored = localStorage.getItem("user");
    user = stored ? JSON.parse(stored) : null;
  } catch {
    user = null;
  }

  // --- LIFECYCLE ---
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      Promise.all([fetchProfileData(), fetchStudentProfile()]).finally(() => {
        setLoading(false);
      });
    }
  }, [navigate, token]);

  // --- API ACTIONS ---
  const fetchProfileData = async () => {
    try {
      const resp = await axiosInstance.get("students/me/");
      setProfileData(resp.data);
    } catch (err) {
      console.error("Profile fetch error:", err);
      toast.error("Failed to load profile data");
    }
  };

  const fetchStudentProfile = async () => {
    try {
      const resp = await axiosInstance.get("students/profile/");
      setStudentProfile({ ...EMPTY_STUDENT_PROFILE, ...resp.data });
    } catch (err) {
      console.error("Student profile fetch error:", err);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.name.trim()) {
      toast.error("Please enter or select a skill name");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axiosInstance.post("students/me/", {
        name: newSkill.name.trim(),
        percentage: Number(newSkill.percentage),
        color: newSkill.color
      });

      if (res.status === 201 || res.status === 200) {
        toast.success(`Skill "${newSkill.name}" saved to database! 🎯`);
        setShowSkillModal(false);
        setNewSkill({ name: '', percentage: 85, color: '#00b4d8', level: 'Advanced' }); 
        fetchProfileData();
      }
    } catch (err) {
      toast.error("Failed to save skill to database.");
      console.error(err.response?.data);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!skillId) return;
    try {
      const res = await axiosInstance.delete(`students/skills/${skillId}/`);
      if (res.status === 200) {
        toast.info("Skill removed from profile");
        fetchProfileData();
      }
    } catch {
      toast.error("Failed to remove skill");
    }
  };

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem("refreshToken");
      await axiosInstance.post("auth/logout/", { refresh_token: refresh });
    } catch {
      // Ignore logout API failure
    } finally {
      localStorage.clear();
      navigate("/login");
      toast.success("Logged out successfully");
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.trim().split(/\s+/).slice(0, 2).map(word => word[0].toUpperCase()).join("");
  };

  const selectSkillLevel = (lvl) => {
    setNewSkill(prev => ({
      ...prev,
      percentage: lvl.percentage,
      level: lvl.label
    }));
  };

  const handleProfileFieldChange = (e) => {
    const { name, value } = e.target;
    setStudentProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveStudentProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileSubmitting(true);
      const res = await axiosInstance.put('students/profile/', studentProfile);
      setStudentProfile({ ...EMPTY_STUDENT_PROFILE, ...res.data });
      setShowProfileModal(false);
      toast.success('Profile details updated');
    } catch (err) {
      const errMsg = err?.response?.data?.detail || 'Failed to update profile details';
      toast.error(errMsg);
    } finally {
      setProfileSubmitting(false);
    }
  };

  const displayEducation = EDUCATION_LABELS[studentProfile?.education_level] || studentProfile?.education_level || 'Not set';
  const displayYear = YEAR_LABELS[studentProfile?.year_of_study] || studentProfile?.year_of_study || 'Not set';

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="profile-spinner" role="status" aria-label="Loading" />
        <span style={{ marginLeft: "12px", color: "#e0f0ff" }}>Connecting to UniGuide Database...</span>
      </div>
    );
  }

  const displayUser = profileData || user;

  return (
    <>
      <Navbar />
      <div className="profile-wrapper">

        {/* Header Card */}
        <div className="profile-card mb-3">
          <div className="profile-header">
            <div className="avatar-wrap">
              <div className="profile-avatar">{getInitials(displayUser?.full_name)}</div>
              <div className="online-dot" />
            </div>

            <div className="profile-info">
              <h2 className="profile-name">{displayUser?.full_name || "Student User"}</h2>
              <p className="profile-email">{displayUser?.email}</p>
              <div className="badge-row">
                <span className="badge-pill">{studentProfile?.course || 'Course not set'}</span>
                <span className="badge-pill">{displayYear}</span>
                <span className="badge-pill orange">Pro Member</span>
              </div>
            </div>

            <div className="profile-actions">
              <button className="edit-btn" onClick={() => setShowProfileModal(true)}>Edit Profile</button>
              <button className="edit-btn" onClick={() => setShowSkillModal(true)}>+ Add Skill</button>
              <button onClick={handleLogout} className="logout-btn">Log out</button>
            </div>
          </div>
        </div>

        <div className="profile-card mb-3">
          <div className="section-header">
            <span className="section-title">Student Profile Details</span>
            <button className="edit-btn" onClick={() => setShowProfileModal(true)}>Edit</button>
          </div>
          <div className="details-grid">
            <div className="detail-item"><span>Education</span><strong>{displayEducation}</strong></div>
            <div className="detail-item"><span>Institution</span><strong>{studentProfile?.institution || 'Not set'}</strong></div>
            <div className="detail-item"><span>Course</span><strong>{studentProfile?.course || 'Not set'}</strong></div>
            <div className="detail-item"><span>Year</span><strong>{displayYear}</strong></div>
            <div className="detail-item"><span>Academic Performance</span><strong>{studentProfile?.academic_performance || 'Not set'}</strong></div>
            <div className="detail-item"><span>Career Goal</span><strong>{studentProfile?.career_goal || 'Not set'}</strong></div>
            <div className="detail-item"><span>Preferred Location</span><strong>{studentProfile?.preferred_location || 'Not set'}</strong></div>
            <div className="detail-item"><span>Preferred Country</span><strong>{studentProfile?.preferred_country || 'Not set'}</strong></div>
            <div className="detail-item"><span>Budget</span><strong>{studentProfile?.budget || 'Not set'}</strong></div>
            <div className="detail-item detail-item-full"><span>Interests</span><strong>{studentProfile?.interests || 'Not set'}</strong></div>
            <div className="detail-item detail-item-full"><span>Bio</span><strong>{studentProfile?.bio || 'Not set'}</strong></div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row mb-3">
          <div className="stat-card">
            <div className="stat-number teal">{profileData?.skills?.length || 0}</div>
            <div className="stat-label">Skills Added</div>
          </div>
          <div className="stat-card">
            <div className="stat-number orange">{profileData?.applications?.length || 0}</div>
            <div className="stat-label">Applications</div>
          </div>
          <div className="stat-card">
            <div className="stat-number green">{profileData?.suggestions?.length || 0}</div>
            <div className="stat-label">Job Matches</div>
          </div>
          <div className="stat-card">
            <div className="stat-number purple">94%</div>
            <div className="stat-label">Profile Strength</div>
          </div>
        </div>

        {/* Skills Section - LinkedIn Style */}
        <div className="profile-card mb-3">
          <div className="section-header">
            <div>
              <span className="section-title">Verified Skills &amp; Endorsements</span>
              <span className="skill-count-badge ms-2">{profileData?.skills?.length || 0}</span>
            </div>
            <button className="edit-btn" onClick={() => setShowSkillModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="me-1">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Skill
            </button>
          </div>

          <div className="skills-grid">
            {profileData?.skills?.length > 0 ? (
              profileData.skills.map((skill) => (
                <div key={skill.id || skill.name} className="linkedin-skill-card">
                  <div className="skill-card-top">
                    <div className="skill-badge-icon" style={{ backgroundColor: `${skill.color || '#00b4d8'}20`, color: skill.color || '#00b4d8' }}>
                      ⚡
                    </div>
                    <div className="skill-card-info">
                      <span className="skill-name">{skill.name}</span>
                      <span className="skill-level-text">
                        {skill.percentage >= 90 ? "Expert" : skill.percentage >= 75 ? "Advanced" : skill.percentage >= 50 ? "Intermediate" : "Beginner"} · {skill.percentage}%
                      </span>
                    </div>
                    {skill.id && (
                      <button 
                        className="delete-skill-btn" 
                        title="Remove skill"
                        onClick={() => handleDeleteSkill(skill.id)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="skill-progress-bar">
                    <div 
                      className="skill-progress-fill" 
                      style={{ 
                        width: `${skill.percentage}%`, 
                        background: skill.color || '#00b4d8' 
                      }} 
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-skills-banner">
                <div className="empty-icon">💡</div>
                <div className="empty-title">No skills added yet</div>
                <div className="empty-sub">Add skills to get personalized internship recommendations and SOP guidance.</div>
                <button className="add-first-skill-btn mt-2" onClick={() => setShowSkillModal(true)}>+ Add Your First Skill</button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Job & Internship Recommendations */}
        <div className="profile-card mb-3">
          <div className="section-header">
            <span className="section-title">Recommended Internships &amp; Roles</span>
            <span className="view-all">Based on your skills</span>
          </div>
          <div className="app-list">
            {profileData?.suggestions?.length > 0 ? (
              profileData.suggestions.map((job, index) => (
                <div key={index} className="app-item">
                  <div>
                    <div className="app-role">{job.role}</div>
                    <div className="app-company">{job.company} · {job.location}</div>
                  </div>
                  <span className="app-status" style={{ color: '#00b4d8', background: 'rgba(0,180,216,0.12)', border: '1px solid rgba(0,180,216,0.3)' }}>
                    Match {job.match}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-text">Add skills above to see tailored internship recommendations.</p>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="profile-card mb-3">
          <div className="section-header">
            <span className="section-title">Recent Applications</span>
            <span className="view-all">{profileData?.applications?.length || 0} total</span>
          </div>
          <div className="app-list">
            {profileData?.applications?.length > 0 ? (
              profileData.applications.map((app, index) => (
                <div key={index} className="app-item">
                  <div>
                    <div className="app-role">{app.role}</div>
                    <div className="app-company">{app.company}</div>
                  </div>
                  <span
                    className="app-status"
                    style={{
                      color: app.color,
                      background: `${app.color}1A`,
                      border: `1px solid ${app.color}33`
                    }}
                  >
                    {app.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-text">No applications yet. Start applying to internships to track them here.</p>
            )}
          </div>
        </div>

        {/* --- LINKEDIN STYLE ADD SKILL MODAL --- */}
        {showSkillModal && (
          <div className="modal-overlay" onClick={() => setShowSkillModal(false)}>
            <div className="modal-content linkedin-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Add Skill</h3>
                  <p className="modal-subtitle">Showcase your top capabilities to receive AI career guidance</p>
                </div>
                <button className="close-x" onClick={() => setShowSkillModal(false)}>&times;</button>
              </div>

              <form onSubmit={handleAddSkill}>
                {/* Skill Name Input */}
                <div className="form-group">
                  <label>Skill Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Python, React, Data Science, AWS..." 
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                    required 
                    autoFocus
                  />
                </div>

                {/* Popular Skill Quick Suggestions */}
                <div className="form-group">
                  <label className="sub-label">Popular Suggestions</label>
                  <div className="quick-chip-wrap">
                    {POPULAR_SKILLS.map(skillName => (
                      <button
                        type="button"
                        key={skillName}
                        className={`skill-chip ${newSkill.name.toLowerCase() === skillName.toLowerCase() ? 'active' : ''}`}
                        onClick={() => setNewSkill({...newSkill, name: skillName})}
                      >
                        + {skillName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Proficiency Level Selector */}
                <div className="form-group">
                  <label>Proficiency Level</label>
                  <div className="level-grid">
                    {SKILL_LEVELS.map(lvl => (
                      <button
                        type="button"
                        key={lvl.label}
                        className={`level-card ${newSkill.percentage === lvl.percentage ? 'selected' : ''}`}
                        onClick={() => selectSkillLevel(lvl)}
                      >
                        <span className="level-icon">{lvl.icon}</span>
                        <span className="level-name">{lvl.label}</span>
                        <span className="level-percent">{lvl.percentage}%</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Tag Picker */}
                <div className="form-group">
                  <label className="sub-label">Badge Theme Color</label>
                  <div className="color-picker-row">
                    {COLOR_PALETTE.map(c => (
                      <button
                        type="button"
                        key={c}
                        className={`color-dot ${newSkill.color === c ? 'active-color' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewSkill({...newSkill, color: c})}
                      />
                    ))}
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowSkillModal(false)}>Cancel</button>
                  <button type="submit" className="save-btn" disabled={submitting}>
                    {submitting ? "Saving to DB..." : "Save to Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showProfileModal && (
          <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
            <div className="modal-content linkedin-modal profile-details-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Edit Profile Details</h3>
                  <p className="modal-subtitle">Update your academic and career preferences</p>
                </div>
                <button className="close-x" onClick={() => setShowProfileModal(false)}>&times;</button>
              </div>

              <form onSubmit={handleSaveStudentProfile}>
                <div className="profile-edit-grid">
                  <div className="form-group">
                    <label>Education Level</label>
                    <select name="education_level" value={studentProfile.education_level} onChange={handleProfileFieldChange}>
                      <option value="">Select education level</option>
                      <option value="high_school">High School</option>
                      <option value="undergraduate">Undergraduate</option>
                      <option value="postgraduate">Postgraduate / Masters</option>
                      <option value="doctoral">Doctoral / PhD</option>
                      <option value="diploma">Diploma / Certificate</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Institution</label>
                    <input type="text" name="institution" value={studentProfile.institution} onChange={handleProfileFieldChange} placeholder="Your college or university" />
                  </div>

                  <div className="form-group">
                    <label>Course</label>
                    <input type="text" name="course" value={studentProfile.course} onChange={handleProfileFieldChange} placeholder="Program or major" />
                  </div>

                  <div className="form-group">
                    <label>Year of Study</label>
                    <select name="year_of_study" value={studentProfile.year_of_study} onChange={handleProfileFieldChange}>
                      <option value="">Select year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year or above</option>
                      <option value="graduated">Graduated</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Academic Performance</label>
                    <input type="text" name="academic_performance" value={studentProfile.academic_performance} onChange={handleProfileFieldChange} placeholder="CGPA 8.5/10 or GPA 3.7/4" />
                  </div>

                  <div className="form-group">
                    <label>Career Goal</label>
                    <input type="text" name="career_goal" value={studentProfile.career_goal} onChange={handleProfileFieldChange} placeholder="Target role" />
                  </div>

                  <div className="form-group">
                    <label>Preferred Location</label>
                    <input type="text" name="preferred_location" value={studentProfile.preferred_location} onChange={handleProfileFieldChange} placeholder="City or region" />
                  </div>

                  <div className="form-group">
                    <label>Preferred Country</label>
                    <input type="text" name="preferred_country" value={studentProfile.preferred_country} onChange={handleProfileFieldChange} placeholder="Country" />
                  </div>

                  <div className="form-group">
                    <label>Budget</label>
                    <input type="text" name="budget" value={studentProfile.budget} onChange={handleProfileFieldChange} placeholder="$15,000/year" />
                  </div>

                  <div className="form-group profile-edit-full">
                    <label>Interests</label>
                    <textarea name="interests" value={studentProfile.interests} onChange={handleProfileFieldChange} rows={2} placeholder="AI, cloud, product engineering" />
                  </div>

                  <div className="form-group profile-edit-full">
                    <label>Bio</label>
                    <textarea name="bio" value={studentProfile.bio} onChange={handleProfileFieldChange} rows={3} placeholder="Any additional background details" />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowProfileModal(false)}>Cancel</button>
                  <button type="submit" className="save-btn" disabled={profileSubmitting}>
                    {profileSubmitting ? "Saving..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default Profile;