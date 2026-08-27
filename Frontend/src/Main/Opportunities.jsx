import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import axiosInstance from '../Utils/axiosInstance';
import PageLayout from '../Components/layout/PageLayout';
import { Button, Card, Badge } from '../Components/ui';
import { useAuth } from '../Context/AuthContext';
import { fadeUp, staggerContainer } from '../lib/motion';
import { toast } from 'react-toastify';
import '../assets/Style/Hackathon.css';
import '../assets/Style/Opportunities.css';

const statusConfig = {
  open: { color: 'success', label: 'OPEN' },
  upcoming: { color: 'warning', label: 'UPCOMING' },
  ended: { color: 'muted', label: 'ENDED' },
};

function HackathonCard({ h, isSaved, onToggle, saving }) {
  const sc = statusConfig[h.status] || statusConfig.ended;
  return (
    <Card className="hk-card" hover onClick={() => h.url && window.open(h.url, '_blank', 'noopener,noreferrer')}>
      <div className="hk-card-top">
        <div>
          <div className="hk-card-meta">
            <Badge color={sc.color} size="sm" dot>{sc.label}</Badge>
            <span className="hk-card-mode">{h.mode}</span>
          </div>
          <h3 className="hk-card-title">{h.title}</h3>
          {h.organizer && <p className="hk-card-organizer">{h.organizer}</p>}
        </div>
        <div className="hk-card-prize">
          <span className="hk-card-prize-value">{h.prize}</span>
          <span className="hk-card-prize-label">Prize Pool</span>
        </div>
      </div>

      <div className="hk-card-tags">
        {h.tags?.map((t) => (
          <Badge key={t} color="silver" size="sm">{t}</Badge>
        ))}
      </div>

      <div className="hk-card-footer">
        <div className="hk-card-stats">
          <div className="hk-card-stat">
            <span className="hk-card-stat-value">{(h.participants || 0).toLocaleString()}</span>
            <span className="hk-card-stat-label">Participants</span>
          </div>
          {h.deadline && (
            <div className="hk-card-stat">
              <span className="hk-card-stat-value hk-card-stat-deadline">{h.deadline}</span>
              <span className="hk-card-stat-label">Deadline</span>
            </div>
          )}
        </div>
        <Button
          variant={isSaved ? 'outline' : 'primary'}
          size="sm"
          disabled={saving}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
        >
          {isSaved ? 'Saved' : 'Save'}
        </Button>
      </div>
    </Card>
  );
}

export default function Opportunities() {
  const { savedOpportunities, saveOpportunity, removeOpportunity } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [savingId, setSavingId] = useState(null);

  const savedIds = useMemo(
    () => new Set(savedOpportunities.map((o) => o.opportunity_id)),
    [savedOpportunities]
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchHackathons() {
      try {
        const { data } = await axiosInstance.get("/uniguide/hackathons/", { params: { status: "open" } });
        if (!cancelled) setHackathons(data.hackathons || []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || "Failed to load opportunities");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchHackathons();
    return () => { cancelled = true; };
  }, []);

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

  const filtered = filter === "all"
    ? hackathons
    : filter === "saved"
      ? hackathons.filter((h) => savedIds.has(String(h.id)))
      : hackathons.filter((h) => h.status === filter);

  const filters = [
    { id: 'all', label: `All (${hackathons.length})` },
    { id: 'open', label: 'Open' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ended', label: 'Ended' },
    { id: 'saved', label: `Saved (${savedOpportunities.length})` },
  ];

  return (
    <PageLayout>
      <section className="hk-hero">
        <div className="ug-container">
          <motion.div className="hk-hero-inner" variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0}>
              <Badge color="gold" size="sm">OPPORTUNITIES</Badge>
            </motion.div>
            <motion.h1 className="hk-hero-title" variants={fadeUp} custom={1}>
              Opportunities & Hackathons
            </motion.h1>
            <motion.p className="hk-hero-desc" variants={fadeUp} custom={2}>
              Real, live hackathons matched to your skills. Save the ones you love to your journey.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="ug-container hk-content">
        <div className="hk-filters">
          {filters.map(f => (
            <button
              key={f.id}
              className={`hk-filter ${filter === f.id ? 'hk-filter-active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="hk-loading">
            <div className="hk-loading-icon">⏳</div>
            <p>Loading opportunities...</p>
          </div>
        )}

        {error && (
          <Card hover={false} className="hk-error">
            <div className="hk-error-icon">⚠️</div>
            <h3>Could not load opportunities</h3>
            <p>{error}</p>
          </Card>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Card hover={false} className="hk-empty">
            <div className="hk-empty-icon">🔍</div>
            <p>{filter === 'saved' ? 'No saved opportunities yet.' : 'No opportunities found for this filter.'}</p>
          </Card>
        )}

        {!loading && !error && (
          <motion.div className="hk-grid" variants={staggerContainer} initial="hidden" animate="visible">
            {filtered.map((h) => (
              <motion.div key={h.id} variants={fadeUp}>
                <HackathonCard
                  h={h}
                  isSaved={savedIds.has(String(h.id))}
                  saving={savingId === h.id}
                  onToggle={() => toggleSave(h)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </PageLayout>
  );
}
