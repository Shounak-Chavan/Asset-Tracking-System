import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, ArrowRight } from "lucide-react";
import { useAuth } from "../auth-context";

// Pexels verified CDN images — Indian bridal couture
// Hero: rich red lehenga bride (pexels-photo-13661822)
const HERO_BG = "https://images.pexels.com/photos/13661822/pexels-photo-13661822.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1400&fit=crop";

const COLLECTIONS = [
  { label: "Lehengas", count: "45 Pieces", img: "https://images.pexels.com/photos/5673602/pexels-photo-5673602.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop" },
  { label: "Sarees", count: "32 Pieces", img: "https://images.pexels.com/photos/9344398/pexels-photo-9344398.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop" },
  { label: "Anarkalis", count: "28 Pieces", img: "https://images.pexels.com/photos/12047433/pexels-photo-12047433.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop" },
  { label: "Gowns", count: "18 Pieces", img: "https://images.pexels.com/photos/9344528/pexels-photo-9344528.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop" },
];
const FEATURED = [
  { name: "Royal Maroon Bridal Lehenga", price: "₹4,500/day", rating: "4.9", left: "Only 2 left", img: "https://images.pexels.com/photos/5673602/pexels-photo-5673602.jpeg?auto=compress&cs=tinysrgb&w=500&h=667&fit=crop" },
  { name: "Golden Embroidered Saree", price: "₹2,800/day", rating: "4.7", left: null, img: "https://images.pexels.com/photos/9344398/pexels-photo-9344398.jpeg?auto=compress&cs=tinysrgb&w=500&h=667&fit=crop" },
  { name: "Dusty Rose Anarkali Suite", price: "₹3,200/day", rating: "4.8", left: null, img: "https://images.pexels.com/photos/12047433/pexels-photo-12047433.jpeg?auto=compress&cs=tinysrgb&w=500&h=667&fit=crop" },
  { name: "Ivory Bridal Gown", price: "₹5,000/day", rating: "4.9", left: "Only 3 left", img: "https://images.pexels.com/photos/8908596/pexels-photo-8908596.jpeg?auto=compress&cs=tinysrgb&w=500&h=667&fit=crop" },
];
const TRENDING = [
  { label: "TRENDING", name: "Royal Velvet Lehenga", sub: "Most rented this season", img: "https://images.pexels.com/photos/13661822/pexels-photo-13661822.jpeg?auto=compress&cs=tinysrgb&w=700&h=875&fit=crop" },
  { label: "NEW ARRIVALS", name: "Designer Sarees", sub: "Perfect for reception", img: "https://images.pexels.com/photos/9418765/pexels-photo-9418765.jpeg?auto=compress&cs=tinysrgb&w=700&h=875&fit=crop" },
  { label: "EDITOR'S PICK", name: "Indo-Western Gowns", sub: "Modern bride's choice", img: "https://images.pexels.com/photos/12730873/pexels-photo-12730873.jpeg?auto=compress&cs=tinysrgb&w=700&h=875&fit=crop" },
];
const PROMISE_IMGS = [
  "https://images.pexels.com/photos/26860225/pexels-photo-26860225.jpeg?auto=compress&cs=tinysrgb&w=500&h=700&fit=crop",
  "https://images.pexels.com/photos/5673602/pexels-photo-5673602.jpeg?auto=compress&cs=tinysrgb&w=250&h=250&fit=crop",
  "https://images.pexels.com/photos/9344398/pexels-photo-9344398.jpeg?auto=compress&cs=tinysrgb&w=250&h=250&fit=crop",
  "https://images.pexels.com/photos/8908596/pexels-photo-8908596.jpeg?auto=compress&cs=tinysrgb&w=250&h=250&fit=crop",
];

function useFadeIn() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.disconnect();
        }
      },
      { threshold: 0.06 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

const fi: React.CSSProperties = {
  opacity: 0,
  transform: "translateY(28px)",
  transition: "opacity 0.7s ease, transform 0.7s ease",
};

export function HomePage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const collectionsRef = useFadeIn();
  const featuredRef = useFadeIn();
  const trendingRef = useFadeIn();
  const promiseRef = useFadeIn();
  const howRef = useFadeIn();
  const ctaRef = useFadeIn();

  return (
    <div style={{ background: "var(--color-bg-primary)", width: "100%" }}>
      <style>{`
        .hw { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
        @media (max-width: 768px) { .hw { padding: 0 16px; } }

        /* ── Hero: full-bleed background image ── */
        .hero-section {
          height: 100vh;
          min-height: 600px;
          position: relative;
          overflow: hidden;
          background-color: #1a0a0a;
        }

        /* Full-bleed background image */
        .hero-bg-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }

        /* Dark overlay — heavier on left, lighter on right */
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(15, 4, 8, 0.88) 0%,
            rgba(15, 4, 8, 0.65) 45%,
            rgba(15, 4, 8, 0.15) 100%
          );
        }

        /* Text content sits above overlay */
        .hero-left {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px 64px;
          max-width: 600px;
        }
        @media (max-width: 768px) {
          .hero-left {
            padding: 80px 24px 60px;
            max-width: 100%;
          }
          .hero-overlay {
            background: rgba(15, 4, 8, 0.72);
          }
        }

        /* Collections grid */
        .collections-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 900px) { .collections-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .collections-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }

        .collection-card {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          aspect-ratio: 3/4;
        }
        .collection-card img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .collection-card:hover img { transform: scale(1.06); }
        .collection-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(20,5,12,0.85) 0%, transparent 55%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px 16px;
        }

        /* Featured grid */
        .featured-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1024px) { .featured-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .featured-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }

        .featured-card {
          border-radius: 12px;
          overflow: hidden;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .featured-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
          border-color: var(--color-border-strong);
        }
        .featured-card-img {
          width: 100%;
          aspect-ratio: 3/4;
          object-fit: cover;
          display: block;
        }

        /* Trending grid */
        .trending-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 768px) { .trending-grid { grid-template-columns: 1fr; } }

        .trending-card {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          aspect-ratio: 4/5;
        }
        .trending-card img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .trending-card:hover img { transform: scale(1.05); }
        .trending-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(20,5,12,0.9) 0%, rgba(20,5,12,0.1) 60%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 24px 20px;
        }

        /* Promise section */
        .promise-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        @media (max-width: 768px) { .promise-section { grid-template-columns: 1fr; gap: 40px; } }

        .promise-img-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: auto auto;
          gap: 8px;
        }
        .promise-img-main {
          grid-column: 1 / 3;
          grid-row: 1 / 3;
          border-radius: 10px;
          overflow: hidden;
          aspect-ratio: 3/4;
        }
        .promise-img-main img { width: 100%; height: 100%; object-fit: cover; }
        .promise-img-thumb {
          border-radius: 8px;
          overflow: hidden;
          aspect-ratio: 1;
        }
        .promise-img-thumb img { width: 100%; height: 100%; object-fit: cover; }

        /* How it works */
        .how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 768px) { .how-grid { grid-template-columns: 1fr; } }

        .how-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 36px 28px;
          transition: border-color 0.25s ease, transform 0.25s ease;
        }
        .how-card:hover {
          border-color: var(--color-border-strong);
          transform: translateY(-4px);
        }

        /* Stat row */
        .stat-row {
          display: flex;
          justify-content: space-around;
          align-items: center;
          flex-wrap: wrap;
          gap: 32px;
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="hero-section">
        {/* Full-bleed background image */}
        <img
          src={HERO_BG}
          alt=""
          className="hero-bg-img"
          aria-hidden="true"
        />
        {/* Dark gradient overlay */}
        <div className="hero-overlay" />
        {/* Text content */}
        <div className="hero-left">
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-accent-gold)", marginBottom: 16 }}>
            Premium Bridal Couture · Pune
          </p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(56px, 7vw, 96px)", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1, marginBottom: 20, letterSpacing: "0.04em" }}>
            RIWAAYAT
          </h1>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "clamp(16px, 1.8vw, 22px)", color: "rgba(245,236,215,0.75)", marginBottom: 36, lineHeight: 1.5 }}>
            Where Tradition Meets Timeless Elegance.
          </p>
          <div style={{ display: "flex", gap: 32, marginBottom: 40, flexWrap: "wrap" }}>
            {[
              { icon: "♛", label: "RENT" },
              { icon: "✦", label: "FLAUNT" },
              { icon: "↩", label: "RETURN" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--color-accent-gold)", fontSize: 12 }}>{item.icon}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", letterSpacing: "0.2em", color: "rgba(245,236,215,0.7)" }}>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button
              className="btn-gold"
              style={{ padding: "14px 32px", fontSize: "0.7rem", letterSpacing: "0.18em" }}
              onClick={() => navigate("/assets")}
            >
              EXPLORE COLLECTION
            </button>
            <button
              className="btn-ghost"
              style={{ padding: "14px 24px", fontSize: "0.7rem", letterSpacing: "0.18em", border: "1px solid rgba(245,236,215,0.3)", color: "rgba(245,236,215,0.8)" }}
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              HOW IT WORKS
            </button>
          </div>
        </div>
      </section>

      {/* ── COLLECTIONS ── */}
      <section ref={collectionsRef as React.RefObject<HTMLElement>} style={{ ...fi, padding: "80px 0", background: "var(--color-bg-primary)" }}>
        <div className="hw">
          <p className="section-eyebrow" style={{ textAlign: "center", marginBottom: 10 }}>Curated Selection</p>
          <h2 className="heading-display" style={{ fontSize: "clamp(32px, 4vw, 48px)", textAlign: "center", marginBottom: 40 }}>Our Collections</h2>
          <div className="collections-grid">
            {COLLECTIONS.map((c) => (
              <div key={c.label} className="collection-card" onClick={() => navigate("/assets")}>
                <img src={c.img} alt={c.label} loading="lazy" />
                <div className="collection-card-overlay">
                  <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>{c.label}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "rgba(245,236,215,0.6)", letterSpacing: "0.1em" }}>{c.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PIECES ── */}
      <section ref={featuredRef as React.RefObject<HTMLElement>} style={{ ...fi, padding: "80px 0", background: "var(--color-bg-secondary)", borderTop: "1px solid var(--color-border)" }}>
        <div className="hw">
          <p className="section-eyebrow" style={{ textAlign: "center", marginBottom: 10 }}>Bestsellers</p>
          <h2 className="heading-display" style={{ fontSize: "clamp(32px, 4vw, 48px)", textAlign: "center", marginBottom: 40 }}>Featured Pieces</h2>
          <hr className="gold-divider" style={{ marginBottom: 48, maxWidth: 80, marginInline: "auto" }} />
          <div className="featured-grid">
            {FEATURED.map((item) => (
              <div key={item.name} className="featured-card" onClick={() => navigate("/assets")}>
                <div style={{ position: "relative" }}>
                  <img src={item.img} alt={item.name} className="featured-card-img" loading="lazy" />
                  {item.left && (
                    <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(20,5,12,0.85)", border: "1px solid var(--color-border)", borderRadius: 100, padding: "4px 10px", fontSize: 10, fontFamily: "var(--font-sans)", color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>
                      ● {item.left}
                    </span>
                  )}
                </div>
                <div style={{ padding: "14px 16px 18px" }}>
                  <p style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 6, lineHeight: 1.3 }}>{item.name}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-accent-gold)", fontWeight: 600 }}>{item.price}</span>
                    <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>★ {item.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRENDING ── */}
      <section ref={trendingRef as React.RefObject<HTMLElement>} style={{ ...fi, padding: "80px 0", background: "var(--color-bg-primary)" }}>
        <div className="hw">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
            <h2 className="heading-display" style={{ fontSize: "clamp(28px, 3.5vw, 42px)" }}>Trending This Season</h2>
            <button
              className="btn-ghost"
              style={{ fontSize: "0.65rem", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
              onClick={() => navigate("/assets")}
            >
              View All <ArrowRight size={13} />
            </button>
          </div>
          <div className="trending-grid">
            {TRENDING.map((item) => (
              <div key={item.name} className="trending-card" onClick={() => navigate("/assets")}>
                <img src={item.img} alt={item.name} loading="lazy" />
                <div className="trending-card-overlay">
                  <span style={{ display: "inline-block", background: "var(--color-accent-gold)", color: "var(--color-bg-primary)", fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", padding: "3px 10px", borderRadius: 100, marginBottom: 10 }}>
                    {item.label}
                  </span>
                  <p style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>{item.name}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(245,236,215,0.6)" }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR PROMISE ── */}
      <section ref={promiseRef as React.RefObject<HTMLElement>} style={{ ...fi, padding: "80px 0", background: "var(--color-bg-secondary)", borderTop: "1px solid var(--color-border)" }}>
        <div className="hw">
          <div className="promise-section">
            {/* Image collage */}
            <div className="promise-img-grid">
              <div className="promise-img-main">
                <img src={PROMISE_IMGS[0]} alt="Bridal couture" loading="lazy" />
              </div>
              {PROMISE_IMGS.slice(1).map((src, i) => (
                <div key={i} className="promise-img-thumb">
                  <img src={src} alt={`Look ${i + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
            {/* Text */}
            <div>
              <p className="section-eyebrow" style={{ marginBottom: 14 }}>Our Promise</p>
              <h2 className="heading-display" style={{ fontSize: "clamp(28px, 3.5vw, 44px)", marginBottom: 20, lineHeight: 1.2 }}>
                Crafted for <span style={{ color: "var(--color-accent-gold)" }}>Queens,</span><br />
                Affordable for All
              </h2>
              <p style={{ fontSize: 15, color: "var(--color-text-muted)", lineHeight: 1.8, marginBottom: 36 }}>
                At Riwaayat, we believe every bride deserves to wear a masterpiece on her special day. Our curated collection features designer outfits valued at ₹30,000–₹2,00,000, available for rent at a fraction of the cost.
              </p>
              {[
                { label: "Designer Partnerships", value: "50+ premium designers" },
                { label: "Outfit Value Range", value: "₹30K – ₹2L" },
                { label: "Average Savings", value: "Up to 85%" },
                { label: "Repeat Customers", value: "72%" },
              ].map((stat) => (
                <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text-muted)" }}>{stat.label}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" ref={howRef as React.RefObject<HTMLElement>} style={{ ...fi, padding: "80px 0", background: "var(--color-bg-primary)" }}>
        <div className="hw">
          <p className="section-eyebrow" style={{ textAlign: "center", marginBottom: 10 }}>Simple Process</p>
          <h2 className="heading-display" style={{ fontSize: "clamp(32px, 4vw, 48px)", textAlign: "center", marginBottom: 48 }}>Rent in 3 Simple Steps</h2>
          <div className="how-grid">
            {[
              { num: "01", icon: "🔍", title: "Browse the Catalog", desc: "Find available assets by category, search, or filter to match your needs." },
              { num: "02", icon: "📅", title: "Book & Pay Deposit", desc: "Choose your rental plan, pickup date, and secure your booking with a deposit." },
              { num: "03", icon: "📦", title: "Pick Up & Return", desc: "Admin allocates your asset. Return it when done — simple and accountable." },
            ].map((s) => (
              <div key={s.num} className="how-card">
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 48, fontWeight: 700, color: "rgba(201,169,110,0.15)", lineHeight: 1, marginBottom: 12 }}>{s.num}</p>
                <div style={{ fontSize: 28, marginBottom: 16 }}>{s.icon}</div>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 10, letterSpacing: "0.02em" }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!token && (
        <section ref={ctaRef as React.RefObject<HTMLElement>} style={{ ...fi, padding: "60px 0 80px", background: "var(--color-bg-secondary)", borderTop: "1px solid var(--color-border)" }}>
          <div className="hw" style={{ textAlign: "center" }}>
            <Crown size={28} color="var(--color-accent-gold)" strokeWidth={1.5} style={{ margin: "0 auto 20px" }} />
            <p className="section-eyebrow" style={{ marginBottom: 12 }}>Begin Your Journey</p>
            <h2 className="heading-display" style={{ fontSize: "clamp(32px, 4vw, 52px)", marginBottom: 16 }}>Wear the Legacy</h2>
            <p style={{ fontSize: 15, color: "var(--color-text-muted)", maxWidth: 440, marginInline: "auto", lineHeight: 1.7, marginBottom: 36 }}>
              Create an account and start exploring our curated collection of heritage bridal pieces.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn-gold-filled" style={{ padding: "14px 36px" }} onClick={() => navigate("/register")}>
                Create Account <ArrowRight size={14} />
              </button>
              <button className="btn-ghost" style={{ border: "1px solid var(--color-border)", padding: "14px 28px" }} onClick={() => navigate("/assets")}>
                Browse Catalog
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
