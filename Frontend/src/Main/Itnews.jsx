import { useState, useEffect } from "react";
import Navbar from '../Components/Navbar'
// ─── DATA ────────────────────────────────────────────────────────────────────

const BREAKING = [
  "🔴 BREAKING: OpenAI raises $6.6B at $157B valuation — largest AI funding round ever",
  "📈 Nvidia hits $3.5T market cap, overtaking Apple as world's most valuable company",
  "🇮🇳 India's IT exports projected to hit $350B by 2026, NASSCOM reports",
  "🤖 Google DeepMind releases Gemini Ultra 2.0 with 2M token context window",
  "💼 TCS, Infosys announce 80,000 combined freshers hiring for FY26",
];

const CATEGORIES = ["All", "AI & ML", "Jobs & Hiring", "Startups", "Big Tech", "India IT", "Salaries"];

const NEWS = [
  {
    id: 1, category: "AI & ML", tag: "Hot",
    title: "Google's Gemini 2.0 Outperforms GPT-4 on 18 of 22 Benchmarks",
    summary: "DeepMind's latest model sets new records in coding, reasoning, and multimodal tasks. Developers report 40% faster inference on Google Cloud TPUs compared to previous generation.",
    time: "2 hours ago", source: "TechCrunch", readTime: "4 min",
    trend: "+12%", icon: "🤖", featured: true,
    stats: [{ label: "Benchmark Score", value: "92.4" }, { label: "vs GPT-4", value: "+18%" }],
  },
  {
    id: 2, category: "Jobs & Hiring", tag: "Trending",
    title: "Infosys Opens 45,000 Fresher Positions — Highest Since 2021",
    summary: "India's second-largest IT firm reverses its hiring freeze with massive campus recruitment drive targeting Tier-2 engineering colleges across 12 states.",
    time: "4 hours ago", source: "Economic Times", readTime: "3 min",
    trend: "+45K", icon: "💼", featured: true,
    stats: [{ label: "Openings", value: "45,000" }, { label: "Joining", value: "Q3 2025" }],
  },
  {
    id: 3, category: "Salaries", tag: "New",
    title: "AI Engineers Now Earn ₹45–90 LPA at Indian Unicorns — Survey",
    summary: "A new NASSCOM survey shows ML/AI roles command a 3x salary premium over traditional software engineering. Prompt engineers and LLM fine-tuners are in highest demand.",
    time: "6 hours ago", source: "NASSCOM", readTime: "5 min",
    trend: "↑ 3x", icon: "💰", featured: false,
    stats: [{ label: "Avg Salary", value: "₹62 LPA" }, { label: "Premium", value: "3× SWE" }],
  },
  {
    id: 4, category: "Startups", tag: "Funded",
    title: "Bangalore-Based EdTech Startup Raises $120M Series C for AI Tutoring",
    summary: "SkillPath AI secured funding from Sequoia India and Tiger Global to expand its personalized learning platform to 50 million students across Southeast Asia.",
    time: "8 hours ago", source: "Inc42", readTime: "4 min",
    trend: "$120M", icon: "🚀", featured: false,
    stats: [{ label: "Raised", value: "$120M" }, { label: "Valuation", value: "$850M" }],
  },
  {
    id: 5, category: "Big Tech", tag: "Policy",
    title: "Microsoft Mandates AI Proficiency for All 200K+ Employees by 2026",
    summary: "The Redmond giant announced all employees must complete a 40-hour AI skills certification program. GitHub Copilot usage now mandatory across all engineering teams.",
    time: "10 hours ago", source: "The Verge", readTime: "3 min",
    trend: "200K", icon: "🪟", featured: false,
    stats: [{ label: "Employees", value: "221K" }, { label: "Deadline", value: "Dec 2025" }],
  },
  {
    id: 6, category: "India IT", tag: "Report",
    title: "India Produces 1.5M CS Graduates Annually — Only 28% Are Job-Ready",
    summary: "A CRISIL study reveals a widening skill gap in India's engineering talent pool, with cloud, DevOps, and AI competencies cited as the most critical deficiencies by hiring managers.",
    time: "12 hours ago", source: "CRISIL Research", readTime: "6 min",
    trend: "28%", icon: "🇮🇳", featured: false,
    stats: [{ label: "Job-Ready", value: "28%" }, { label: "Gap", value: "72%" }],
  },
  {
    id: 7, category: "AI & ML", tag: "Research",
    title: "Anthropic's Claude 4 Scores 96% on Bar Exam, Tops Legal AI Benchmarks",
    summary: "The latest Claude model demonstrates unprecedented reasoning in legal, medical, and financial domains, raising fresh debates about professional AI licensing.",
    time: "1 day ago", source: "Anthropic Blog", readTime: "5 min",
    trend: "96%", icon: "⚖️", featured: false,
    stats: [{ label: "Bar Exam", value: "96%" }, { label: "vs Humans", value: "Top 10%" }],
  },
  {
    id: 8, category: "Jobs & Hiring", tag: "Alert",
    title: "Amazon Cuts 14,000 Roles in AWS Division — Shifts to AI-Native Teams",
    summary: "The restructuring marks a dramatic pivot toward smaller, AI-augmented engineering squads. New hires are primarily AI/ML specialists and cloud architects.",
    time: "1 day ago", source: "Bloomberg", readTime: "4 min",
    trend: "-14K", icon: "⚠️", featured: false,
    stats: [{ label: "Cuts", value: "14,000" }, { label: "New Hires", value: "AI-first" }],
  },
];

const MARKET_PULSE = [
  { label: "Nifty IT", value: "38,240", change: "+1.8%", up: true },
  { label: "TCS", value: "₹4,120", change: "+2.1%", up: true },
  { label: "Infosys", value: "₹1,890", change: "-0.4%", up: false },
  { label: "Wipro", value: "₹560", change: "+0.9%", up: true },
  { label: "HCL Tech", value: "₹1,740", change: "+1.3%", up: true },
  { label: "Tech M", value: "₹1,290", change: "-0.7%", up: false },
];

const SKILL_DEMAND = [
  { skill: "LLM Fine-tuning", demand: 94, color: "#6366f1" },
  { skill: "Cloud (AWS/GCP)", demand: 88, color: "#22d3ee" },
  { skill: "MLOps", demand: 82, color: "#a78bfa" },
  { skill: "React / Next.js", demand: 79, color: "#34d399" },
  { skill: "DevOps / K8s", demand: 74, color: "#fbbf24" },
  { skill: "Data Engineering", demand: 71, color: "#f97316" },
];

const TAG_COLORS = {
  Hot: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#f87171" },
  Trending: { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.4)", text: "#fbbf24" },
  New: { bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.35)", text: "#34d399" },
  Funded: { bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.4)", text: "#a5b4fc" },
  Policy: { bg: "rgba(34,211,238,0.1)", border: "rgba(34,211,238,0.35)", text: "#22d3ee" },
  Report: { bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.35)", text: "#c4b5fd" },
  Research: { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.35)", text: "#818cf8" },
  Alert: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#fca5a5" },
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function TickerBar() {
  const [offset, setOffset] = useState(0);
  const text = BREAKING.join("     ·     ");

  useEffect(() => {
    const id = setInterval(() => setOffset((p) => p - 1), 30);
    return () => clearInterval(id);
  }, []);

  const resetOffset = offset < -text.length * 7;
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (resetOffset) setOffset(0); }, [resetOffset]);

  return (
    <div style={{
      background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.2)",
      display: "flex", alignItems: "center", overflow: "hidden", height: 36
    }}>
      <div style={{
        background: "#ef4444", color: "#fff", padding: "0 14px", fontSize: 10,
        fontWeight: 800, letterSpacing: 2, height: "100%", display: "flex",
        alignItems: "center", flexShrink: 0, whiteSpace: "nowrap"
      }}>LIVE</div>
      <div style={{ overflow: "hidden", flex: 1, position: "relative" }}>
        <div style={{
          transform: `translateX(${offset}px)`, whiteSpace: "nowrap",
          color: "#fca5a5", fontSize: 12, fontWeight: 500, lineHeight: 1,
          willChange: "transform"
        }}>{text + "     ·     " + text}</div>
      </div>
    </div>
  );
}

function MarketBar() {
  return (
    <div style={{
      background: "rgba(15,23,42,0.9)", borderBottom: "1px solid rgba(51,65,85,0.4)",
      display: "flex", gap: 0, overflowX: "auto", padding: "0 40px"
    }}>
      {MARKET_PULSE.map((m) => (
        <div key={m.label} style={{
          padding: "10px 20px", borderRight: "1px solid rgba(51,65,85,0.3)",
          display: "flex", flexDirection: "column", gap: 2, flexShrink: 0
        }}>
          <div style={{ color: "#64748b", fontSize: 10, letterSpacing: 0.5 }}>{m.label}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</span>
            <span style={{ color: m.up ? "#34d399" : "#f87171", fontSize: 11, fontWeight: 600 }}>{m.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsCard({ article, featured }) {
  const [hovered, setHovered] = useState(false);
  const tc = TAG_COLORS[article.tag] || TAG_COLORS.New;

  if (featured) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? "rgba(30,41,59,0.98)" : "rgba(15,23,42,0.85)",
          border: hovered ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(51,65,85,0.5)",
          borderRadius: 18, padding: "28px 30px", display: "flex", flexDirection: "column", gap: 16,
          transition: "all 0.25s ease", cursor: "pointer",
          boxShadow: hovered ? "0 12px 48px rgba(99,102,241,0.15)" : "0 4px 16px rgba(0,0,0,0.3)",
          transform: hovered ? "translateY(-4px)" : "none", position: "relative", overflow: "hidden"
        }}
      >
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "linear-gradient(90deg, #6366f1, #22d3ee)",
          opacity: hovered ? 1 : 0, transition: "opacity 0.3s"
        }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0
            }}>{article.icon}</div>
            <div>
              <span style={{
                background: tc.bg, border: `1px solid ${tc.border}`, color: tc.text,
                borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, letterSpacing: 0.5
              }}>{article.tag}</span>
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>{article.category}</div>
            </div>
          </div>
          <div style={{
            background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
            color: "#34d399", borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 800,
            fontFamily: "'JetBrains Mono', monospace"
          }}>{article.trend}</div>
        </div>

        <div style={{ color: "#f1f5f9", fontSize: 19, fontWeight: 800, lineHeight: 1.35 }}>{article.title}</div>
        <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{article.summary}</div>

        <div style={{ display: "flex", gap: 16 }}>
          {article.stats.map((s) => (
            <div key={s.label} style={{
              background: "rgba(30,41,59,0.8)", border: "1px solid rgba(51,65,85,0.5)",
              borderRadius: 10, padding: "10px 16px", flex: 1, textAlign: "center"
            }}>
              <div style={{ color: "#6366f1", fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
              <div style={{ color: "#64748b", fontSize: 10, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748b" }}>
            <span>📰 {article.source}</span>
            <span>🕐 {article.time}</span>
            <span>⏱ {article.readTime} read</span>
          </div>
          <button style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
            color: "#fff", borderRadius: 8, padding: "8px 18px", fontSize: 12,
            fontWeight: 600, cursor: "pointer"
          }}>Read More →</button>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(30,41,59,0.95)" : "rgba(15,23,42,0.7)",
        border: hovered ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(51,65,85,0.4)",
        borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, cursor: "pointer",
        transition: "all 0.2s ease", transform: hovered ? "translateX(4px)" : "none"
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: "rgba(51,65,85,0.6)", border: "1px solid rgba(71,85,105,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0
      }}>{article.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <span style={{
            background: tc.bg, border: `1px solid ${tc.border}`, color: tc.text,
            borderRadius: 5, padding: "2px 7px", fontSize: 9, fontWeight: 700, letterSpacing: 0.5
          }}>{article.tag}</span>
          <span style={{ color: "#475569", fontSize: 10 }}>{article.category}</span>
          <span style={{ color: "#475569", fontSize: 10, marginLeft: "auto" }}>{article.time}</span>
        </div>
        <div style={{
          color: "#e2e8f0", fontSize: 14, fontWeight: 600, lineHeight: 1.4,
          marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden"
        }}>{article.title}</div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748b" }}>
          <span>{article.source}</span>
          <span>{article.readTime} read</span>
          <span style={{
            marginLeft: "auto", color: article.trend.startsWith("-") ? "#f87171" : "#34d399",
            fontWeight: 700, fontFamily: "'JetBrains Mono', monospace"
          }}>{article.trend}</span>
        </div>
      </div>
    </div>
  );
}

function SkillDemandChart() {
  return (
    <div style={{
      background: "rgba(15,23,42,0.7)", border: "1px solid rgba(51,65,85,0.5)",
      borderRadius: 16, padding: "22px 24px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>🔥 Skill Demand Index</div>
          <div style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>Based on 12,400 job postings · May 2025</div>
        </div>
        <span style={{
          background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)",
          color: "#a5b4fc", borderRadius: 6, padding: "3px 9px", fontSize: 10, fontWeight: 600
        }}>LIVE</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {SKILL_DEMAND.map((s, i) => (
          <div key={s.skill}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: "#cbd5e1", fontSize: 13 }}>{s.skill}</span>
              <span style={{ color: s.color, fontWeight: 700, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{s.demand}%</span>
            </div>
            <div style={{ height: 5, background: "rgba(51,65,85,0.5)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                width: `${s.demand}%`, height: "100%",
                background: `linear-gradient(90deg, ${s.color}99, ${s.color})`,
                borderRadius: 3,
                animation: `growBar 1s ${i * 0.1}s both ease-out`
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIInsightCard() {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState("Based on this week's IT market trends, your Python and ML skills align strongly with the highest-demand roles. AI Engineers with MLOps knowledge are seeing 3× salary premiums at Bangalore and Hyderabad unicorns. Consider upskilling in LLM fine-tuning to maximize your profile score from 87% to 95%+.");

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      setInsight("The IT hiring surge at TCS and Infosys targets freshers from Tier-2 colleges — your 3rd-year CS profile puts you in a prime position. Strengthen your React skills (currently 72%) to target the Frontend Developer Intern roles flooding the market this quarter. Apply to at least 3 more roles to leverage the current hiring wave.");
      setLoading(false);
    }, 1500);
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(34,211,238,0.06))",
      border: "1px solid rgba(99,102,241,0.35)", borderRadius: 16, padding: "22px 24px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "#a5b4fc", fontWeight: 700, fontSize: 15 }}>✨ AI Market Insight</div>
        <button onClick={refresh} style={{
          background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
          color: "#a5b4fc", borderRadius: 8, padding: "5px 12px", fontSize: 11,
          cursor: "pointer", fontWeight: 600
        }}>{loading ? "..." : "↻ Refresh"}</button>
      </div>
      <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.75, opacity: loading ? 0.4 : 1, transition: "opacity 0.3s" }}>
        {insight}
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        {["View Jobs →", "Update Skills →"].map((btn) => (
          <button key={btn} style={{
            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
            color: "#a5b4fc", borderRadius: 8, padding: "7px 14px", fontSize: 12,
            cursor: "pointer", fontWeight: 600
          }}>{btn}</button>
        ))}
      </div>
    </div>
  );
}

function TrendingTopics() {
  const topics = [
    { label: "#AIEngineering", count: "24.5K" },
    { label: "#IndiaIT", count: "18.2K" },
    { label: "#FresherHiring", count: "15.7K" },
    { label: "#MLOps", count: "12.1K" },
    { label: "#TechLayoffs", count: "9.8K" },
    { label: "#ClaudeAI", count: "8.3K" },
  ];
  return (
    <div style={{
      background: "rgba(15,23,42,0.7)", border: "1px solid rgba(51,65,85,0.5)",
      borderRadius: 16, padding: "22px 24px"
    }}>
      <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📊 Trending Topics</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {topics.map((t, i) => (
          <div key={t.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 12px", borderRadius: 8, cursor: "pointer",
            transition: "background 0.2s",
            background: i === 0 ? "rgba(99,102,241,0.12)" : "transparent"
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ color: "#475569", fontSize: 12, fontWeight: 700, width: 20 }}>{i + 1}</span>
              <span style={{ color: i === 0 ? "#a5b4fc" : "#cbd5e1", fontSize: 13, fontWeight: 600 }}>{t.label}</span>
            </div>
            <span style={{ color: "#64748b", fontSize: 11 }}>{t.count} posts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(251,191,36,0.06))",
      border: "1px solid rgba(249,115,22,0.3)", borderRadius: 16, padding: "22px 24px"
    }}>
      <div style={{ color: "#fb923c", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>📬 IT Market Digest</div>
      <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>
        Get AI-curated IT market news, salary trends & job alerts every morning.
      </div>
      {done ? (
        <div style={{
          background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
          borderRadius: 10, padding: "12px", textAlign: "center", color: "#34d399", fontSize: 13
        }}>✓ You're subscribed! Check your inbox.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.6)",
              borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 13,
              outline: "none", width: "100%", boxSizing: "border-box"
            }} />
          <button onClick={() => email && setDone(true)} style={{
            background: "linear-gradient(135deg, #f97316, #fbbf24)",
            border: "none", color: "#0f172a", borderRadius: 10, padding: "10px",
            fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>Subscribe Free →</button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Itnews() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarked, setBookmarked] = useState(new Set());

  const featured = NEWS.filter((n) => n.featured);
  const rest = NEWS.filter((n) => !n.featured);

  const filteredRest = rest.filter((n) => {
    const matchCat = activeCategory === "All" || n.category === activeCategory;
    const matchSearch = !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleBookmark = (id) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #020817 0%, #0c1628 60%, #020817 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#f1f5f9"
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes growBar { from{width:0} to{width:var(--w)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #020817; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.35); border-radius: 3px; }
        input { color-scheme: dark; }
        button:hover { opacity: 0.88; }
      `}</style>

      {/* Navbar Component replacing the inline nav block */}
      <Navbar />

      {/* Breaking ticker */}
      <TickerBar />

      {/* Market pulse bar */}
      <MarketBar />

      {/* Page hero */}
      <div style={{
        padding: "44px 40px 28px",
        background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(249,115,22,0.07) 0%, transparent 65%)",
        animation: "fadeIn 0.6s ease"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)",
                borderRadius: 20, padding: "5px 14px", fontSize: 11, color: "#fb923c",
                display: "flex", alignItems: "center", gap: 6, fontWeight: 600
              }}>
                <span style={{ animation: "pulse 1.5s infinite", display: "inline-block" }}>🔴</span>
                Live Updates · May 15, 2026
              </div>
            </div>
            <h1 style={{
              fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, margin: "0 0 10px",
              background: "linear-gradient(135deg, #f1f5f9 0%, #fb923c 50%, #fbbf24 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2
            }}>IT Market News</h1>
            <p style={{ color: "#94a3b8", fontSize: 15, margin: 0 }}>
              AI-curated tech industry news, market signals & career intelligence — built for students.
            </p>
          </div>

          {/* Search */}
          <div style={{ position: "relative", width: 280 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 14 }}>🔍</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news..."
              style={{
                width: "100%", background: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(51,65,85,0.6)", borderRadius: 12,
                padding: "11px 16px 11px 38px", color: "#f1f5f9", fontSize: 13, outline: "none"
              }}
            />
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setActiveCategory(c)} style={{
              background: activeCategory === c ? "rgba(249,115,22,0.2)" : "rgba(15,23,42,0.6)",
              border: activeCategory === c ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(51,65,85,0.5)",
              color: activeCategory === c ? "#fb923c" : "#64748b",
              borderRadius: 20, padding: "7px 16px", fontSize: 12,
              cursor: "pointer", fontWeight: 600, transition: "all 0.2s"
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: "0 40px 48px", maxWidth: 1300, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }}>

          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Featured label */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Featured Stories</div>
              <div style={{ flex: 1, height: 1, background: "rgba(51,65,85,0.5)" }} />
            </div>

            {/* Featured cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
              {featured.map((a) => (
                <div key={a.id} style={{ animation: "fadeIn 0.5s ease" }}>
                  <NewsCard article={a} featured />
                </div>
              ))}
            </div>

            {/* Latest label */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
              <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                Latest · {filteredRest.length} stories
              </div>
              <div style={{ flex: 1, height: 1, background: "rgba(51,65,85,0.5)" }} />
            </div>

            {/* Regular cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredRest.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "48px 0", color: "#475569"
                }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                  <div>No articles found for "{searchQuery}"</div>
                </div>
              ) : (
                filteredRest.map((a, i) => (
                  <div key={a.id} style={{ animation: `fadeIn 0.4s ${i * 0.06}s both ease` }}>
                    <div style={{ position: "relative" }}>
                      <NewsCard article={a} featured={false} />
                      <button
                        onClick={() => toggleBookmark(a.id)}
                        style={{
                          position: "absolute", top: 14, right: 14,
                          background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.5)",
                          borderRadius: 7, width: 30, height: 30, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14
                        }}
                      >{bookmarked.has(a.id) ? "🔖" : "📄"}</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Load more */}
            <button style={{
              background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.5)",
              color: "#64748b", borderRadius: 12, padding: "14px",
              fontSize: 13, cursor: "pointer", fontWeight: 600, width: "100%",
              transition: "all 0.2s"
            }}>Load More Stories ↓</button>
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 110 }}>
            <AIInsightCard />
            <SkillDemandChart />
            <TrendingTopics />
            <NewsletterBox />

            {/* Quick stats */}
            <div style={{
              background: "rgba(15,23,42,0.7)", border: "1px solid rgba(51,65,85,0.5)",
              borderRadius: 16, padding: "18px 20px"
            }}>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📅 This Week in IT</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Job Postings", value: "12.4K", up: true },
                  { label: "Avg Offer", value: "₹8.2 LPA", up: true },
                  { label: "Layoffs", value: "23K", up: false },
                  { label: "Startups Funded", value: "48", up: true },
                ].map((s) => (
                  <div key={s.label} style={{
                    background: "rgba(30,41,59,0.6)", borderRadius: 10, padding: "10px 12px"
                  }}>
                    <div style={{ color: s.up ? "#34d399" : "#f87171", fontSize: 16, fontWeight: 800 }}>{s.value}</div>
                    <div style={{ color: "#64748b", fontSize: 10, marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}