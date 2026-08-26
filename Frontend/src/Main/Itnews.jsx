import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axiosInstance from "../Utils/axiosInstance";
import PageLayout from '../components/layout/PageLayout';
import { Button, Card, Badge, Input } from '../components/ui';
import { fadeUp, staggerContainer } from '../lib/motion';
import '../assets/Style/Itnews.css';

const CATEGORIES = ["All", "AI", "Software", "Cybersecurity", "Cloud", "Startups", "Jobs", "Research"];

const CATEGORY_META = {
  AI: { emoji: "🤖", color: "ai" },
  Software: { emoji: "💻", color: "gold" },
  Cybersecurity: { emoji: "🛡️", color: "danger" },
  Cloud: { emoji: "☁️", color: "ai" },
  Startups: { emoji: "🚀", color: "gold" },
  Jobs: { emoji: "💼", color: "success" },
  Research: { emoji: "🔬", color: "ai" },
};

const FALLBACK_META = { emoji: "📰", color: "silver" };

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

function Thumb({ article, size }) {
  const [failed, setFailed] = useState(false);
  const meta = CATEGORY_META[article.category] || FALLBACK_META;
  if (!article.image || failed) {
    return (
      <div className="in-thumb" style={{ width: size, height: size }}>
        <span>{meta.emoji}</span>
      </div>
    );
  }
  return <img src={article.image} onError={() => setFailed(true)} alt="" loading="lazy" className="in-thumb-img" style={{ width: size, height: size }} />;
}

function FeaturedCard({ article }) {
  const meta = CATEGORY_META[article.category] || FALLBACK_META;
  const [imgFailed, setImgFailed] = useState(false);
  const open = () => { if (article.url) window.open(article.url, "_blank", "noopener,noreferrer"); };

  return (
    <Card className="in-featured" hover onClick={open}>
      {article.image && !imgFailed ? (
        <img src={article.image} onError={() => setImgFailed(true)} alt="" loading="lazy" className="in-featured-img" />
      ) : (
        <div className="in-featured-placeholder"><span>{meta.emoji}</span></div>
      )}
      <div className="in-featured-body">
        <div className="in-featured-meta">
          <Badge color={meta.color} size="sm">{article.category}</Badge>
          <span className="in-time">{timeAgo(article.publishedAt)}</span>
        </div>
        <h3 className="in-featured-title">{article.title}</h3>
        {article.summary && <p className="in-featured-summary">{article.summary}</p>}
        <div className="in-featured-footer">
          <span className="in-featured-source">{article.source} · {article.readTime} min read</span>
          <Button variant="gold" size="sm" onClick={(e) => { e.stopPropagation(); open(); }}>Read →</Button>
        </div>
      </div>
    </Card>
  );
}

function NewsRow({ article }) {
  const meta = CATEGORY_META[article.category] || FALLBACK_META;
  const open = () => { if (article.url) window.open(article.url, "_blank", "noopener,noreferrer"); };

  return (
    <div className="in-row" onClick={open}>
      <Thumb article={article} size={56} />
      <div className="in-row-body">
        <div className="in-row-meta">
          <Badge color={meta.color} size="sm">{article.category}</Badge>
          <span className="in-row-source">{article.source}</span>
          <span className="in-time">{timeAgo(article.publishedAt)}</span>
        </div>
        <h4 className="in-row-title">{article.title}</h4>
        <span className="in-row-read">Read Original ↗</span>
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
    <Card hover={false} className="in-sidebar-card">
      <h3 className="in-sidebar-title">Top Sources</h3>
      <div className="in-sources">
        {top.map(([name, count]) => (
          <div key={name} className="in-source">
            <div className="in-source-header">
              <span className="in-source-name">{name}</span>
              <span className="in-source-count">{count}</span>
            </div>
            <div className="in-source-bar">
              <div className="in-source-fill" style={{ width: `${Math.max(6, (count / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LatestHeadlines({ articles }) {
  const latest = [...articles].sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || "")).slice(0, 6);
  if (!latest.length) return null;

  return (
    <Card hover={false} className="in-sidebar-card">
      <h3 className="in-sidebar-title">Latest Headlines</h3>
      <div className="in-headlines">
        {latest.map((a, i) => (
          <a key={a.id || i} href={a.url} target="_blank" rel="noopener noreferrer" className="in-headline">
            <span className="in-headline-num">{i + 1}</span>
            <div>
              <div className="in-headline-title">{a.title}</div>
              <div className="in-headline-source">{a.source} · {timeAgo(a.publishedAt)}</div>
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
}

function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <Card hover={false} className="in-sidebar-card in-newsletter">
      <h3 className="in-sidebar-title">IT Market Digest</h3>
      <p className="in-newsletter-desc">Get AI-curated IT market news, salary trends & job alerts every morning.</p>
      {done ? (
        <div className="in-newsletter-success">✓ You're subscribed!</div>
      ) : (
        <div className="in-newsletter-form">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="in-newsletter-input" />
          <Button variant="primary" size="sm" onClick={() => email && setDone(true)}>Subscribe Free →</Button>
        </div>
      )}
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="in-skeleton">
      <div className="in-skeleton-featured" />
      {[0, 1, 2, 3].map(i => <div key={i} className="in-skeleton-row" />)}
    </div>
  );
}

export default function Itnews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const categoryParam = activeCategory === "All" ? "all" : activeCategory.toLowerCase();
    axiosInstance.get("/uniguide/news/", { params: { category: categoryParam } })
      .then((res) => { if (!cancelled) setArticles(res.data.articles || []); })
      .catch((err) => {
        if (!cancelled) {
          setArticles([]);
          setError(err?.response?.data?.error || "Network error. Check your connection and try again.");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeCategory, reloadKey]);

  const selectCategory = (c) => { setActiveCategory(c); setLoading(true); setError(null); };
  const refresh = () => { setLoading(true); setError(null); setReloadKey(k => k + 1); };

  const filtered = articles.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return [a.title, a.summary, a.source, a.category].some(s => (s || "").toLowerCase().includes(q));
  });

  const featured = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="in-hero">
        <div className="ug-container">
          <motion.div className="in-hero-inner" variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0}>
              <Badge color="gold" size="sm">TECHNOLOGY INTELLIGENCE</Badge>
            </motion.div>
            <motion.h1 className="in-hero-title" variants={fadeUp} custom={1}>IT Market News</motion.h1>
            <motion.p className="in-hero-desc" variants={fadeUp} custom={2}>
              Real-time tech industry news, market signals & career intelligence — built for students.
            </motion.p>
            <motion.div className="in-hero-search" variants={fadeUp} custom={3}>
              <div className="in-search-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search news..." className="in-search-input" />
              </div>
              <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>↻ Refresh</Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <div className="ug-container">
        <div className="in-categories">
          {CATEGORIES.map(c => (
            <button key={c} className={`in-category ${activeCategory === c ? 'in-category-active' : ''}`} onClick={() => selectCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <section className="ug-container in-content">
        <div className="in-layout">
          <div className="in-main">
            {loading ? <LoadingSkeleton /> : error ? (
              <Card hover={false} className="in-error">
                <h3>Failed to load news</h3>
                <p>{error}</p>
                <Button variant="secondary" size="sm" onClick={refresh}>Try Again</Button>
              </Card>
            ) : (
              <>
                {featured.length > 0 && (
                  <div className="in-featured-grid">
                    {featured.map(a => <FeaturedCard key={a.id} article={a} />)}
                  </div>
                )}
                {rest.length > 0 && (
                  <div className="in-rows">
                    {rest.map((a, i) => <NewsRow key={a.id} article={a} />)}
                  </div>
                )}
                {filtered.length === 0 && (
                  <Card hover={false} className="in-empty">
                    <p>{searchQuery ? `No articles match "${searchQuery}"` : "No news available right now."}</p>
                  </Card>
                )}
              </>
            )}
          </div>

          <div className="in-sidebar">
            {!loading && !error && articles.length > 0 && <TopSources articles={articles} />}
            {!loading && !error && articles.length > 0 && <LatestHeadlines articles={articles} />}
            <NewsletterBox />
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
