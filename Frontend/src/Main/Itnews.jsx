import { useState, useEffect } from "react";
import Navbar from "../Components/Navbar";
import axiosInstance from "../Utils/axiosInstance";

// ─── DATA ────────────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "AI", "Software", "Cybersecurity", "Cloud", "Startups", "Jobs", "Research"];

const CATEGORY_META = {
  AI: { emoji: "🤖", color: "#a78bfa" },
  Software: { emoji: "💻", color: "#22d3ee" },
  Cybersecurity: { emoji: "🛡️", color: "#f87171" },
  Cloud: { emoji: "☁️", color: "#38bdf8" },
  Startups: { emoji: "🚀", color: "#fbbf24" },
  Jobs: { emoji: "💼", color: "#34d399" },
  Research: { emoji: "🔬", color: "#818cf8" },
};

const FALLBACK_META = { emoji: "📰", color: "#94a3b8" };

function timeAgo(iso) {
  if (!iso) return "recent";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "recent";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function TickerBar({ headlines }) {
  const text = headlines.length ? headlines.join("     ·     ") : "Loading the latest IT news...";
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
          display: "inline-block", whiteSpace: "nowrap",
          color: "#fca5a5", fontSize: 12, fontWeight: 500, lineHeight: 1,
          willChange: "transform", animation: "ticker 45s linear infinite", paddingTop: 12
        }}>
          <span>{text}</span><span>     ·     </span><span>{text}</span>
        </div>
      </div>
    </div>
  );
}

function Thumb({ article, size }) {
  const [failed, setFailed] = useState(false);
  const meta = CATEGORY_META[article.category] || FALLBACK_META;
  if (!article.image || failed) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 12, flexShrink: 0,
        background: `${meta.color}22`, border: `1px solid ${meta.color}44`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.48
      }}>{meta.emoji}</div>
    );
  }
  return (
    <img
      src={article.image}
      onError={() => setFailed(true)}
      alt=""
      loading="lazy"
      style={{ width: size, height: size, objectFit: "cover", borderRadius: 12, flexShrink: 0 }}
    />
  );
}

function FeaturedCard({ article }) {
  const meta = CATEGORY_META[article.category] || FALLBACK_META;
  const [hovered, setHovered] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const open = () => { if (article.url) window.open(article.url, "_blank", "noopener,noreferrer"); };

  return (
    <div
      onClick={open}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(30,41,59,0.98)" : "rgba(15,23,42,0.85)",
        border: hovered ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(51,65,85,0.5)",
        borderRadius: 18, overflow: "hidden", cursor: "pointer",
        transition: "all 0.25s ease", height: "100%",
        boxShadow: hovered ? "0 12px 48px rgba(99,102,241,0.15)" : "0 4px 16px rgba(0,0,0,0.3)",
        transform: hovered ? "translateY(-4px)" : "none", display: "flex", flexDirection: "column"
      }}
    >
      {article.image && !imgFailed ? (
        <img
          src={article.image}
          onError={() => setImgFailed(true)}
          alt=""
          loading="lazy"
          style={{ width: "100%", height: 150, objectFit: "cover", display: "block", flexShrink: 0 }}
        />
      ) : (
        <div style={{
          height: 150, flexShrink: 0,
          background: `linear-gradient(135deg, ${meta.color}2e, rgba(15,23,42,0.2))`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, position: "relative"
        }}>
          <span style={{ opacity: 0.9 }}>{meta.emoji}</span>
          <span style={{
            position: "absolute", bottom: 12, left: 18, fontSize: 10, fontWeight: 700,
            letterSpacing: 1, color: meta.color, textTransform: "uppercase"
          }}>{article.category}</span>
        </div>
      )}

      <div style={{ padding: "20px 24px 22px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            background: `${meta.color}1f`, border: `1px solid ${meta.color}55`, color: meta.color,
            borderRadius: 6, padding: "3px 9px", fontSize: 10, fontWeight: 700, letterSpacing: 0.5
          }}>{article.category}</span>
          <span style={{ color: "#64748b", fontSize: 11 }}>🕐 {timeAgo(article.publishedAt)}</span>
        </div>

        <div style={{
          color: "#f1f5f9", fontSize: 17, fontWeight: 800, lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden"
        }}>{article.title}</div>

        {article.summary && (
          <div style={{
            color: "#94a3b8", fontSize: 12.5, lineHeight: 1.65,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
          }}>{article.summary}</div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 8, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748b", flexWrap: "wrap" }}>
            <span>📰 {article.source}</span>
            <span>⏱ {article.readTime} min read</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); open(); }}
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
              color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 12,
              fontWeight: 600, cursor: "pointer"
            }}
          >Read Original →</button>
        </div>
      </div>
    </div>
  );
}

function NewsRow({ article, bookmarked, onToggleBookmark }) {
  const meta = CATEGORY_META[article.category] || FALLBACK_META;
  const [hovered, setHovered] = useState(false);
  const open = () => { if (article.url) window.open(article.url, "_blank", "noopener,noreferrer"); };

  return (
    <div
      onClick={open}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(30,41,59,0.95)" : "rgba(15,23,42,0.7)",
        border: hovered ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(51,65,85,0.4)",
        borderRadius: 14, padding: "14px 16px", display: "flex", gap: 14, cursor: "pointer",
        transition: "all 0.2s ease"
      }}
    >
      <Thumb article={article} size={56} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{
            background: `${meta.color}1f`, border: `1px solid ${meta.color}55`, color: meta.color,
            borderRadius: 5, padding: "2px 7px", fontSize: 9, fontWeight: 700, letterSpacing: 0.5
          }}>{article.category}</span>
          <span style={{ color: "#94a3b8", fontSize: 11 }}>{article.source}</span>
          <span style={{ color: "#475569", fontSize: 11, marginLeft: "auto" }}>🕐 {timeAgo(article.publishedAt)}</span>
        </div>
        <div style={{
          color: "#e2e8f0", fontSize: 14, fontWeight: 600, lineHeight: 1.4,
          marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden"
        }}>{article.title}</div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748b", alignItems: "center", flexWrap: "wrap" }}>
          <span>⏱ {article.readTime} min read</span>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(article.id); }}
            title={bookmarked ? "Remove bookmark" : "Bookmark"}
            style={{
              marginLeft: "auto", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.5)",
              borderRadius: 7, width: 28, height: 28, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13
            }}
          >{bookmarked ? "🔖" : "📑"}</button>
          <span style={{ color: hovered ? "#a5b4fc" : "#64748b", fontWeight: 600 }}>Read Original ↗</span>
        </div>
      </div>
    </div>
  );
}

function TopSources({ articles }) {
  const counts = {};
  articles.forEach((a) => { const s = a.source || "Unknown"; counts[s] = (counts[s] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!top.length) return null;
  const max = top[0][1];

  return (
    <div style={{
      background: "rgba(15,23,42,0.7)", border: "1px solid rgba(51,65,85,0.5)",
      borderRadius: 16, padding: "22px 24px"
    }}>
      <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📰 Top Sources</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {top.map(([name, count]) => (
          <div key={name}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: "#cbd5e1", fontSize: 12.5 }}>{name}</span>
              <span style={{ color: "#64748b", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{count}</span>
            </div>
            <div style={{ height: 4, background: "rgba(51,65,85,0.5)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.max(6, (count / max) * 100)}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #22d3ee)", borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LatestHeadlines({ articles }) {
  const latest = [...articles]
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, 6);
  if (!latest.length) return null;

  return (
    <div style={{
      background: "rgba(15,23,42,0.7)", border: "1px solid rgba(51,65,85,0.5)",
      borderRadius: 16, padding: "22px 24px"
    }}>
      <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>⚡ Latest Headlines</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {latest.map((a, i) => (
          <a
            key={a.id || i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", gap: 10, textDecoration: "none", padding: "9px 10px",
              borderRadius: 8, background: i === 0 ? "rgba(99,102,241,0.12)" : "transparent",
              transition: "background 0.2s"
            }}
          >
            <span style={{ color: "#475569", fontSize: 11, fontWeight: 700, width: 16, paddingTop: 1 }}>{i + 1}</span>
            <div>
              <div style={{
                color: "#cbd5e1", fontSize: 12.5, fontWeight: 600, lineHeight: 1.45,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
              }}>{a.title}</div>
              <div style={{ color: "#64748b", fontSize: 10, marginTop: 3 }}>{a.source} · {timeAgo(a.publishedAt)}</div>
            </div>
          </a>
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

function AboutFeed() {
  return (
    <div style={{
      background: "rgba(15,23,42,0.7)", border: "1px solid rgba(51,65,85,0.5)",
      borderRadius: 16, padding: "18px 20px"
    }}>
      <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>ℹ️ About this feed</div>
      <div style={{ color: "#64748b", fontSize: 11.5, lineHeight: 1.65 }}>
        Real-time tech news aggregated from global sources via NewsAPI.org and refreshed every 30 minutes. Tap any story to read the original article.
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  const pulse = { background: "rgba(51,65,85,0.4)", borderRadius: 8, animation: "pulse 1.2s ease-in-out infinite" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        height: 190, borderRadius: 18, background: "rgba(15,23,42,0.7)",
        border: "1px solid rgba(51,65,85,0.4)", padding: 24,
        display: "flex", flexDirection: "column", gap: 12
      }}>
        <div style={{ width: "35%", height: 16, ...pulse }} />
        <div style={{ width: "90%", height: 15, ...pulse }} />
        <div style={{ width: "75%", height: 15, ...pulse }} />
        <div style={{ width: "50%", height: 12, ...pulse, marginTop: 8 }} />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{
          height: 88, borderRadius: 14, background: "rgba(15,23,42,0.7)",
          border: "1px solid rgba(51,65,85,0.4)", padding: 16,
          display: "flex", gap: 14, alignItems: "center"
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, ...pulse }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ width: "30%", height: 11, ...pulse }} />
            <div style={{ width: "85%", height: 13, ...pulse }} />
            <div style={{ width: "50%", height: 11, ...pulse }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>Failed to load news</div>
      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20, maxWidth: 420, margin: "0 auto 20px" }}>{message}</div>
      <button onClick={onRetry} style={{
        background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)",
        color: "#fb923c", borderRadius: 10, padding: "10px 22px", fontSize: 13,
        fontWeight: 600, cursor: "pointer"
      }}>↻ Try Again</button>
    </div>
  );
}

function EmptyState({ message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", color: "#64748b" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
      <div style={{ color: "#94a3b8", fontSize: 14 }}>{message}</div>
      {hint && <div style={{ color: "#475569", fontSize: 12, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Itnews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [bookmarked, setBookmarked] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    const categoryParam = activeCategory === "All" ? "all" : activeCategory.toLowerCase();

    axiosInstance.get("/uniguide/news/", { params: { category: categoryParam } })
      .then((res) => {
        if (!cancelled) setArticles(res.data.articles || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setArticles([]);
          setError(
            err?.response?.data?.error ||
            (err?.response ? `Server error (${err.response.status})` : "Network error. Check your connection and try again.")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeCategory, reloadKey]);

  const selectCategory = (c) => {
    setActiveCategory(c);
    setLoading(true);
    setError(null);
  };

  const refresh = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const filtered = articles.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return [a.title, a.summary, a.source, a.category].some((s) => (s || "").toLowerCase().includes(q));
  });

  const featured = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const toggleBookmark = (id) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #020817 0%, #0c1628 60%, #020817 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#f1f5f9"
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #020817; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.35); border-radius: 3px; }
        input { color-scheme: dark; }
        button:hover { opacity: 0.88; }
        .in-layout { grid-template-columns: 1fr 320px; }
        @media (max-width: 992px) {
          .in-layout { grid-template-columns: 1fr; }
          .in-sidebar { position: static !important; }
        }
        @media (max-width: 640px) {
          .in-hero { padding: 32px 16px 24px !important; }
          .in-content { padding: 0 16px 40px !important; }
        }
      `}</style>

      {/* Navbar Component replacing the inline nav block */}
      <Navbar />

      {/* Breaking ticker */}
      <TickerBar headlines={articles.map((a) => a.title).slice(0, 5)} />

      {/* Page hero */}
      <div className="in-hero" style={{
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
                Live Updates · {today}
              </div>
            </div>
            <h1 style={{
              fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, margin: "0 0 10px",
              background: "linear-gradient(135deg, #f1f5f9 0%, #fb923c 50%, #fbbf24 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2
            }}>IT Market News</h1>
            <p style={{ color: "#94a3b8", fontSize: 15, margin: 0 }}>
              Real-time tech industry news, market signals & career intelligence — built for students.
            </p>
          </div>

          {/* Search + refresh */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: "min(280px, 100%)" }}>
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
            <button
              onClick={refresh}
              disabled={loading}
              title="Refresh news"
              style={{
                background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.6)",
                borderRadius: 12, width: 42, height: 42, cursor: loading ? "default" : "pointer",
                color: loading ? "#475569" : "#fb923c", fontSize: 16, opacity: loading ? 0.6 : 1
              }}
            >↻</button>
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => selectCategory(c)} style={{
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
      <div className="in-content" style={{ padding: "0 40px 48px", maxWidth: 1300, margin: "0 auto" }}>
        <div className="in-layout" style={{ display: "grid", gap: 28, alignItems: "start" }}>

          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <ErrorState message={error} onRetry={refresh} />
            ) : (
              <>
                {/* Featured label */}
                {featured.length > 0 && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Featured Stories</div>
                      <div style={{ flex: 1, height: 1, background: "rgba(51,65,85,0.5)" }} />
                    </div>

                    {/* Featured cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
                      {featured.map((a) => (
                        <div key={a.id} style={{ animation: "fadeIn 0.5s ease" }}>
                          <FeaturedCard article={a} />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Latest label */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: featured.length ? 8 : 0 }}>
                  <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                    Latest · {filtered.length} {filtered.length === 1 ? "story" : "stories"}
                  </div>
                  <div style={{ flex: 1, height: 1, background: "rgba(51,65,85,0.5)" }} />
                </div>

                {/* Regular cards */}
                {rest.length === 0 ? (
                  filtered.length === 0 ? (
                    <EmptyState
                      message={searchQuery ? `No articles match "${searchQuery}"` : "No news available in this category right now."}
                      hint={searchQuery ? "Try a different search term or category." : "Try another category or refresh in a few minutes."}
                    />
                  ) : (
                    <EmptyState message="You've reached the latest stories." hint="Try another category or search to explore more." />
                  )
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {rest.map((a, i) => (
                      <div key={a.id} style={{ animation: `fadeIn 0.4s ${i * 0.05}s both ease` }}>
                        <NewsRow article={a} bookmarked={bookmarked.has(a.id)} onToggleBookmark={toggleBookmark} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="in-sidebar" style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 110 }}>
            {!loading && !error && articles.length > 0 && <TopSources articles={articles} />}
            {!loading && !error && articles.length > 0 && <LatestHeadlines articles={articles} />}
            <NewsletterBox />
            <AboutFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
