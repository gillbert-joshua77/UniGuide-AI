import { useState, useEffect } from "react";
import Navbar from '../Components/Navbar'
import axiosInstance from '../Utils/axiosInstance'

const STATUS_COLORS = {
  open: { bg: "var(--status-success-soft)", border: "var(--status-success-border)", text: "var(--color-success)", dot: "var(--color-success)" },
  upcoming: { bg: "var(--status-warning-soft)", border: "var(--status-warning-border)", text: "var(--color-secondary)", dot: "var(--color-secondary)" },
  ended: { bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.25)", text: "var(--text-muted)", dot: "var(--text-muted)" },
};

function HackathonCard({ h }) {
  const sc = STATUS_COLORS[h.status];
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => h.url && window.open(h.url, '_blank', 'noopener,noreferrer')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--surface-inset)" : "var(--surface-inset)",
        border: hovered ? `1px solid rgba(99,102,241,0.5)` : "1px solid var(--border-strong)",
        borderRadius: 16, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 14,
        transition: "all 0.25s ease", cursor: "pointer",
        boxShadow: hovered ? "0 8px 40px rgba(99,102,241,0.12)" : "0 2px 12px var(--opacity-backdrop)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        position: "relative", overflow: "hidden"
      }}
    >
      {hovered && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, var(--color-tertiary), var(--color-primary), var(--color-tertiary))",
          backgroundSize: "200% 100%", animation: "shimmer 2s infinite"
        }} />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{
              background: sc.bg, border: `1px solid ${sc.border}`,
              color: sc.text, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 5
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: sc.dot,
                display: "inline-block",
                animation: h.status === "live" ? "pulse 1.5s infinite" : "none"
              }} />
              {h.status.toUpperCase()}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{h.mode}</span>
          </div>
          <div style={{ color: "var(--text-primary)", fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>{h.title}</div>
          {h.organizer && <div style={{ color: "var(--color-tertiary)", fontSize: 12, marginTop: 3 }}>{h.organizer}</div>}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ color: "var(--color-secondary)", fontSize: 20, fontWeight: 800 }}>{h.prize}</div>
          <div style={{ color: "var(--text-muted)", fontSize: 11 }}>Prize Pool</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {h.tags.map((t) => (
          <span key={t} style={{
            background: "var(--color-tertiary-soft)", border: "1px solid var(--color-tertiary-border)",
            color: "var(--color-tertiary)", borderRadius: 6, padding: "3px 9px", fontSize: 11
          }}>{t}</span>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "var(--color-primary)", fontSize: 15, fontWeight: 700 }}>{(h.participants || 0).toLocaleString()}</div>
            <div style={{ color: "var(--text-muted)", fontSize: 10 }}>Participants</div>
          </div>
          {h.deadline && (
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "var(--color-tertiary)", fontSize: 13, fontWeight: 600 }}>{h.deadline}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 10 }}>Deadline</div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); h.url && window.open(h.url, '_blank', 'noopener,noreferrer'); }}
        style={{
          background: h.status === "open"
            ? "linear-gradient(135deg, var(--color-tertiary), var(--color-tertiary-dark))"
            : "var(--color-tertiary-soft)",
          border: h.status === "open" ? "none" : "1px solid var(--color-tertiary-border)",
          color: h.status === "open" ? "var(--text-inverse)" : "var(--color-tertiary)",
          borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 600,
          cursor: "pointer", width: "100%", marginTop: 4, transition: "all 0.2s",
          letterSpacing: 0.5
        }}
      >
        View on Devpost →
      </button>
    </div>
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

  const stats = [
    { label: "Total Hackathons", value: String(hackathons.length || "—"), color: "var(--color-success)" },
    { label: "Open Now", value: String(hackathons.filter((h) => h.status === "open").length || "—"), color: "var(--color-secondary)" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--surface-page)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "var(--text-primary)"
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } 
        ::-webkit-scrollbar-track { background: var(--surface-page); }
        ::-webkit-scrollbar-thumb { background: var(--color-tertiary-border); border-radius: 3px; }
        input, select, textarea { color-scheme: dark; }
        @media (max-width: 640px) {
          .hk-hero { padding: 40px 16px 32px !important; }
          .hk-content { padding: 24px 16px !important; }
          .hk-hero-grid { max-width: 100% !important; }
          .hk-stats-cell { padding: 12px 8px !important; }
        }
        @media (max-width: 420px) {
          .hk-stat-value { font-size: 18px !important; }
          .hk-card { padding: 18px 16px !important; }
        }
      `}</style>

      <Navbar />

      <div className="hk-hero" style={{
        padding: "60px 40px 40px",
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, var(--color-tertiary-subtle) 0%, transparent 70%)",
        textAlign: "center", animation: "fadeIn 0.6s ease"
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--color-tertiary-soft)", border: "1px solid var(--color-tertiary-border)",
          borderRadius: 20, padding: "6px 16px", fontSize: 12, color: "var(--color-tertiary)", marginBottom: 20
        }}>
          <span style={{ animation: "pulse 2s infinite", display: "inline-block" }}>🔴</span>
          {hackathons.filter((h) => h.status === "open").length} Hackathons Live Right Now
        </div>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, margin: "0 0 12px",
          background: "linear-gradient(135deg, var(--text-primary) 0%, var(--color-tertiary) 50%, var(--color-primary) 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2
        }}>
          Hackathons & Challenges
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 500, margin: "0 auto 32px" }}>
          Compete, build, and win. Find hackathons matched to your skills and career goals.
        </p>

        <div className="hk-hero-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12,
          maxWidth: 700, margin: "0 auto"
        }}>
          {stats.map((s) => (
            <div key={s.label} className="hk-stats-cell" style={{
              background: "var(--surface-inset)", border: "1px solid var(--border-default)",
              borderRadius: 12, padding: "16px 10px"
            }}>
              <div className="hk-stat-value" style={{ color: s.color, fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="hk-content" style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {["all", "open", "upcoming", "ended"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? "var(--color-tertiary-soft)" : "var(--surface-inset)",
              border: filter === f ? "1px solid var(--color-tertiary-border)" : "1px solid var(--border-default)",
              color: filter === f ? "var(--color-tertiary)" : "var(--text-muted)",
              borderRadius: 8, padding: "7px 16px", fontSize: 12,
              cursor: "pointer", fontWeight: 600, textTransform: "capitalize", transition: "all 0.2s"
            }}>{f === "all" ? `All (${hackathons.length})` : f}</button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 28, marginBottom: 12, animation: "pulse 1.5s infinite" }}>⏳</div>
            Loading hackathons from Devpost...
          </div>
        )}

        {error && (
          <div style={{
            textAlign: "center", padding: "40px 20px",
            background: "var(--status-error-soft)", border: "1px solid var(--status-error-border)",
            borderRadius: 14, color: "var(--color-error)"
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Could not load hackathons</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{error}</div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div>
            No hackathons found for this filter.
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {filtered.map((h) => (
              <div key={h.id} style={{ animation: "fadeIn 0.5s ease" }}>
                <HackathonCard h={h} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
