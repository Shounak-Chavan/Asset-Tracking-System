import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Calendar, PackageCheck, Store, Clock, ShieldCheck, Settings, Package, BookOpen, Shield } from 'lucide-react'
import { useAuth } from '../auth-context'

// ── Scroll-fade hook ──────────────────────────────────────────────────────────
function useFadeIn() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

const fadeInit: React.CSSProperties = {
  opacity: 0,
  transform: 'translateY(20px)',
  transition: 'opacity 0.5s ease, transform 0.5s ease',
}

export function HomePage() {
  const navigate = useNavigate()
  const { token } = useAuth()

  const heroRef = useRef<HTMLElement>(null)
  const howRef = useFadeIn()
  const featRef = useFadeIn()
  const testRef = useFadeIn()
  const ctaRef = useFadeIn()
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })
  }, [])

  const features = [
    { icon: <Store size={22} color="#2563eb" />, iconBg: '#eff6ff', title: 'Asset Catalog', desc: 'Browse and book from a curated catalog of shared assets across categories.' },
    { icon: <Clock size={22} color="#d97706" />, iconBg: '#fef3c7', title: 'Flexible Plans', desc: 'Choose from multiple rental durations with transparent pricing and deposit terms.' },
    { icon: <ShieldCheck size={22} color="#16a34a" />, iconBg: '#dcfce7', title: 'Secure Tracking', desc: 'Every booking, payment, and return is tracked end-to-end with full audit history.' },
    { icon: <Settings size={22} color="#9333ea" />, iconBg: '#f3e8ff', title: 'Admin Operations', desc: 'Admins can allocate assets, process returns, and manage the full lifecycle.' },
  ]

  const steps = [
    { num: '01', icon: <Search size={22} color="#2563eb" />, title: 'Browse the Catalog', desc: 'Find available assets by category, search, or filter to match your needs.' },
    { num: '02', icon: <Calendar size={22} color="#2563eb" />, title: 'Book & Pay Deposit', desc: 'Choose your rental plan, pickup date, and secure your booking with a deposit.' },
    { num: '03', icon: <PackageCheck size={22} color="#2563eb" />, title: 'Pick Up & Return', desc: 'Admin allocates your asset. Return it when done — simple and accountable.' },
  ]

  const testimonials = [
    { initials: 'HW', color: '#2563eb', name: 'Hoshang W.', role: 'Operations Lead', quote: 'AssetTrack completely changed how we manage shared equipment. No more confusion about who has what.' },
    { initials: 'RK', color: '#16a34a', name: 'Rahul K.', role: 'Facility Manager', quote: "The deposit and tracking system gives us full accountability. We've reduced losses by 80%." },
    { initials: 'PS', color: '#9333ea', name: 'Priya S.', role: 'Team Lead', quote: 'Booking an asset takes 30 seconds. The whole team adopted it immediately.' },
  ]

  return (
    <div style={{ background: '#ffffff', width: '100%' }}>
      <style>{`
        html { scroll-behavior: smooth; }
        .home-wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .section-label { font-size: 11px; letter-spacing: 0.1em; color: #2563eb; font-weight: 700; text-align: center; text-transform: uppercase; }
        @keyframes meshDrift {
          0%,100% { background-position: 0% 0%, 100% 0%, 50% 100%, 100% 50%, 0% 50%; }
          33%      { background-position: 5% 10%, 95% 5%, 55% 95%, 95% 55%, 5% 45%; }
          66%      { background-position: -5% 5%, 105% -5%, 45% 105%, 105% 45%, -5% 55%; }
        }
        .hero-mesh {
          background: linear-gradient(180deg, #eef2ff 0%, #ffffff 60%);
        }
        .hero-gradient-text {
          background: linear-gradient(135deg, #1a3a6b 0%, #00c9a7 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .btn-hero-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #1a3a6b; color: #fff; border: none;
          border-radius: 100px; padding: 14px 32px;
          font-size: 15px; font-weight: 600; cursor: pointer;
          box-shadow: 0 4px 20px rgba(26,58,107,0.25);
          transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .btn-hero-primary:hover { background: #16325e; box-shadow: 0 8px 28px rgba(26,58,107,0.35); transform: translateY(-2px); }
        .btn-hero-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: white; color: #374151; border: 1.5px solid #e5e7eb;
          border-radius: 100px; padding: 14px 28px;
          font-size: 15px; font-weight: 500; cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }
        .btn-hero-outline:hover { border-color: #1a3a6b; color: #1a3a6b; box-shadow: 0 4px 16px rgba(26,58,107,0.12); }
        @keyframes pulse-dot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
        @keyframes bounce-down { 0%,100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
        .bounce-arrow { animation: bounce-down 1.5s ease-in-out infinite; }
        .step-card { background: white; border-radius: 16px; padding: 28px; border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .feature-card { border-radius: 16px; padding: 28px 24px; border: 1px solid #f1f5f9; transition: all 0.2s ease; cursor: default; }
        .feature-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); border-color: #e0e7ff; }
        .testimonial-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; }
        @media (max-width: 768px) {
          .hero-headline { font-size: 36px !important; letter-spacing: -1px !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .stats-bar { flex-direction: column !important; gap: 24px !important; }
          .stats-divider { display: none !important; }
          .social-proof-row { flex-direction: column !important; gap: 12px !important; }
          .cta-banner { margin: 0 0 60px 0 !important; border-radius: 16px !important; }
        }
      `}</style>

      {/* ── SECTION 1: Hero ── */}
      <section
        ref={heroRef}
        style={{
          ...fadeInit,
          width: '100%',
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #eef2ff 0%, #ffffff 60%)',
          borderBottom: '1px solid rgba(26,58,107,0.08)',
          willChange: 'auto',
        }}
      >
        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 1,
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          maxWidth: '780px', margin: '0 auto', padding: '100px 24px 60px', textAlign: 'center',
        }}>
          {/* Badge pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'white', border: '1px solid #e5e7eb',
            borderRadius: '100px', padding: '7px 16px 7px 12px',
            fontSize: '13px', fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            margin: '0 auto',
          }}>
            <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c9a7', flexShrink: 0 }} />
            <span style={{ color: '#16a34a', fontWeight: 700 }}>Now live</span>
            <span style={{ color: '#374151' }}> — Asset Rental Management Platform</span>
          </div>

          {/* Hero logo mark — removed, navbar logo is sufficient */}

          {/* Headline */}
          <h1 className="hero-headline" style={{
            fontSize: '58px', fontWeight: 800, color: '#0f172a',
            lineHeight: 1.05, letterSpacing: '-2px',
            marginTop: '24px', marginBottom: 0,
          }}>
            Manage shared assets
            <br />
            <span className="hero-gradient-text">with full accountability</span>
          </h1>

          {/* Subheadline */}
          <p style={{ fontSize: '18px', color: '#64748b', lineHeight: 1.7, marginTop: '20px', maxWidth: '540px', marginInline: 'auto' }}>
            AssetTrack streamlines the entire rental lifecycle — from booking and allocation to payment and return — in one transparent platform.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '36px' }}>
            {token ? (
              <button className="btn-hero-primary" onClick={() => navigate('/assets')}>
                Browse Catalog
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            ) : (
              <>
                <button className="btn-hero-primary" onClick={() => navigate('/register')}>
                  Get Started
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className="btn-hero-outline" onClick={() => navigate('/login')}>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </>
            )}
          </div>

          {/* Social proof */}
          <div className="social-proof-row" style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center', marginTop: '40px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {[{ bg: '#2563eb', label: 'HW' }, { bg: '#16a34a', label: 'RK' }, { bg: '#9333ea', label: 'PS' }].map((a, i) => (
                  <div key={i} style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: a.bg, color: '#fff', fontSize: '11px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 0 2px white',
                    marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i, position: 'relative',
                  }}>{a.label}</div>
                ))}
              </div>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Trusted by 50+ teams</span>
            </div>
            <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#f59e0b', fontSize: '15px', letterSpacing: '1px' }}>★★★★★</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>4.9 / 5.0</span>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>(48 reviews)</span>
            </div>
          </div>

          {/* Stats bar — static */}
          <div ref={statsRef} className="stats-bar" style={{
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '20px', padding: '24px 48px',
            marginTop: '48px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            {[
              { value: '500+', label: 'Assets Managed', icon: <Package size={16} color="#1a3a6b" />, iconBg: '#e8eef7' },
              { value: '1,200+', label: 'Bookings Processed', icon: <BookOpen size={16} color="#00c9a7" />, iconBg: '#e0faf5' },
              { value: '99.9%', label: 'Uptime Guaranteed', icon: <Shield size={16} color="#1a3a6b" />, iconBg: '#e8eef7' },
            ].map((s, i) => (
              <>
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>{s.icon}</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-1px' }}>{s.value}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
                </div>
                {i < 2 && <div className="stats-divider" key={`div-${i}`} style={{ width: 1, height: 40, background: '#e5e7eb' }} />}
              </>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingBottom: 32 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>Scroll to explore</span>
          <div className="bounce-arrow">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 5l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 9l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: How It Works ── */}
      <section ref={howRef as React.RefObject<HTMLElement>} style={{ ...fadeInit, background: '#f8fafc', padding: '80px 0' }}>
        <div className="home-wrap">
          <p className="section-label">HOW IT WORKS</p>
          <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a', textAlign: 'center', marginTop: '8px', marginBottom: 0 }}>
            Rent in 3 simple steps
          </h2>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', marginTop: '48px' }}>
            {steps.map((s) => (
              <div key={s.num} className="step-card">
                <div style={{ fontSize: '48px', fontWeight: 800, color: '#dbeafe', lineHeight: 1 }}>{s.num}</div>
                <div style={{ width: 48, height: 48, background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
                  {s.icon}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0f172a', marginTop: '16px', marginBottom: 0 }}>{s.title}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginTop: '8px' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Features ── */}
      <section ref={featRef as React.RefObject<HTMLElement>} style={{ ...fadeInit, background: '#fff', padding: '80px 0' }}>
        <div className="home-wrap">
          <p className="section-label">FEATURES</p>
          <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a', textAlign: 'center', marginTop: '8px', marginBottom: 0 }}>
            Everything you need
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', textAlign: 'center', maxWidth: '500px', margin: '12px auto 0' }}>
            A complete system for teams that share physical assets and need transparent, accountable operations.
          </p>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '48px' }}>
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: f.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginTop: '16px', marginBottom: 0 }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginTop: '8px' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Testimonials ── */}
      <section ref={testRef as React.RefObject<HTMLElement>} style={{ ...fadeInit, background: '#0f172a', padding: '80px 0' }}>
        <div className="home-wrap">
          <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 0 }}>
            Why teams choose AssetTrack
          </h2>
          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '48px' }}>
            {testimonials.map((t) => (
              <div key={t.name} className="testimonial-card">
                <div style={{ color: '#fbbf24', fontSize: '14px' }}>★★★★★</div>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginTop: '12px', fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '20px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.color, color: '#fff', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: CTA Banner ── */}
      {!token && (
        <section ref={ctaRef as React.RefObject<HTMLElement>} style={{ ...fadeInit, padding: '60px 24px 80px' }}>
          <div className="cta-banner" style={{
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)',
            padding: '80px 40px', textAlign: 'center', borderRadius: '24px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: -80, right: -80, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -60, left: -60, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', fontWeight: 700, margin: 0 }}>GET STARTED TODAY</p>
              <h2 style={{ fontSize: '40px', fontWeight: 800, color: '#fff', marginTop: '12px', marginBottom: 0 }}>Ready to get started?</h2>
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', marginTop: '12px' }}>Create an account and start booking assets in minutes.</p>
              <button
                onClick={() => navigate('/register')}
                style={{ marginTop: '28px', background: '#fff', color: '#2563eb', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s ease' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                Create Free Account →
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

