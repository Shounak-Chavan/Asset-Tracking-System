import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, FileText, Clock, Info, AlertTriangle, AlertCircle } from 'lucide-react'

const NAV_ITEMS = [
  { num: '01', label: 'Acceptance of Terms' },
  { num: '02', label: 'User Accounts' },
  { num: '03', label: 'Booking and Payment' },
  { num: '04', label: 'Date Availability and Booking' },
  { num: '05', label: 'Asset Returns' },
  { num: '06', label: 'Liability and Damages' },
  { num: '07', label: 'Intellectual Property' },
  { num: '08', label: 'Limitation of Liability' },
  { num: '09', label: 'Modifications to Terms' },
  { num: '10', label: 'Governing Law' },
]

const SECTION_IDS = NAV_ITEMS.map((_, i) => `terms-section-${i}`)

// ── Sub-point block ──────────────────────────────────────────────────────────
function SubPoint({ label, text, first = false }: { label: string; text: string; first?: boolean }) {
  return (
    <div style={{
      borderLeft: '2px solid var(--color-border-strong)',
      paddingLeft: '14px',
      margin: first ? '0' : '12px 0',
    }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--color-accent-gold)', margin: '0 0 2px 0' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.7, margin: 0 }}>{text}</p>
    </div>
  )
}

// ── Callout banner ───────────────────────────────────────────────────────────
function Callout({ type, text }: { type: 'info' | 'warning' | 'danger'; text: string }) {
  const styles = {
    info:    { bg: 'rgba(201,169,110,0.08)', border: 'rgba(201,169,110,0.25)', color: 'var(--color-accent-gold)', icon: <Info size={16} color="var(--color-accent-gold)" /> },
    warning: { bg: 'rgba(232,180,100,0.08)', border: 'rgba(232,180,100,0.25)', color: '#E8B464', icon: <AlertTriangle size={16} color="#E8B464" /> },
    danger:  { bg: 'rgba(224,112,112,0.08)', border: 'rgba(224,112,112,0.25)', color: 'var(--color-error)', icon: <AlertCircle size={16} color="var(--color-error)" /> },
  }
  const s = styles[type]
  return (
    <div style={{
      display: 'flex', gap: '10px', alignItems: 'flex-start',
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '20px',
    }}>
      <span style={{ flexShrink: 0, marginTop: '1px' }}>{s.icon}</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: s.color, lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}

export function TermsPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState(0)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  // Intersection observer for active sidebar highlight
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    SECTION_IDS.forEach((id, i) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(i) },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  const scrollTo = (i: number) => {
    const el = document.getElementById(SECTION_IDS[i])
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── Section data (all original text preserved) ───────────────────────────
  const sections: Array<{
    title: string
    content?: string
    items?: { label: string; text: string }[]
    callout?: React.ReactNode
  }> = [
    {
      title: 'Acceptance of Terms',
      callout: <Callout type="info" text="By using AssetTrack, you agree to all terms below." />,
      content: 'By accessing and using AssetTrack, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.',
    },
    {
      title: 'User Accounts',
      items: [
        { label: 'Account Responsibility', text: 'You are responsible for maintaining the confidentiality of your account credentials and password. You agree to accept responsibility for all activities that occur under your account.' },
        { label: 'Accurate Information', text: 'You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.' },
        { label: 'Prohibited Activities', text: 'You may not use your account for any illegal or unauthorized purpose. You must comply with all laws, rules, and regulations applicable to your use of the service.' },
      ],
    },
    {
      title: 'Booking and Payment',
      items: [
        { label: 'Deposit Payment', text: 'A deposit payment is mandatory to confirm a booking. Deposits are non-refundable unless explicitly stated otherwise in the rental plan terms.' },
        { label: 'Rental Charges', text: 'Rental charges must be fully paid before a return request is allowed. Failure to pay may result in booking cancellation and asset hold.' },
        { label: 'Payment Methods', text: 'We accept various payment methods as displayed during checkout. All payments are processed securely through our payment gateway.' },
        { label: 'Pricing', text: 'Prices are subject to change without notice. The price displayed at the time of booking is the price you agree to pay.' },
      ],
    },
    {
      title: 'Date Availability and Booking',
      callout: <Callout type="warning" text="Deposits may be non-refundable depending on circumstances." />,
      items: [
        { label: 'Booking Confirmation', text: 'Once a booking is confirmed for selected dates, those dates are blocked for that asset and cannot be booked by other users.' },
        { label: 'No Overlapping Bookings', text: 'Overlapping bookings for the same asset are not permitted. The system automatically prevents double-bookings.' },
        { label: 'Booking Modifications', text: 'Booking dates can be modified subject to availability. Any changes may incur additional charges or refunds based on the new dates.' },
        { label: 'Cancellation Policy', text: "Cancellations must be made according to the rental plan's cancellation policy. Refunds, if applicable, will be processed within 7-10 business days." },
      ],
    },
    {
      title: 'Asset Returns',
      items: [
        { label: 'Return Requests', text: 'Return requests can be raised only after rent payment is complete. Incomplete payments will prevent return processing.' },
        { label: 'Late Returns', text: 'Assets must be returned by the agreed-upon date and time. Late returns may attract additional charges as per the rental plan.' },
        { label: 'Asset Condition', text: 'Assets must be returned in the same condition as received. Damage, loss, or deterioration may result in additional charges.' },
        { label: 'Damage Assessment', text: 'Our team will inspect returned assets. Damage claims will be communicated within 48 hours of return.' },
      ],
    },
    {
      title: 'Liability and Damages',
      callout: <Callout type="danger" text="Report any damages immediately to avoid additional fees." />,
      items: [
        { label: 'User Responsibility', text: 'You are responsible for the asset during the rental period. Any damage, loss, or theft must be reported immediately.' },
        { label: 'Damage Charges', text: 'Repair or replacement costs for damaged assets will be charged to the user. The amount will be determined based on the extent of damage.' },
        { label: 'Loss or Theft', text: "If an asset is lost or stolen, the full replacement cost will be charged to the user's account." },
      ],
    },
    {
      title: 'Intellectual Property Rights',
      content: 'All content, features, and functionality of AssetTrack (including but not limited to all information, software, text, displays, images, video, and audio) are owned by AssetTrack, its licensors, or other providers of such material and are protected by international copyright, trademark, and other intellectual property laws.',
    },
    {
      title: 'Limitation of Liability',
      content: 'In no event shall AssetTrack, its directors, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, arising out of or in connection with your use of the service.',
    },
    {
      title: 'Modifications to Terms',
      content: 'AssetTrack reserves the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of the service following the posting of revised terms means that you accept and agree to the changes.',
    },
    {
      title: 'Governing Law',
      content: 'These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.',
    },
  ]

  return (
    <div style={{ background: 'var(--color-bg-primary)', width: '100%' }}>
      <style>{`
        .terms-sidebar-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: var(--radius-md); cursor: pointer;
          transition: all 0.15s ease; border: none; background: none;
          width: 100%; text-align: left;
        }
        .terms-sidebar-item:hover { background: rgba(201,169,110,0.06); }
        .terms-sidebar-item:hover .terms-nav-num,
        .terms-sidebar-item:hover .terms-nav-label { color: var(--color-accent-gold); }
        .terms-sidebar-item.active {
          background: rgba(201,169,110,0.08);
          border-left: 2px solid var(--color-accent-gold);
          padding-left: 8px;
        }
        .terms-sidebar-item.active .terms-nav-num,
        .terms-sidebar-item.active .terms-nav-label {
          color: var(--color-accent-gold); font-weight: 500;
        }
        .terms-nav-num { font-size: 11px; font-weight: 700; color: var(--color-text-faint); min-width: 18px; font-family: var(--font-sans); }
        .terms-nav-label { font-size: 13px; color: var(--color-text-muted); font-family: var(--font-sans); }
        .terms-mobile-pill {
          display: none;
          overflow-x: auto; gap: 8px; padding: 16px 24px;
          background: var(--color-bg-secondary); border-bottom: 1px solid var(--color-border);
          scrollbar-width: none;
        }
        .terms-mobile-pill::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .terms-layout { grid-template-columns: 1fr !important; }
          .terms-sidebar { display: none !important; }
          .terms-mobile-pill { display: flex !important; }
          .terms-hero-title { font-size: 32px !important; }
          .terms-hero-meta { flex-wrap: wrap; gap: 12px !important; }
          .terms-card { padding: 24px 20px !important; }
        }
      `}</style>

      {/* ── 1. Hero ── */}
      <section style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '56px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p className="section-eyebrow" style={{ marginBottom: 12 }}>Legal</p>
          <h1 className="terms-hero-title" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '44px', fontWeight: 500, color: 'var(--color-text-primary)', marginTop: '0', marginBottom: 0 }}>
            Terms and Conditions
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--color-text-muted)', marginTop: '10px' }}>
            Please read these terms carefully before using Riwaayat.
          </p>
          <div className="terms-hero-meta" style={{ display: 'flex', gap: '24px', justifyContent: 'center', alignItems: 'center', marginTop: '24px' }}>
            {[
              { icon: <Calendar size={14} color="var(--color-text-faint)" />, text: 'Last updated: May 2026' },
              { icon: <FileText size={14} color="var(--color-text-faint)" />, text: '10 sections' },
              { icon: <Clock size={14} color="var(--color-text-faint)" />, text: '~5 min read' },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {m.icon}
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-muted)' }}>{m.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mobile pill nav ── */}
      <div className="terms-mobile-pill">
        {NAV_ITEMS.map((item, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: '100px',
              border: `1px solid ${activeSection === i ? 'var(--color-accent-gold)' : 'var(--color-border)'}`,
              background: activeSection === i ? 'rgba(201,169,110,0.1)' : 'transparent',
              color: activeSection === i ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px', fontWeight: activeSection === i ? 600 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {item.num} {item.label}
          </button>
        ))}
      </div>

      {/* ── 2. Main layout ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div className="terms-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>

          {/* LEFT — Sticky sidebar */}
          <aside className="terms-sidebar" style={{ position: 'sticky', top: '24px' }}>
            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent-gold)', fontWeight: 600, margin: 0 }}>
                Table of contents
              </p>
              <nav style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {NAV_ITEMS.map((item, i) => (
                  <button
                    key={i}
                    className={`terms-sidebar-item${activeSection === i ? ' active' : ''}`}
                    onClick={() => scrollTo(i)}
                  >
                    <span className="terms-nav-num">{item.num}</span>
                    <span className="terms-nav-label">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '24px', paddingTop: '16px' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Need help?</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Contact our support team for clarification on any terms.
                </p>
                <button
                  onClick={() => navigate('/contact')}
                  className="btn-gold"
                  style={{ width: '100%', marginTop: '12px', padding: '8px', justifyContent: 'center' }}
                >
                  Contact Support
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT — Terms content card */}
          <main>
            <div className="terms-card" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '40px 44px' }}>
              {sections.map((section, i) => (
                <section
                  key={i}
                  id={SECTION_IDS[i]}
                  ref={el => { sectionRefs.current[i] = el }}
                  style={{
                    padding: '32px 0',
                    borderBottom: i < sections.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  {/* Section header */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                      width: 32, height: 32, background: 'rgba(201,169,110,0.1)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent-gold)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '20px', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
                      {section.title}
                    </h2>
                  </div>

                  {/* Optional callout */}
                  {section.callout}

                  {/* Plain paragraph */}
                  {section.content && (
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.8, margin: 0 }}>
                      {section.content}
                    </p>
                  )}

                  {/* Sub-points */}
                  {section.items && (
                    <div>
                      {section.items.map((item, j) => (
                        <SubPoint key={j} label={item.label} text={item.text} first={j === 0} />
                      ))}
                    </div>
                  )}
                </section>
              ))}

              {/* Document footer */}
              <div style={{ paddingTop: '32px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-faint)', margin: 0 }}>Last updated: May 2026</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-faint)', marginTop: '4px' }}>These terms are governed by the laws of India.</p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
                  <button onClick={() => navigate('/contact')} style={{ background: 'none', border: 'none', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-accent-gold)', cursor: 'pointer', padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    Contact Us
                  </button>
                  <span style={{ color: 'var(--color-border)' }}>|</span>
                  <button style={{ background: 'none', border: 'none', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-accent-gold)', cursor: 'pointer', padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    Privacy Policy
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

