import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import axiosInstance from '../Utlils/axiosInstance';
import { toast } from 'react-toastify';
import axios from "axios";
import '../assets/Style/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', percentage: 80, color: '#00b4d8' });

  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user"));

  // --- LIFECYCLE ---
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      // eslint-disable-next-line react-hooks/immutability
      fetchProfileData();
    }
  }, [navigate, token]);

  // --- API ACTIONS ---
  const fetchProfileData = async () => {
    try {
      // Calls your new 'students' app endpoint
      const resp = await axiosInstance.get("/students/me/");
      setProfileData(resp.data);
      setLoading(false);
    } catch (err) {
      console.error("Profile fetch error:", err);
      toast.error("Failed to load profile data");
      setLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/students/me/", newSkill);
      if (res.status === 201) {
        toast.success("Skill added successfully!");
        setShowModal(false); 
        setNewSkill({ name: '', percentage: 80, color: '#00b4d8' }); 
        fetchProfileData(); // Refresh the list from the database
      }
    } catch (err) {
      toast.error("Failed to add skill. Check console for errors.");
      console.log(err.response?.data);
    }
  };

  const handleLogout = async () => {
    try {
      const access = localStorage.getItem("accessToken");
      const refresh = localStorage.getItem("refreshToken");

      const res = await axios.post(
        "http://localhost:8000/api/v1/auth/logout/",
        { "refresh_token": refresh },
        { headers: { Authorization: `Bearer ${access}` } }
      );

      if (res.status === 200 || res.status === 205) {
        localStorage.clear(); // Clear all user data
        navigate("/login");
        toast.success("Logout Successful");
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      toast.error("Logout failed!");
    }
  };

  // --- HELPERS ---
  const getInitials = (name) => {
    if (!name) return "U";
    return name.trim().split(/\s+/).slice(0, 2).map(word => word[0].toUpperCase()).join("");
  };

  if (loading) {
    return <div className="loading-screen">🚀 Connecting to UniGuide Database...</div>;
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
              <h2 className="profile-name">{displayUser?.full_name}</h2>
              <p className="profile-email">{displayUser?.email}</p>
              <div className="badge-row">
                <span className="badge-pill">Computer Science</span>
                <span className="badge-pill">3rd Year</span>
                <span className="badge-pill orange">Pro Member</span>
              </div>
            </div>

            <div className="profile-actions">
              <button className="edit-btn">Edit Profile</button>
              <button onClick={handleLogout} className="logout-btn">Log out</button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row mb-3">
          <div className="stat-card">
            <div className="stat-number teal">{profileData?.applications?.length || 0}</div>
            <div className="stat-label">Applications</div>
          </div>
          <div className="stat-card">
            <div className="stat-number orange">5</div>
            <div className="stat-label">Interviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-number green">3</div>
            <div className="stat-label">Offers</div>
          </div>
          <div className="stat-card">
            <div className="stat-number purple">87%</div>
            <div className="stat-label">Profile Score</div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="profile-card mb-3">
          <div className="section-header">
            <span className="section-title">Skills</span>
            <button className="edit-btn" onClick={() => setShowModal(true)}>+ Add</button>
          </div>
          <div className="skills-list">
            {profileData?.skills?.length > 0 ? (
              profileData.skills.map((skill, index) => (
                <div key={index} className="skill-item">
                  <div className="skill-meta">
                    <span>{skill.name}</span>
                    <span>{skill.percentage}%</span>
                  </div>
                  <div className="skill-bar-bg">
                    <div className="skill-bar-fill"
                      style={{ 
                        width: `${skill.percentage}%`, 
                        background: skill.color || '#00b4d8' 
                      }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-text">No skills added yet.</p>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="profile-card mb-3">
          <div className="section-header">
            <span className="section-title">Recent Applications</span>
            <a href="#" className="view-all">View all</a>
          </div>
          <div className="app-list">
            {profileData?.applications?.length > 0 ? (
              profileData.applications.map((app, index) => (
                <div key={index} className="app-item">
                  <div>
                    <div className="app-role">{app.role}</div>
                    <div className="app-company">{app.company}</div>
                  </div>
                  <span className="app-status"
                    style={{ 
                      color: app.color, 
                      background: `${app.color}1A`, 
                      border: `1px solid ${app.color}33` 
                    }}>
                    {app.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-text">No applications found.</p>
            )}
          </div>
        </div>

        {/* --- ADD SKILL MODAL --- */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Add New Skill</h3>
                <button className="close-x" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleAddSkill}>
                <div className="form-group">
                  <label>Skill Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Python, Django, AWS" 
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Proficiency (%)</label>
                  <input 
                    type="range" 
                    min="0" max="100"
                    value={newSkill.percentage}
                    onChange={(e) => setNewSkill({...newSkill, percentage: e.target.value})}
                  />
                  <span className="range-val">{newSkill.percentage}%</span>
                </div>
                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="save-btn">Add to Profile</button>
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