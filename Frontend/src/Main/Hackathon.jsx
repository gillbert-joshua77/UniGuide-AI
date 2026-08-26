import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axiosInstance from '../Utils/axiosInstance';
import PageLayout from '../components/layout/PageLayout';
import { Button, Card, Badge } from '../components/ui';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/Hackathon.css';

const statusConfig = {
  open: { color: 'success', label: 'OPEN' },
  upcoming: { color: 'warning', label: 'UPCOMING' },
  ended: { color: 'muted', label: 'ENDED' },
};

function HackathonCard({ h }) {
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
          variant={h.status === 'open' ? 'primary' : 'outline'}
          size="sm"
          onClick={(e) => { e.stopPropagation(); h.url && window.open(h.url, '_blank', 'noopener,noreferrer'); }}
        >
          View Details →
        </Button>
      </div>
    </Card>
  );
}

export default function HackathonPage() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    async function fetchHackathons() {
      try {
        const { data } = await axiosInstance.get("/uniguide/hackathons/", {
          params: { status: "open" },
        });
        if (!cancelled) setHackathons(data.hackathons || []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || "Failed to load hackathons");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchHackathons();
    return () => { cancelled = true; };
  }, []);

  const filtered = filter === "all" ? hackathons : hackathons.filter((h) => h.status === filter);
  const filters = [
    { id: 'all', label: `All (${hackathons.length})` },
    { id: 'open', label: 'Open' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ended', label: 'Ended' },
  ];

  return (
    <PageLayout>
      {/* Hero */}
      <section className="hk-hero">
        <div className="ug-container">
          <motion.div className="hk-hero-inner" variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0}>
              <Badge color="gold" size="sm">OPPORTUNITIES</Badge>
            </motion.div>
            <motion.h1 className="hk-hero-title" variants={fadeUp} custom={1}>
              Hackathons & Challenges
            </motion.h1>
            <motion.p className="hk-hero-desc" variants={fadeUp} custom={2}>
              Compete, build, and win. Find hackathons matched to your skills and career goals.
            </motion.p>
            <motion.div className="hk-hero-stats" variants={fadeUp} custom={3}>
              <div className="hk-hero-stat">
                <span className="hk-hero-stat-value">{hackathons.length || '—'}</span>
                <span className="hk-hero-stat-label">Total</span>
              </div>
              <div className="hk-hero-stat">
                <span className="hk-hero-stat-value hk-hero-stat-open">{hackathons.filter(h => h.status === 'open').length || '—'}</span>
                <span className="hk-hero-stat-label">Open Now</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
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
            <p>Loading hackathons...</p>
          </div>
        )}

        {error && (
          <Card hover={false} className="hk-error">
            <div className="hk-error-icon">⚠️</div>
            <h3>Could not load hackathons</h3>
            <p>{error}</p>
          </Card>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Card hover={false} className="hk-empty">
            <div className="hk-empty-icon">🔍</div>
            <p>No hackathons found for this filter.</p>
          </Card>
        )}

        {!loading && !error && (
          <motion.div className="hk-grid" variants={staggerContainer} initial="hidden" animate="visible">
            {filtered.map((h) => (
              <motion.div key={h.id} variants={fadeUp}>
                <HackathonCard h={h} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </PageLayout>
  );
}
