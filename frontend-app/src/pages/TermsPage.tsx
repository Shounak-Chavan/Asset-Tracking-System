import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  FileSignature,
  FileText,
  Gem,
  IndianRupee,
  Info,
  PenLine,
  Ruler,
  Scissors,
  ShieldAlert,
  Shirt,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'

const NAV_ITEMS = [
  { num: '01', label: 'Terms & Conditions' },
  { num: '02', label: 'Rental Policies' },
  { num: '03', label: 'Customer Details' },
  { num: '04', label: 'Measurements' },
  { num: '05', label: 'Staff Check' },
  { num: '06', label: 'Consent' },
]

const SECTION_IDS = NAV_ITEMS.map((_, i) => `rental-agreement-section-${i}`)

type AgreementField = {
  label: string
  placeholder?: string
  type?: string
  kind?: 'select' | 'textarea' | 'signature'
  options?: string[]
  required?: boolean
  wide?: boolean
}

const terms = [
  {
    title: 'Return Timing',
    icon: Clock,
    items: [
      'On the day of return, the dress must be returned before 7:30 PM or at the discussed time.',
      'If not returned on the agreed return date, the deposit will become non-refundable.',
    ],
  },
  {
    title: 'Non-Refundable Rent',
    icon: IndianRupee,
    items: ['Rent paid is non-refundable under any circumstances.'],
  },
  {
    title: 'Deposit Amount',
    icon: ShieldAlert,
    items: [
      'A security deposit is required for every dress.',
      'Deposit amount varies depending on the dress.',
      'Deposit is returned within 3 days after dress return.',
    ],
  },
  {
    title: 'Delay in Handover',
    icon: AlertCircle,
    items: [
      'The company is not liable for losses caused due to handover delays.',
      'All disputes are subject to Pune court jurisdiction.',
    ],
  },
]

const policies = [
  {
    title: 'Event Date Change Policy',
    icon: Calendar,
    items: ['Booking date changes are not available.'],
  },
  {
    title: 'Dress Damage Policy',
    icon: Scissors,
    items: [
      'Customers must handle dresses carefully.',
      'Repair charges will apply if damage occurs.',
      'Irreparable damage may result in a purchase fee, generally 5x or more of the rental amount.',
    ],
  },
  {
    title: 'Dress & Jewellery Loss Policy',
    icon: Gem,
    items: [
      'Lost dresses or jewellery must be compensated by the customer.',
      'Charges may be 5x or more of the rental amount.',
    ],
  },
  {
    title: 'Hangers & Bag Loss Policy',
    icon: Shirt,
    items: ['Customer must pay the actual replacement cost.'],
  },
  {
    title: 'Dress Condition Policy',
    icon: Sparkles,
    items: [
      'Dresses are dry-cleaned but may have minor visible stains.',
      'Customers should inspect carefully before renting.',
      'Visible stains should be discussed before payment.',
    ],
  },
  {
    title: 'Stains Policy',
    icon: ClipboardCheck,
    items: [
      'Customers are responsible for stain removal costs.',
      'Non-removable stains, especially haldi or lipstick stains, may result in additional charges.',
      'Severe damage may require paying purchase cost, generally 5x or more of rental amount.',
    ],
  },
]

const customerFields: AgreementField[] = [
  { label: 'Customer Full Name', placeholder: 'Enter full name', required: true },
  { label: 'Contact Number', placeholder: 'Primary phone number', type: 'tel', required: true },
  { label: 'Alternate Number', placeholder: 'Alternate phone number', type: 'tel' },
  { label: 'Dress / Jewellery (1)', placeholder: 'Item name or code', required: true },
  { label: 'Dress / Jewellery (2)', placeholder: 'Optional second item' },
  { label: 'Pickup Date', type: 'date', required: true },
  { label: 'Pickup Time', type: 'time', required: true },
  { label: 'Return Date', type: 'date', required: true },
  { label: 'Return Time', type: 'time', required: true },
  { label: 'Trial Date', type: 'date' },
  { label: 'Trial Time', type: 'time' },
  { label: 'Trial Done?', kind: 'select', options: ['Select status', 'Yes', 'No'] },
  { label: 'Rent Paid', placeholder: 'Amount paid', type: 'number', required: true },
  { label: 'Deposit Paid or Not', kind: 'select', options: ['Select status', 'Paid', 'Not Paid', 'Partial'], required: true },
  { label: 'Deposit Amount', placeholder: 'Security deposit amount', type: 'number', required: true },
  { label: 'Remarks', placeholder: 'Add notes, visible stains, special instructions', kind: 'textarea', wide: true },
  { label: 'Customer Signature', kind: 'signature', wide: true },
]

const measurementFields: AgreementField[] = [
  { label: 'Bust', placeholder: 'in inches' },
  { label: 'Waist', placeholder: 'in inches' },
  { label: 'Hip', placeholder: 'in inches' },
  { label: 'Armhole', placeholder: 'in inches' },
  { label: 'Sleeves Length', placeholder: 'in inches' },
  { label: 'Sleeves Round', placeholder: 'in inches' },
  { label: 'Remarks', placeholder: 'Alteration or fitting notes', kind: 'textarea', wide: true },
  { label: 'Signature', kind: 'signature', wide: true },
]

const staffFields: AgreementField[] = [
  { label: 'Staff Name', placeholder: 'Staff member name' },
  { label: 'Quality Check Done By', placeholder: 'Checker name' },
  { label: 'Remarks', placeholder: 'Internal quality, return, or handover notes', kind: 'textarea', wide: true },
]

function AgreementCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`agreement-card ${className}`}>{children}</div>
}

function SectionHeading({ eyebrow, title, text, icon }: { eyebrow: string; title: string; text: string; icon: ReactNode }) {
  return (
    <div className="agreement-section-heading">
      <div className="agreement-heading-icon">{icon}</div>
      <div>
        <p className="section-eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</p>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  )
}

function PolicyAccordion({ entries, defaultOpen = false }: { entries: typeof terms; defaultOpen?: boolean }) {
  return (
    <div className="agreement-accordion-grid">
      {entries.map((entry, index) => {
        const Icon = entry.icon
        return (
          <details key={entry.title} className="agreement-accordion" open={defaultOpen && index === 0}>
            <summary>
              <span className="agreement-policy-icon"><Icon size={18} /></span>
              <span>{entry.title}</span>
              <ChevronDown className="agreement-chevron" size={18} aria-hidden="true" />
            </summary>
            <ul>
              {entry.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </details>
        )
      })}
    </div>
  )
}

function AgreementField({ field }: { field: AgreementField }) {
  const id = field.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  if (field.kind === 'signature') {
    return (
      <label className="agreement-field agreement-field-wide" htmlFor={id}>
        <span>{field.label}</span>
        <div className="signature-box" id={id} aria-label={`${field.label} area`}>
          <PenLine size={18} />
          <span>Signature</span>
        </div>
      </label>
    )
  }

  return (
    <label className={`agreement-field${field.wide ? ' agreement-field-wide' : ''}`} htmlFor={id}>
      <span>
        {field.label}
        {field.required && <strong aria-label="required">*</strong>}
      </span>
      {field.kind === 'textarea' ? (
        <textarea id={id} placeholder={field.placeholder} rows={4} />
      ) : field.kind === 'select' ? (
        <select id={id} required={field.required} defaultValue="">
          {field.options?.map((option, index) => (
            <option key={option} value={index === 0 ? '' : option}>{option}</option>
          ))}
        </select>
      ) : (
        <input id={id} type={field.type ?? 'text'} placeholder={field.placeholder} required={field.required} />
      )}
    </label>
  )
}

function AgreementFormGrid({ fields }: { fields: AgreementField[] }) {
  return (
    <div className="agreement-form-grid">
      {fields.map((field) => <AgreementField key={field.label} field={field} />)}
    </div>
  )
}

export function TermsPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState(0)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    SECTION_IDS.forEach((id, i) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(i) },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach((observer) => observer.disconnect())
  }, [])

  const scrollTo = (i: number) => {
    document.getElementById(SECTION_IDS[i])?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ background: 'var(--color-bg-primary)', width: '100%' }}>
      <style>{`
        .agreement-hero {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 16% 10%, rgba(201,169,110,0.16), transparent 30%),
            radial-gradient(circle at 84% 0%, rgba(232,201,138,0.08), transparent 28%),
            linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%);
          border-bottom: 1px solid var(--color-border);
          padding: 70px 24px 56px;
          text-align: center;
        }
        .agreement-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(201,169,110,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,110,0.035) 1px, transparent 1px);
          background-size: 58px 58px;
          pointer-events: none;
        }
        .agreement-hero > div { position: relative; z-index: 1; }
        .agreement-hero-title {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: clamp(34px, 6vw, 58px);
          font-weight: 500;
          color: var(--color-text-primary);
          line-height: 1.05;
          margin: 0;
        }
        .agreement-hero-copy {
          max-width: 720px;
          margin: 16px auto 0;
          font-size: 15px;
          color: var(--color-text-muted);
          line-height: 1.8;
        }
        .agreement-hero-meta {
          display: flex;
          gap: 14px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 28px;
        }
        .agreement-meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 13px;
          border: 1px solid var(--color-border);
          border-radius: 999px;
          background: rgba(58,21,40,0.72);
          color: var(--color-text-muted);
          font-size: 12px;
        }
        .agreement-layout {
          display: grid;
          grid-template-columns: 270px 1fr;
          gap: 32px;
          align-items: start;
        }
        .agreement-sidebar {
          position: sticky;
          top: 92px;
        }
        .agreement-card {
          background: linear-gradient(180deg, rgba(66,24,48,0.96), var(--color-bg-card));
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
        }
        .agreement-card:hover {
          border-color: var(--color-border-strong);
          box-shadow: var(--shadow-gold);
        }
        .terms-sidebar-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 10px;
          border: none;
          border-radius: var(--radius-md);
          background: transparent;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .terms-sidebar-item:hover { background: rgba(201,169,110,0.06); transform: translateX(2px); }
        .terms-sidebar-item.active {
          background: rgba(201,169,110,0.1);
          border-left: 2px solid var(--color-accent-gold);
          padding-left: 8px;
        }
        .terms-nav-num { font-size: 11px; font-weight: 700; color: var(--color-text-faint); min-width: 18px; }
        .terms-nav-label { font-size: 13px; color: var(--color-text-muted); }
        .terms-sidebar-item.active .terms-nav-num,
        .terms-sidebar-item.active .terms-nav-label,
        .terms-sidebar-item:hover .terms-nav-num,
        .terms-sidebar-item:hover .terms-nav-label { color: var(--color-accent-gold); }
        .terms-mobile-pill {
          display: none;
          overflow-x: auto;
          gap: 8px;
          padding: 16px 24px;
          background: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border);
          scrollbar-width: none;
        }
        .terms-mobile-pill::-webkit-scrollbar { display: none; }
        .agreement-main {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .agreement-section {
          scroll-margin-top: 100px;
          padding: 30px;
        }
        .agreement-section-heading {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 22px;
        }
        .agreement-section-heading h2 {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 28px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin: 0;
        }
        .agreement-section-heading p:not(.section-eyebrow) {
          color: var(--color-text-muted);
          font-size: 14px;
          line-height: 1.7;
          margin: 8px 0 0;
        }
        .agreement-heading-icon,
        .agreement-policy-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: var(--radius-lg);
          background: rgba(201,169,110,0.1);
          border: 1px solid rgba(201,169,110,0.28);
          color: var(--color-accent-gold);
        }
        .agreement-policy-icon { width: 36px; height: 36px; border-radius: var(--radius-md); }
        .agreement-notice {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          padding: 18px;
          border: 1px solid rgba(201,169,110,0.3);
          border-radius: var(--radius-lg);
          background: rgba(201,169,110,0.08);
          margin-bottom: 20px;
        }
        .agreement-notice h3 { margin: 0; font-size: 14px; color: var(--color-accent-gold); letter-spacing: 0.08em; text-transform: uppercase; }
        .agreement-notice p { margin: 6px 0 0; color: var(--color-text-muted); font-size: 13px; line-height: 1.7; }
        .agreement-accordion-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .agreement-accordion {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: rgba(45,16,32,0.72);
          overflow: hidden;
          transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
        }
        .agreement-accordion:hover { border-color: var(--color-border-strong); transform: translateY(-2px); background: rgba(58,21,40,0.82); }
        .agreement-accordion summary {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 16px;
          color: var(--color-text-primary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          list-style: none;
        }
        .agreement-accordion summary::-webkit-details-marker { display: none; }
        .agreement-chevron { color: var(--color-text-faint); transition: transform 0.2s ease; }
        .agreement-accordion[open] .agreement-chevron { transform: rotate(180deg); color: var(--color-accent-gold); }
        .agreement-accordion ul {
          margin: 0;
          padding: 0 18px 18px 66px;
          color: var(--color-text-muted);
          font-size: 13px;
          line-height: 1.75;
        }
        .agreement-accordion li { margin: 6px 0; }
        .agreement-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .agreement-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .agreement-field-wide { grid-column: 1 / -1; }
        .agreement-field span {
          color: var(--color-text-muted);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .agreement-field strong { color: var(--color-accent-gold); margin-left: 3px; }
        .agreement-field input,
        .agreement-field select,
        .agreement-field textarea {
          width: 100%;
          min-height: 44px;
          padding: 12px 14px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .agreement-field textarea { resize: vertical; min-height: 104px; }
        .agreement-field input::placeholder,
        .agreement-field textarea::placeholder { color: var(--color-text-faint); }
        .agreement-field input:focus,
        .agreement-field select:focus,
        .agreement-field textarea:focus {
          border-color: var(--color-accent-gold);
          box-shadow: 0 0 0 3px rgba(201,169,110,0.12);
          background: rgba(45,16,32,0.95);
        }
        .agreement-field input:invalid:not(:placeholder-shown),
        .agreement-field select:invalid { border-color: var(--color-error); }
        .signature-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 78px;
          padding: 18px;
          border: 1.5px dashed var(--color-border-strong);
          border-radius: var(--radius-lg);
          background: rgba(30,10,20,0.42);
          color: var(--color-text-faint);
        }
        .staff-section {
          background:
            linear-gradient(135deg, rgba(201,169,110,0.08), transparent 45%),
            linear-gradient(180deg, rgba(66,24,48,0.98), var(--color-bg-card));
        }
        .staff-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(126,200,160,0.1);
          border: 1px solid rgba(126,200,160,0.28);
          color: var(--color-success);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .consent-card {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 22px;
          align-items: center;
          padding: 28px;
        }
        .consent-check {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
        }
        .consent-check input { width: 18px; height: 18px; margin-top: 3px; accent-color: var(--color-accent-gold); }
        .consent-check span { color: var(--color-text-primary); font-size: 14px; line-height: 1.7; }
        .consent-note { margin: 8px 0 0 30px; color: var(--color-text-faint); font-size: 12px; line-height: 1.6; }
        @media (max-width: 1024px) {
          .agreement-layout { grid-template-columns: 1fr; }
          .agreement-sidebar { display: none; }
          .terms-mobile-pill { display: flex; }
          .agreement-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .agreement-hero { padding: 52px 20px 42px; }
          .agreement-section { padding: 22px 18px; }
          .agreement-section-heading { flex-direction: column; }
          .agreement-section-heading h2 { font-size: 24px; }
          .agreement-accordion-grid,
          .agreement-form-grid,
          .consent-card { grid-template-columns: 1fr; }
          .agreement-accordion ul { padding-left: 42px; }
          .consent-card { padding: 22px 18px; }
        }
      `}</style>

      <section className="agreement-hero">
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <p className="section-eyebrow" style={{ marginBottom: 12 }}>Rental Agreement</p>
          <h1 className="agreement-hero-title">Terms & Conditions / Rental Policy</h1>
          <p className="agreement-hero-copy">
            A polished booking agreement for Riwaayat rentals, structured for clear customer understanding, smoother handovers, accurate measurements, and professional staff verification.
          </p>
          <div className="agreement-hero-meta" aria-label="Agreement highlights">
            {[
              { icon: <FileText size={14} />, text: '6 organized sections' },
              { icon: <Clock size={14} />, text: 'Return before 7:30 PM' },
              { icon: <ShieldAlert size={14} />, text: 'Deposit protected process' },
              { icon: <BadgeCheck size={14} />, text: 'Consent required' },
            ].map((item) => (
              <span className="agreement-meta-pill" key={item.text}>{item.icon}{item.text}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="terms-mobile-pill">
        {NAV_ITEMS.map((item, i) => (
          <button
            key={item.label}
            onClick={() => scrollTo(i)}
            style={{
              flexShrink: 0,
              padding: '7px 14px',
              borderRadius: '100px',
              border: `1px solid ${activeSection === i ? 'var(--color-accent-gold)' : 'var(--color-border)'}`,
              background: activeSection === i ? 'rgba(201,169,110,0.1)' : 'transparent',
              color: activeSection === i ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
              fontSize: '12px',
              fontWeight: activeSection === i ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {item.num} {item.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '34px 24px 86px' }}>
        <div className="agreement-layout">
          <aside className="agreement-sidebar">
            <AgreementCard>
              <div style={{ padding: 24 }}>
                <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent-gold)', fontWeight: 700, margin: 0 }}>
                  Agreement Guide
                </p>
                <nav style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 3 }} aria-label="Rental agreement sections">
                  {NAV_ITEMS.map((item, i) => (
                    <button key={item.label} className={`terms-sidebar-item${activeSection === i ? ' active' : ''}`} onClick={() => scrollTo(i)}>
                      <span className="terms-nav-num">{item.num}</span>
                      <span className="terms-nav-label">{item.label}</span>
                    </button>
                  ))}
                </nav>
                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 24, paddingTop: 18 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Need clarification?</p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6, lineHeight: 1.7 }}>
                    Speak with our team before booking if any rental condition needs explanation.
                  </p>
                  <button onClick={() => navigate('/contact')} className="btn-gold" style={{ width: '100%', marginTop: 14, padding: '9px 12px' }}>
                    Contact Support
                  </button>
                </div>
              </div>
            </AgreementCard>
          </aside>

          <main className="agreement-main">
            <AgreementCard>
              <section id={SECTION_IDS[0]} className="agreement-section">
                <SectionHeading
                  eyebrow="Before Booking"
                  title="Terms & Conditions"
                  text="Core rental rules covering return timing, rent, deposit handling, handover delays, and legal jurisdiction."
                  icon={<FileSignature size={21} />}
                />
                <div className="agreement-notice" role="note" aria-label="Please read carefully before booking">
                  <Info size={20} color="var(--color-accent-gold)" />
                  <div>
                    <h3>Please read carefully before booking</h3>
                    <p>These terms are part of the rental agreement. Confirm dates, payment, condition, and return timing before completing the booking.</p>
                  </div>
                </div>
                <PolicyAccordion entries={terms} defaultOpen />
              </section>
            </AgreementCard>

            <AgreementCard>
              <section id={SECTION_IDS[1]} className="agreement-section">
                <SectionHeading
                  eyebrow="Rental Care"
                  title="Policies"
                  text="Organized policy categories for date changes, dress care, jewellery loss, accessories, visible stains, and damage charges."
                  icon={<ClipboardCheck size={21} />}
                />
                <PolicyAccordion entries={policies} defaultOpen />
              </section>
            </AgreementCard>

            <AgreementCard>
              <section id={SECTION_IDS[2]} className="agreement-section">
                <SectionHeading
                  eyebrow="Booking Record"
                  title="Customer Details"
                  text="Capture customer information, selected rental items, pickup and return schedule, payment status, remarks, and signature."
                  icon={<UserRound size={21} />}
                />
                <AgreementFormGrid fields={customerFields} />
              </section>
            </AgreementCard>

            <AgreementCard>
              <section id={SECTION_IDS[3]} className="agreement-section">
                <SectionHeading
                  eyebrow="Fitting Notes"
                  title="Measurement Section"
                  text="A clean measurement card to document fitting information and alteration notes before handover."
                  icon={<Ruler size={21} />}
                />
                <AgreementFormGrid fields={measurementFields} />
              </section>
            </AgreementCard>

            <AgreementCard className="staff-section">
              <section id={SECTION_IDS[4]} className="agreement-section">
                <span className="staff-badge"><Users size={13} /> Staff only</span>
                <SectionHeading
                  eyebrow="Internal Check"
                  title="Staff Section"
                  text="Private staff verification for quality checks, remarks, and accountability during pickup or return processing."
                  icon={<CheckCircle2 size={21} />}
                />
                <AgreementFormGrid fields={staffFields} />
              </section>
            </AgreementCard>

            <AgreementCard>
              <section id={SECTION_IDS[5]} className="agreement-section">
                <div className="consent-card">
                  <div>
                    <p className="section-eyebrow" style={{ marginBottom: 10 }}>Final Confirmation</p>
                    <label className="consent-check" htmlFor="terms-consent">
                      <input id="terms-consent" type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
                      <span>I have read and agree to all Terms & Conditions.</span>
                    </label>
                    <p className="consent-note">Consent should be confirmed before accepting the rental booking or handover.</p>
                  </div>
                  <button className={agreed ? 'btn-gold-filled' : 'btn-gold'} type="button" disabled={!agreed}>
                    {agreed ? 'Agreement Accepted' : 'Awaiting Consent'}
                  </button>
                </div>
              </section>
            </AgreementCard>
          </main>
        </div>
      </div>
    </div>
  )
}
