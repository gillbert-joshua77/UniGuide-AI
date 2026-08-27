import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../Utils/axiosInstance';
import PageLayout from '../Components/layout/PageLayout';
import { Button, Card, Badge, Progress, Skeleton } from '../Components/ui';
import { useAuth } from '../Context/AuthContext';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/Journey.css';

function splitList(text) {
  if (!text) return [];
  return text.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
}

export default function MyJourney() {
  const { profile, savedOpportunities, saveOpportunity, removeOpportunity } = useAuth();
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const interests = useMemo(() => splitList(profile?.interests), [profile?.interests]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [jRes, hRes] = await Promise.all([
          axiosInstance.get('/students/journey/'),
          axiosInstance.get('/uniguide/hackathons/', { params: { status: 'open' } }).catch(() => ({ data: { hackathons: [] } })),
        ]);
        if (!cancelled) {
          setJourney(jRes.data);
          setHackathons(hRes.data.hackathons || []);
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail || 'Could not load your journey.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const savedIds = useMemo(
    () => new Set(savedOpportunities.map((o) => o.opportunity_id)),
    [savedOpportunities]
  );

  const recommended = useMemo(() => {
    if (!hackathons.length || !interests.length) return hackathons.slice(0, 4);
    const matched = hackathons.filter((h) =>
      (h.tags || []).some((t) => interests.includes(String(t).toLowerCase()))
    );
    return (matched.length ? matched : hackathons).slice(0, 4);
  }, [hackathons, interests]);

  const toggleSave = async (h) => {
    setSavingId(h.id);
    try {
      if (savedIds.has(String(h.id))) {
        const saved = savedOpportunities.find((o) => o.opportunity_id === String(h.id));
        if (saved) await removeOpportunity(saved.id);
        toast.success('Removed from saved');
      } else {
        await saveOpportunity({
          opportunity_id: String(h.id),
          source: 'hackathon',
          title: h.title,
          url: h.url,
          organizer: h.organizer,
          location: h.mode,
          deadline: h.deadline,
          prize: h.prize,
        });
        toast.success('Saved to your journey');
      }
    } catch {
      toast.error('Could not update saved opportunities');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="ug-container journey-page">
          <Skeleton width="40%" height="28px" />
          <div className="journey-grid">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} height="160px" radius="lg" />)}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="ug-container journey-page">
          <Card hover={false} className="journey-error">
            <h3>Couldn&apos;t load your journey</h3>
            <p>{error}</p>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="ug-container journey-page">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0} className="journey-header">
            <div>
              <h1 className="journey-title">My Journey</h1>
              <p className="journey-subtitle">Where you&apos;re headed, based on your real profile.</p>
            </div>
            <Link to="/guidance"><Button variant="primary" size="sm">Ask AI Guide</Button></Link>
          </motion.div>

          {/* Readiness + completion */}
          <motion.div variants={fadeUp} custom={1} className="journey-grid journey-grid-2">
            <Card hover={false} className="journey-readiness">
              <span className="journey-card-label">Career Readiness</span>
              <div className="journey-readiness-value">{journey.career_readiness}%</div>
              <Progress value={journey.career_readiness} showValue={false} color="gold" />
              <p className="journey-card-note">Computed from your profile, skills and goals.</p>
            </Card>
            <Card hover={false} className="journey-readiness">
              <span className="journey-card-label">Profile Completion</span>
              <div className="journey-readiness-value">{journey.profile_completion}%</div>
              <Progress value={journey.profile_completion} showValue={false} color="ai" />
              <p className="journey-card-note">{journey.skills_count} skill{journey.skills_count === 1 ? '' : 's'} added.</p>
            </Card>
          </motion.div>

          {/* Current goals */}
          <motion.div variants={fadeUp} custom={2}>
            <Card hover={false} className="journey-section">
              <h3 className="journey-section-title">Current Goals</h3>
              {journey.current_goals ? (
                <p className="journey-goal">{journey.current_goals}</p>
              ) : (
                <p className="journey-empty">No career goal added yet. <Link to="/profile" className="journey-link">Add one in your profile</Link>.</p>
              )}
            </Card>
          </motion.div>

          {/* Skills to develop */}
          <motion.div variants={fadeUp} custom={3}>
            <Card hover={false} className="journey-section">
              <h3 className="journey-section-title">Skills to Develop</h3>
              {journey.skills_to_develop.length ? (
                <div className="journey-skill-dev">
                  {journey.skills_to_develop.map((s) => (
                    <div key={s.name} className="journey-skill-dev-item">
                      <Badge color="gold" size="sm">{s.name}</Badge>
                      <span className="journey-skill-dev-reason">{s.reason}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="journey-empty">You&apos;re covering the key skills for your interests. Keep building real projects!</p>
              )}
            </Card>
          </motion.div>

          {/* AI Insights */}
          <motion.div variants={fadeUp} custom={4}>
            <Card hover={false} className="journey-ai-insight">
              <Badge color="gold" size="sm">AI INSIGHT</Badge>
              <p>{journey.ai_insight}</p>
              <Link to="/guidance"><Button variant="ghost" size="sm">Talk to AI Guide →</Button></Link>
            </Card>
          </motion.div>

          {/* Recommended opportunities */}
          <motion.div variants={fadeUp} custom={5}>
            <Card hover={false} className="journey-section">
              <div className="journey-section-head">
                <h3 className="journey-section-title">Recommended Opportunities</h3>
                <Link to="/opportunities" className="journey-link">View all</Link>
              </div>
              {recommended.length ? (
                <div className="journey-opp-grid">
                  {recommended.map((h) => {
                    const isSaved = savedIds.has(String(h.id));
                    return (
                      <div key={h.id} className="journey-opp-card">
                        <div className="journey-opp-top">
                          <span className="journey-opp-title">{h.title}</span>
                          {h.prize && <span className="journey-opp-prize">{h.prize}</span>}
                        </div>
                        <div className="journey-opp-tags">
                          {(h.tags || []).slice(0, 3).map((t) => <Badge key={t} color="silver" size="sm">{t}</Badge>)}
                        </div>
                        <div className="journey-opp-actions">
                          <Button variant="ghost" size="sm" onClick={() => h.url && window.open(h.url, '_blank', 'noopener,noreferrer')}>Details</Button>
                          <Button
                            variant={isSaved ? 'outline' : 'primary'}
                            size="sm"
                            disabled={savingId === h.id}
                            onClick={() => toggleSave(h)}
                          >
                            {isSaved ? 'Saved' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="journey-empty">No opportunities available right now.</p>
              )}
            </Card>
          </motion.div>

          {/* Saved opportunities */}
          <motion.div variants={fadeUp} custom={6}>
            <Card hover={false} className="journey-section">
              <div className="journey-section-head">
                <h3 className="journey-section-title">Saved Opportunities</h3>
                <Badge color="muted" size="sm">{savedOpportunities.length}</Badge>
              </div>
              {savedOpportunities.length ? (
                <div className="journey-opp-grid">
                  {savedOpportunities.map((o) => (
                    <div key={o.id} className="journey-opp-card">
                      <div className="journey-opp-top">
                        <span className="journey-opp-title">{o.title}</span>
                        {o.prize && <span className="journey-opp-prize">{o.prize}</span>}
                      </div>
                      <div className="journey-opp-meta">{o.organizer}{o.deadline ? ` · ${o.deadline}` : ''}</div>
                      <div className="journey-opp-actions">
                        <Button variant="ghost" size="sm" onClick={() => o.url && window.open(o.url, '_blank', 'noopener,noreferrer')}>Open</Button>
                        <Button variant="outline" size="sm" onClick={() => removeOpportunity(o.id)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="journey-empty">No saved opportunities yet. Save hackathons from the <Link to="/opportunities" className="journey-link">Opportunities</Link> page.</p>
              )}
            </Card>
          </motion.div>

          {/* Applications */}
          <motion.div variants={fadeUp} custom={7}>
            <Card hover={false} className="journey-section">
              <h3 className="journey-section-title">Applications</h3>
              {journey.applications.length ? (
                <div className="journey-app-list">
                  {journey.applications.map((a, i) => (
                    <div key={i} className="journey-app-item">
                      <div>
                        <span className="journey-app-role">{a.role}</span>
                        <span className="journey-app-company"> · {a.company}</span>
                      </div>
                      <Badge color="ai" size="sm">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="journey-empty">No applications tracked yet.</p>
              )}
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
