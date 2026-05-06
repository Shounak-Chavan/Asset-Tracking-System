import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, CreditCard, ShieldCheck, Users,
  Infinity, Ban, Tag, Eye, Lock, Shield, Zap,
} from 'lucide-react'

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

export function AboutPage() {
  const navigate = useNavigate()
  const missionRef = useFadeIn()
  const whatRef = useFadeIn()
  const featRef = useFadeIn()
  const valuesRef = useFadeIn()
  const ctaRef = useFadeIn()

  const whatWeDoCards = [
    {
      icon: <Calendar size={20} color="#2563eb" />,
      iconBg: '#eff6ff',
      title: 'Smart Booking',
      desc: 'Reserve assets with real-time availability and automatic conflict prevention.',
    },
    {
      icon: <CreditCard size={20} color="#d97706" />,
      iconBg: '#fef3c7',
      title: 'Transparent Payments',
      desc: 'Clear pricing, deposits, and rental charges with detailed breakdowns.',
    },
    {
      icon: <ShieldCheck size={20} color="#16a34a" />,
      iconBg: '#dcfce7',
      title: 'Conflict Prevention',
      desc: 'Automatic date blocking and overlap detection ensure no double-bookings.',
    },
    {
      icon: <Users size={20} color="#9333ea" />,
      iconBg: '#f3e8ff',
      title: 'Role-Based Control',
      desc: 'Separate interfaces for users, admins, and operational staff.',
    },
  ]

  const keyFeatures = [
    {
      icon: <Infinity size={18} color="#2563eb" />,
      title: 'End-to-End Asset Lifecycle',
      desc: 'From creation and categorization to booking, allocation, usage, and return processing.',
    },
    {
      icon: <Ban size={18} color="#2563eb" />,
      title: 'Conflict Prevention',
      desc: 'Automatic date blocking and overlap detection ensure no double-bookings.',
    },
    {
      icon: <Tag size={18} color="#2563eb" />,
      title: 'Flexible Pricing',
      desc: 'Support for multiple rental plans, deposits, and dynamic pricing models.',
    },
    {
      icon: <Eye size={18} color="#2563eb" />,
      title: 'Transparent Operations',
      desc: 'Complete audit trails, payment tracking, and status visibility for all stakeholders.',
    },
    {
      icon: <Lock size={18} color="#2563eb" />,
      title: 'Role-Based Control',
      desc: 'Separate interfaces and permissions for users, admins, and operational staff.',
    },
  ]

  const values = [
    {
      icon: <Eye size={24} color="#fff" />,
      title: 'Transparency',
      desc: 'Every booking, payment, and action is logged and visible to the right people.',
    },
    {
      icon: <Shield size={24} color="#fff" />,
      title: 'Accountability',
      desc: 'Know exactly who has what, when, and for how long. No surprises.',
    },
    {
      icon: <Zap size={24} color="#fff" />,
      title: 'Simplicity',
      desc: 'We believe powerful tools should be easy to use. No training required.',
    },
  ]

  return (
    <div style={{ background: '#fff', width: '100%' }}>
      <style>{`
        .about-wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .about-section-label {
          font-size: 11px; letter-spacing: 0.1em; font-weight: 700;
          text-transform: uppercase; color: #2563eb;
        }
        .about-what-card {
          background: white; border-radius: 14px; padding: 24px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
        }
        .about-what-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        @media (max-width: 768px) {
          .about-mission-grid { grid-template-columns: 1fr !important; }
          .about-what-grid { grid-template-columns: 1fr !important; }
          .about-values-grid { grid-template-columns: 1fr !important; }
          .about-hero-stats { flex-wrap: wrap; gap: 24px !important; }
          .about-hero-stat-divider { display: none !important; }
          .about-hero-title { font-size: 36px !important; }
          .about-cta { margin: 0 0 60px !important; border-radius: 16px !important; }
        }
      `}</style>

      {/* ── 1. Hero ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '100px', padding: '6px 16px',
            fontSize: '13px', color: 'rgba(255,255,255,0.9)',
          }}>
            ✦ Our Story
          </div>

          <h1 className="about-hero-title" style={{ fontSize: '52px', fontWeight: 800, color: '#fff', marginTop: '16px', marginBottom: 0 }}>
            About AssetFlow
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', marginTop: '12px', maxWidth: '520px', marginInline: 'auto' }}>
            Building accountable and efficient asset operations for modern teams.
          </p>

          {/* Stats row */}
          <div className="about-hero-stats" style={{ display: 'flex', gap: '48px', justifyContent: 'center', alignItems: 'center', marginTop: '48px', flexWrap: 'wrap' }}>
            {[
              { value: '500+', label: 'Assets Managed' },
              { value: '1,200+', label: 'Bookings Processed' },
              { value: '3', label: 'Years of Operation' },
              { value: '99.9%', label: 'Uptime' },
            ].map((s, i) => (
              <>
                <div key={s.value} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '6px' }}>{s.label}</span>
                </div>
                {i < 3 && (
                  <div className="about-hero-stat-divider" key={`d${i}`} style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.15)' }} />
                )}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Mission ── */}
      <section ref={missionRef as React.RefObject<HTMLElement>} style={{ ...fadeInit, background: '#fff', padding: '80px 0' }}>
        <div className="about-wrap">
          <div className="about-mission-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
            {/* Left */}
            <div>
              <p className="about-section-label">OUR MISSION</p>
              <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a', marginTop: '8px', marginBottom: 0 }}>
                Why we built AssetFlow
              </h2>
              <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.8, marginTop: '20px' }}>
                AssetFlow empowers organizations to manage shared assets with transparency, accountability, and efficiency. We believe that asset management shouldn't be complicated. Our platform simplifies the entire lifecycle—from discovery and booking to allocation, usage, and return—enabling teams to focus on what matters most.
              </p>
              <a
                href="#"
                onClick={e => { e.preventDefault(); navigate('/assets') }}
                style={{ display: 'inline-block', color: '#2563eb', fontWeight: 500, marginTop: '20px', textDecoration: 'none', fontSize: '15px' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                Learn how it works →
              </a>
            </div>

            {/* Right — quote card */}
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              borderRadius: '20px', padding: '40px 36px',
            }}>
              <div style={{ fontSize: '64px', color: '#bfdbfe', fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</div>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#1e40af', lineHeight: 1.4, marginTop: '8px' }}>
                Asset management shouldn't be complicated.
              </p>
              <p style={{ fontSize: '14px', color: '#3b82f6', marginTop: '16px' }}>— AssetFlow Team</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                {[ShieldCheck, Calendar, Users].map((Icon, i) => (
                  <div key={i} style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#2563eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} color="#fff" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. What We Do ── */}
      <section ref={whatRef as React.RefObject<HTMLElement>} style={{ ...fadeInit, background: '#f8fafc', padding: '80px 0' }}>
        <div className="about-wrap">
          <p className="about-section-label" style={{ textAlign: 'center' }}>WHAT WE DO</p>
          <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a', textAlign: 'center', marginTop: '8px', marginBottom: 0 }}>
            A complete rental platform
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', textAlign: 'center', maxWidth: '600px', marginInline: 'auto', marginTop: '12px' }}>
            AssetFlow is a comprehensive asset management platform designed for teams that need to track, book, allocate, and return shared resources. Whether you're managing equipment, vehicles, office spaces, or any other assets, our system provides end-to-end visibility and control.
          </p>

          <div className="about-what-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '48px', maxWidth: '900px', marginInline: 'auto' }}>
            {whatWeDoCards.map((c) => (
              <div key={c.title} className="about-what-card">
                <div style={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: c.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {c.icon}
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginTop: '14px', marginBottom: 0 }}>{c.title}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginTop: '6px' }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Key Features ── */}
      <section ref={featRef as React.RefObject<HTMLElement>} style={{ ...fadeInit, background: '#fff', padding: '80px 0' }}>
        <div className="about-wrap">
          <p className="about-section-label" style={{ textAlign: 'center' }}>KEY FEATURES</p>
          <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a', textAlign: 'center', marginTop: '8px', marginBottom: 0 }}>
            Built for accountability
          </h2>

          <div style={{ maxWidth: '800px', margin: '48px auto 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {keyFeatures.map((f, i) => (
              <div key={f.title} style={{
                display: 'flex', gap: '20px', alignItems: 'flex-start',
                padding: '20px 0',
                borderBottom: i < keyFeatures.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: '#eff6ff', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.icon}
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{f.title}</p>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginTop: '4px', marginBottom: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Values ── */}
      <section ref={valuesRef as React.RefObject<HTMLElement>} style={{ ...fadeInit, background: '#0f172a', padding: '80px 0' }}>
        <div className="about-wrap">
          <p style={{ fontSize: '11px', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
            OUR VALUES
          </p>
          <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#fff', textAlign: 'center', marginTop: '8px', marginBottom: 0 }}>
            What drives us
          </h2>

          <div className="about-values-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '48px' }}>
            {values.map((v) => (
              <div key={v.title} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px', padding: '32px 24px',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '14px',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {v.icon}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: '20px', marginBottom: 0 }}>{v.title}</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginTop: '10px' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. CTA Banner ── */}
      <section ref={ctaRef as React.RefObject<HTMLElement>} style={{ ...fadeInit, padding: '60px 24px 80px' }}>
        <div className="about-cta" style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
          borderRadius: '24px', padding: '64px 40px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: -80, right: -80, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -60, left: -60, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', margin: 0 }}>
              Start managing assets the right way
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', marginTop: '12px' }}>
              Join teams already using AssetFlow for accountable asset management.
            </p>
            <button
              onClick={() => navigate('/register')}
              style={{
                marginTop: '28px',
                background: '#fff', color: '#2563eb',
                border: 'none', borderRadius: '10px',
                padding: '14px 32px', fontSize: '15px', fontWeight: 600,
                cursor: 'pointer', transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              Create Free Account →
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
