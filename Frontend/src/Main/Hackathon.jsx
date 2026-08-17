import { useState, useEffect } from "react";
import Navbar from '../Components/Navbar'
// Assuming Navbar is imported from your components folder
// import Navbar from "./Navbar"; 

const HACKATHONS = [
  {
    id: 1,
    title: "UniGuide AI BuildFest 2025",
    theme: "Build the Future of Education",
    status: "live",
    prize: "₹5,00,000",
    participants: 1240,
    daysLeft: 3,
    deadline: "2025-06-18",
    tags: ["AI/ML", "EdTech", "Open Source"],
    organizer: "UniGuide AI",
    mode: "Online",
    teamSize: "1–4",
    desc: "Design AI-powered tools that transform how students learn, find jobs, and grow. Use any stack — just make it impactful.",
  },
  {
    id: 2,
    title: "InternQuest Hack",
    theme: "Solving the Internship Gap",
    status: "upcoming",
    prize: "₹2,50,000",
    participants: 680,
    daysLeft: 14,
    deadline: "2025-07-01",
    tags: ["Career Tech", "Web3", "UX"],
    organizer: "TechCorp India",
    mode: "Hybrid",
    teamSize: "2–5",
    desc: "Build platforms, apps, or models that help students land internships faster, smarter, and more equitably.",
  },
  {
    id: 3,
    title: "StudyAbroad Hackathon",
    theme: "Bridging Borders with Tech",
    status: "upcoming",
    prize: "₹1,50,000",
    participants: 310,
    daysLeft: 21,
    deadline: "2025-07-08",
    tags: ["Global", "NLP", "Accessibility"],
    organizer: "EduWorld Foundation",
    mode: "Online",
    teamSize: "1–3",
    desc: "Create solutions that make studying abroad accessible — from visa guidance to scholarship discovery using AI.",
  },
  {
    id: 4,
    title: "ResumeAI Sprint",
    theme: "Reinventing the Resume",
    status: "ended",
    prize: "₹75,000",
    participants: 892,
    daysLeft: 0,
    deadline: "2025-05-01",
    tags: ["NLP", "Design", "Recruitment"],
    organizer: "HireIQ Labs",
    mode: "Online",
    teamSize: "1–4",
    desc: "Winners built an AI resume scorer and a dynamic portfolio generator. See the results and learn from the best.",
  },
];

const LEADERBOARD = [
  { rank: 1, team: "NeuralNomads", score: 980, college: "IIT Bombay", badge: "🥇" },
  { rank: 2, team: "ByteBuilders", score: 940, college: "BITS Pilani", badge: "🥈" },
  { rank: 3, team: "CodeCraft", score: 910, college: "NIT Trichy", badge: "🥉" },
  { rank: 4, team: "AlgoAces", score: 870, college: "VIT Vellore", badge: "⭐" },
  { rank: 5, team: "DevDynamos", score: 840, college: "Manipal University", badge: "⭐" },
];

const STATUS_COLORS = {
  live: { bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.5)", text: "#34d399", dot: "#34d399" },
  upcoming: { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.4)", text: "#fbbf24", dot: "#fbbf24" },
  ended: { bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.25)", text: "#94a3b8", dot: "#64748b" },
};

function CountdownTimer({ daysLeft }) {
  const [time, setTime] = useState({ h: 8, m: 42, s: 17 });
  useEffect(() => {
    const t = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {[["D", daysLeft], ["H", time.h], ["M", time.m], ["S", time.s]].map(([label, val]) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div style={{
            background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
            borderRadius: 6, padding: "3px 7px", fontFamily: "'JetBrains Mono', monospace",
            fontSize: 15, fontWeight: 700, color: "#a5b4fc", minWidth: 32
          }}>{pad(val)}</div>
          <div style={{ fontSize: 9, color: "#64748b", marginTop: 2, letterSpacing: 1 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function HackathonCard({ h, onRegister }) {
  const sc = STATUS_COLORS[h.status];
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(30,41,59,0.95)" : "rgba(15,23,42,0.85)",
        border: hovered ? `1px solid rgba(99,102,241,0.5)` : "1px solid rgba(51,65,85,0.6)",
        borderRadius: 16, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 14,
        transition: "all 0.25s ease", cursor: "pointer",
        boxShadow: hovered ? "0 8px 40px rgba(99,102,241,0.12)" : "0 2px 12px rgba(0,0,0,0.3)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        position: "relative", overflow: "hidden"
      }}
    >
      {hovered && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, #6366f1, #22d3ee, #6366f1)",
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
            <span style={{ color: "#64748b", fontSize: 11 }}>{h.mode}</span>
          </div>
          <div style={{ color: "#f1f5f9", fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>{h.title}</div>
          <div style={{ color: "#6366f1", fontSize: 12, marginTop: 3, fontStyle: "italic" }}>"{h.theme}"</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ color: "#fbbf24", fontSize: 20, fontWeight: 800 }}>{h.prize}</div>
          <div style={{ color: "#64748b", fontSize: 11 }}>Prize Pool</div>
        </div>
      </div>

      <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>{h.desc}</div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {h.tags.map((t) => (
          <span key={t} style={{
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
            color: "#a5b4fc", borderRadius: 6, padding: "3px 9px", fontSize: 11
          }}>{t}</span>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#22d3ee", fontSize: 15, fontWeight: 700 }}>{h.participants.toLocaleString()}</div>
            <div style={{ color: "#64748b", fontSize: 10 }}>Participants</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#a5b4fc", fontSize: 15, fontWeight: 700 }}>{h.teamSize}</div>
            <div style={{ color: "#64748b", fontSize: 10 }}>Team Size</div>
          </div>
        </div>
        {h.status === "live" && <CountdownTimer daysLeft={h.daysLeft} />}
        {h.status === "upcoming" && (
          <div style={{ color: "#fbbf24", fontSize: 12 }}>Starts in <strong>{h.daysLeft} days</strong></div>
        )}
        {h.status === "ended" && (
          <div style={{ color: "#64748b", fontSize: 12 }}>Ended • {h.deadline}</div>
        )}
      </div>

      {h.status !== "ended" && (
        <button
          onClick={() => onRegister(h)}
          style={{
            background: h.status === "live"
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "rgba(99,102,241,0.15)",
            border: h.status === "live" ? "none" : "1px solid rgba(99,102,241,0.4)",
            color: h.status === "live" ? "#fff" : "#a5b4fc",
            borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 600,
            cursor: "pointer", width: "100%", marginTop: 4, transition: "all 0.2s",
            letterSpacing: 0.5
          }}
        >
          {h.status === "live" ? "🚀 Register Now" : "📋 Pre-Register"}
        </button>
      )}
      {h.status === "ended" && (
        <button style={{
          background: "rgba(51,65,85,0.4)", border: "1px solid rgba(51,65,85,0.6)",
          color: "#64748b", borderRadius: 10, padding: "10px 0", fontSize: 13,
          cursor: "default", width: "100%", marginTop: 4
        }}>View Results</button>
      )}
    </div>
  );
}

function RegisterModal({ hackathon, onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ teamName: "", role: "", idea: "" });
  const [submitted, setSubmitted] = useState(false);

  if (!hackathon) return null;

  const handleSubmit = () => {
    if (!form.teamName || !form.role) return;
    setSubmitted(true);
    setTimeout(() => { onClose(); setSubmitted(false); setStep(1); }, 2500);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(145deg, #0f172a, #1e293b)",
          border: "1px solid rgba(99,102,241,0.4)",
          borderRadius: 20, padding: 32, width: "90%", maxWidth: 480,
          boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)"
        }}
      >
        {submitted ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
            <div style={{ color: "#34d399", fontSize: 20, fontWeight: 700 }}>You're Registered!</div>
            <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 8 }}>
              Check your email for confirmation details. Good luck, {form.teamName || "Champion"}!
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700 }}>Register for Hackathon</div>
                <div style={{ color: "#6366f1", fontSize: 13, marginTop: 3 }}>{hackathon.title}</div>
              </div>
              <button onClick={onClose} style={{
                background: "rgba(51,65,85,0.5)", border: "none", color: "#94a3b8",
                width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16
              }}>×</button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {[1, 2].map((s) => (
                <div key={s} style={{
                  flex: 1, height: 3, borderRadius: 3,
                  background: step >= s ? "#6366f1" : "rgba(51,65,85,0.6)",
                  transition: "background 0.3s"
                }} />
              ))}
            </div>

            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6, display: "block" }}>Team Name *</label>
                  <input value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })}
                    placeholder="e.g. NeuralNomads"
                    style={{
                      width: "100%", background: "rgba(30,41,59,0.8)", border: "1px solid rgba(51,65,85,0.8)",
                      borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 14,
                      outline: "none", boxSizing: "border-box"
                    }} />
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6, display: "block" }}>Your Role *</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    style={{
                      width: "100%", background: "rgba(30,41,59,0.8)", border: "1px solid rgba(51,65,85,0.8)",
                      borderRadius: 10, padding: "10px 14px", color: form.role ? "#f1f5f9" : "#64748b",
                      fontSize: 14, outline: "none", boxSizing: "border-box"
                    }}>
                    <option value="">Select your role</option>
                    <option>Frontend Developer</option>
                    <option>Backend Developer</option>
                    <option>ML Engineer</option>
                    <option>UI/UX Designer</option>
                    <option>Full Stack Developer</option>
                    <option>Data Scientist</option>
                  </select>
                </div>
                <button onClick={() => { if (form.teamName && form.role) setStep(2); }}
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none", color: "#fff", borderRadius: 10, padding: "12px",
                    fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8
                  }}>Continue →</button>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6, display: "block" }}>Project Idea (Optional)</label>
                  <textarea value={form.idea} onChange={(e) => setForm({ ...form, idea: e.target.value })}
                    placeholder="Briefly describe your project concept..."
                    rows={4}
                    style={{
                      width: "100%", background: "rgba(30,41,59,0.8)", border: "1px solid rgba(51,65,85,0.8)",
                      borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 14,
                      outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit"
                    }} />
                </div>
                <div style={{
                  background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: 10, padding: "12px 16px"
                }}>
                  <div style={{ color: "#34d399", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>✓ Registration Summary</div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>Team: <span style={{ color: "#f1f5f9" }}>{form.teamName}</span></div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>Role: <span style={{ color: "#f1f5f9" }}>{form.role}</span></div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>Event: <span style={{ color: "#f1f5f9" }}>{hackathon.title}</span></div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep(1)} style={{
                    background: "rgba(51,65,85,0.4)", border: "1px solid rgba(51,65,85,0.6)",
                    color: "#94a3b8", borderRadius: 10, padding: "12px", flex: 1,
                    fontSize: 14, cursor: "pointer"
                  }}>← Back</button>
                  <button onClick={handleSubmit} style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none", color: "#fff", borderRadius: 10, padding: "12px", flex: 2,
                    fontSize: 14, fontWeight: 600, cursor: "pointer"
                  }}>🚀 Confirm Registration</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function HackathonPage() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("hackathons");

  const filtered = HACKATHONS.filter((h) => filter === "all" || h.status === filter);

  const stats = [
    { label: "Active Hackathons", value: "2", color: "#34d399" },
    { label: "Total Prize Pool", value: "₹9.75L", color: "#fbbf24" },
    { label: "Participants", value: "3,122", color: "#22d3ee" },
    { label: "Your Rank", value: "#42", color: "#a5b4fc" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #020817 0%, #0c1628 50%, #020817 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#f1f5f9"
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } 
        ::-webkit-scrollbar-track { background: #020817; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 3px; }
        input, select, textarea { color-scheme: dark; }
        @media (max-width: 640px) {
          .hk-hero { padding: 40px 16px 32px !important; }
          .hk-tabs { padding: 0 16px 20px !important; }
          .hk-content { padding: 24px 16px !important; }
          .hk-hero-grid { max-width: 100% !important; }
          .hk-stats-cell { padding: 12px 8px !important; }
          .hk-bar { width: 56px !important; }
        }
        @media (max-width: 420px) {
          .hk-stat-value { font-size: 18px !important; }
          .hk-card { padding: 18px 16px !important; }
        }
      `}</style>

      {/* Replaced old navbar content with Navbar component */}
      <Navbar />

      <div className="hk-hero" style={{
        padding: "60px 40px 40px",
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)",
        textAlign: "center", animation: "fadeIn 0.6s ease"
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: 20, padding: "6px 16px", fontSize: 12, color: "#a5b4fc", marginBottom: 20
        }}>
          <span style={{ animation: "pulse 2s infinite", display: "inline-block" }}>🔴</span>
          2 Hackathons Live Right Now
        </div>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, margin: "0 0 12px",
          background: "linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 50%, #22d3ee 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2
        }}>
          Hackathons & Challenges
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 16, maxWidth: 500, margin: "0 auto 32px" }}>
          Compete, build, and win. Find hackathons matched to your skills and career goals.
        </p>

        <div className="hk-hero-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12,
          maxWidth: 700, margin: "0 auto"
        }}>
          {stats.map((s) => (
            <div key={s.label} className="hk-stats-cell" style={{
              background: "rgba(15,23,42,0.7)", border: "1px solid rgba(51,65,85,0.5)",
              borderRadius: 12, padding: "16px 10px"
            }}>
              <div className="hk-stat-value" style={{ color: s.color, fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="hk-tabs" style={{
        display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap",
        padding: "0 40px 24px", borderBottom: "1px solid rgba(51,65,85,0.4)"
      }}>
        {[
          { id: "hackathons", label: "🏆 Hackathons" },
          { id: "leaderboard", label: "📊 Leaderboard" },
          { id: "mytasks", label: "📋 My Tasks" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "rgba(99,102,241,0.2)" : "transparent",
            border: activeTab === tab.id ? "1px solid rgba(99,102,241,0.5)" : "1px solid transparent",
            color: activeTab === tab.id ? "#a5b4fc" : "#64748b",
            borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s"
          }}>{tab.label}</button>
        ))}
      </div>

      <div className="hk-content" style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>
        {activeTab === "hackathons" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
              {["all", "live", "upcoming", "ended"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  background: filter === f ? "rgba(99,102,241,0.25)" : "rgba(15,23,42,0.6)",
                  border: filter === f ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(51,65,85,0.5)",
                  color: filter === f ? "#a5b4fc" : "#64748b",
                  borderRadius: 8, padding: "7px 16px", fontSize: 12,
                  cursor: "pointer", fontWeight: 600, textTransform: "capitalize", transition: "all 0.2s"
                }}>{f === "all" ? `All (${HACKATHONS.length})` : f}</button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {filtered.map((h) => (
                <div key={h.id} style={{ animation: "fadeIn 0.5s ease" }}>
                  <HackathonCard h={h} onRegister={setSelected} />
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "leaderboard" && (
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700 }}>Global Leaderboard</div>
              <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>UniGuide AI BuildFest 2025 · Live Rankings</div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
              {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((entry, idx) => {
                const heights = [80, 110, 65];
                const colors = ["#94a3b8", "#fbbf24", "#cd7f32"];
                return (
                  <div key={entry.rank} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 8, animation: idx === 1 ? "float 3s ease infinite" : "none" }}>{entry.badge}</div>
                    <div style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600 }}>{entry.team}</div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>{entry.college}</div>
                    <div className="hk-bar" style={{
                      marginTop: 8, height: heights[idx],
                      background: `linear-gradient(to top, ${colors[idx]}30, ${colors[idx]}15)`,
                      border: `1px solid ${colors[idx]}50`,
                      borderRadius: "8px 8px 0 0", display: "flex", alignItems: "flex-start",
                      justifyContent: "center", paddingTop: 8,
                      width: 80
                    }}>
                      <span style={{ color: colors[idx], fontWeight: 800, fontSize: 15 }}>{entry.score}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              background: "rgba(15,23,42,0.7)", border: "1px solid rgba(51,65,85,0.5)", borderRadius: 16, overflow: "hidden"
            }}>
              {LEADERBOARD.map((entry, i) => (
                <div key={entry.rank} style={{
                  display: "flex", alignItems: "center", padding: "16px 24px", flexWrap: "wrap", gap: 8,
                  borderBottom: i < LEADERBOARD.length - 1 ? "1px solid rgba(51,65,85,0.3)" : "none",
                  background: i === 0 ? "rgba(251,191,36,0.04)" : "transparent",
                  transition: "background 0.2s"
                }}>
                  <div style={{ width: 40, color: "#64748b", fontWeight: 700, fontSize: 14 }}>#{entry.rank}</div>
                  <div style={{ fontSize: 20, width: 36 }}>{entry.badge}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 600 }}>{entry.team}</div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>{entry.college}</div>
                  </div>
                  <div style={{
                    background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                    color: "#a5b4fc", borderRadius: 8, padding: "4px 12px", fontSize: 14, fontWeight: 700
                  }}>{entry.score}</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: 20, color: "#64748b", fontSize: 12 }}>
              Your rank: <span style={{ color: "#6366f1", fontWeight: 700 }}>#42</span> · Keep building to climb higher 🚀
            </div>
          </div>
        )}

        {activeTab === "mytasks" && (
          <div style={{ maxWidth: 650, margin: "0 auto" }}>
            <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Your Hackathon Journey</div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 28 }}>Track registrations, submissions & deadlines</div>

            {[
              { title: "UniGuide AI BuildFest 2025", status: "Registered", step: 2, total: 4, color: "#6366f1", steps: ["Registered", "Team Formed", "Submit Project", "Judging"] },
              { title: "InternQuest Hack", status: "Pre-Registered", step: 1, total: 4, color: "#fbbf24", steps: ["Pre-Registered", "Registration Open", "Submit Project", "Results"] },
            ].map((task) => (
              <div key={task.title} style={{
                background: "rgba(15,23,42,0.7)", border: "1px solid rgba(51,65,85,0.5)",
                borderRadius: 16, padding: 24, marginBottom: 16
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 15 }}>{task.title}</div>
                    <div style={{ color: task.color, fontSize: 12, marginTop: 3 }}>{task.status}</div>
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{task.step}/{task.total} steps</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {task.steps.map((s, i) => (
                    <div key={s} style={{ flex: 1, position: "relative" }}>
                      <div style={{
                        height: 3, borderRadius: 3,
                        background: i < task.step ? task.color : "rgba(51,65,85,0.6)"
                      }} />
                      <div style={{ color: i < task.step ? task.color : "#64748b", fontSize: 9, marginTop: 5, textAlign: "center" }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{
              background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)",
              borderRadius: 14, padding: 20, marginTop: 8
            }}>
              <div style={{ color: "#34d399", fontWeight: 600, marginBottom: 8, fontSize: 14 }}>💡 AI Tip for You</div>
              <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>
                Based on your Python (85%) and ML (60%) skills, you have a strong profile for the <strong style={{ color: "#f1f5f9" }}>UniGuide AI BuildFest</strong>. 
                Consider building an AI-powered feature that aligns with your React expertise too!
              </div>
            </div>
          </div>
        )}
      </div>

      {selected && <RegisterModal hackathon={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}