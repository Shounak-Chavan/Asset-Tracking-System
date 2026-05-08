import { useState, useRef, useEffect } from 'react'
import {
  Mail, Phone, Clock, Calendar, CreditCard, Package,
  HelpCircle, ChevronRight, Send, Lock, Plus, Minus, User,
  ChevronDown, AlertCircle,
} from 'lucide-react'
import { validateName, validateEmail, validateMessage } from '../utils/validation'

function FieldError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ef4444', margin: '4px 0 0 0' }}>
      <AlertCircle size={12} color="#ef4444" style={{ flexShrink: 0 }} />
      {message}
    </p>
  )
}

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
      { threshold: 0.08 }
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

const inputBase: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1.5px solid #e5e7eb',
  borderRadius: '10px',
  fontSize: '14px',
  color: '#111827',
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#2563eb'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#e5e7eb'
  e.currentTarget.style.boxShadow = 'none'
}

const faqs = [
  {
    q: 'How long does it take to get a response?',
    a: 'Our team responds within 24 hours on business days.',
  },
  {
    q: 'Can I cancel a booking after it\'s confirmed?',
    a: 'Yes, contact support before the pickup date for cancellation options.',
  },
  {
    q: 'How is the security deposit refunded?',
    a: 'Deposits are refunded within 3–5 business days after the asset is returned in good condition.',
  },
  {
    q: 'What if an asset is damaged during my rental?',
    a: 'Report it immediately through your booking page. Our team will assess and guide you through the process.',
  },
]

type Priority = 'Normal' | 'Urgent' | 'Critical'

export function ContactPage() {
  const mainRef = useFadeIn()
  const faqRef = useFadeIn()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<Priority>('Normal')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = (field: string, value: string) => {
    let err: string | null = null
    if (field === 'name') err = validateName(value)
    if (field === 'email') err = validateEmail(value)
    if (field === 'subject') err = !value ? 'Please select a topic' : null
    if (field === 'message') err = validateMessage(value)
    setErrors(prev => ({ ...prev, [field]: err }))
    return err
  }

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateField(field, value)
  }

  const getFieldBorder = (field: string, value: string) => {
    if (!touched[field]) return '#e5e7eb'
    return errors[field] ? '#ef4444' : value ? '#22c55e' : '#e5e7eb'
  }

  const priorityStyles: Record<Priority, React.CSSProperties> = {
    Normal: { background: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0' },
    Urgent: { background: '#fef3c7', color: '#92400e', border: '1.5px solid #fcd34d' },
    Critical: { background: '#fee2e2', color: '#991b1b', border: '1.5px solid #fca5a5' },
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = {
      name: validateName(name),
      email: validateEmail(email),
      subject: !subject ? 'Please select a topic' : null,
      message: validateMessage(message),
    }
    setErrors(newErrors)
    setTouched({ name: true, email: true, subject: true, message: true })
    if (Object.values(newErrors).some(Boolean)) {
      const firstErrorField = document.querySelector('[data-invalid="true"]') as HTMLElement
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstErrorField?.focus()
      return
    }
    setSubmitted(true)
  }

  const contactItems = [
    {
      icon: <Mail size={20} color="#2563eb" />,
      iconBg: '#eff6ff',
      label: 'EMAIL',
      value: 'support@assettrack.local',
      sub: 'Response within 24 hours',
    },
    {
      icon: <Phone size={20} color="#16a34a" />,
      iconBg: '#dcfce7',
      label: 'PHONE',
      value: '+91 90000 00000',
      sub: 'Mon–Sat, 9:00 AM to 6:00 PM IST',
    },
    {
      icon: <Clock size={20} color="#d97706" />,
      iconBg: '#fef3c7',
      label: 'BUSINESS HOURS',
      value: 'Monday to Saturday',
      sub: '9:00 AM – 6:00 PM IST',
    },
  ]

  const helpChips = [
    { icon: <Calendar size={20} color="#2563eb" />, label: 'Booking Issues' },
    { icon: <CreditCard size={20} color="#d97706" />, label: 'Payment & Billing' },
    { icon: <Package size={20} color="#16a34a" />, label: 'Returns & Refunds' },
    { icon: <HelpCircle size={20} color="#9333ea" />, label: 'General Support' },
  ]

  return (
    <div style={{ background: '#f0f4f8', width: '100%' }}>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        .contact-pulse { animation: pulse-dot 2s ease-in-out infinite; }
        .help-chip {
          display: flex; align-items: center; gap: 12px;
          background: #f8fafc; border-radius: 10px; padding: 12px 14px;
          border: 1px solid #f1f5f9; cursor: pointer;
          transition: all 0.2s ease;
        }
        .help-chip:hover { background: #eff6ff; border-color: #dbeafe; }
        .priority-pill {
          padding: 7px 16px; border-radius: 100px;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.15s ease; border: 1.5px solid transparent;
        }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; }
          .contact-name-email { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── 1. Hero ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
        padding: '64px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '100px', padding: '6px 16px',
            fontSize: '13px', color: 'rgba(255,255,255,0.9)',
          }}>
            ✦ Support & Contact
          </div>

          <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginTop: '16px', marginBottom: 0 }}>
            Get in Touch
          </h1>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.7)', marginTop: '12px' }}>
            We're here to help. Reach out to our support team anytime.
          </p>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', marginTop: '24px' }}>
            <div className="contact-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Average response time: under 24 hours</span>
          </div>
        </div>
      </section>

      {/* ── 2. Main 2-col layout ── */}
      <section ref={mainRef as React.RefObject<HTMLElement>} style={{ ...fadeInit, background: '#f0f4f8' }}>
        <div style={{ maxWidth: 1100, margin: '-32px auto 0', padding: '0 24px 64px' }}>
          <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '28px', alignItems: 'start' }}>

            {/* LEFT — Contact Info */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Contact information</h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Reach us through any of these channels</p>
              <div style={{ borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

              {/* Contact items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {contactItems.map((item) => (
                  <div key={item.label} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '12px',
                      background: item.iconBg, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', fontWeight: 600, margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginTop: '2px', marginBottom: 0 }}>{item.value}</p>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', margin: '24px 0' }} />

              <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', marginTop: 0 }}>How we can help</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {helpChips.map((chip) => (
                  <div key={chip.label} className="help-chip">
                    {chip.icon}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{chip.label}</span>
                    <ChevronRight size={14} color="#9ca3af" style={{ marginLeft: 'auto' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Contact Form */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Send us a message</h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>Fill out the form and we'll get back to you shortly.</p>
              <div style={{ borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

              {submitted ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <Send size={24} color="#16a34a" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '16px' }}>Message sent!</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>We'll get back to you within 24 hours.</p>
                  <button
                    onClick={() => { setSubmitted(false); setName(''); setEmail(''); setSubject(''); setMessage(''); setPriority('Normal') }}
                    style={{ marginTop: '20px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Row 1 — Name + Email */}
                    <div className="contact-name-email" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                          <User size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                          <input
                            type="text"
                            placeholder="Your full name"
                            value={name}
                            onChange={e => { setName(e.target.value); if (touched.name) validateField('name', e.target.value) }}
                            onBlur={() => handleBlur('name', name)}
                            data-invalid={touched.name && !!errors.name ? 'true' : undefined}
                            style={{ ...inputBase, padding: '12px 16px 12px 42px', border: `1.5px solid ${getFieldBorder('name', name)}` }}
                            onFocus={onFocus}
                          />
                        </div>
                        <FieldError message={touched.name ? errors.name ?? null : null} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                          <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); if (touched.email) validateField('email', e.target.value) }}
                            onBlur={() => handleBlur('email', email)}
                            data-invalid={touched.email && !!errors.email ? 'true' : undefined}
                            style={{ ...inputBase, padding: '12px 16px 12px 42px', border: `1.5px solid ${getFieldBorder('email', email)}` }}
                            onFocus={onFocus}
                          />
                        </div>
                        <FieldError message={touched.email ? errors.email ?? null : null} />
                      </div>
                    </div>

                    {/* Row 2 — Subject */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Subject</label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={subject}
                          onChange={e => { setSubject(e.target.value); if (touched.subject) validateField('subject', e.target.value) }}
                          onBlur={() => handleBlur('subject', subject)}
                          data-invalid={touched.subject && !!errors.subject ? 'true' : undefined}
                          style={{ ...inputBase, padding: '12px 40px 12px 16px', appearance: 'none', cursor: 'pointer', border: `1.5px solid ${getFieldBorder('subject', subject)}` }}
                          onFocus={onFocus}
                        >
                          <option value="" disabled>Select a topic...</option>
                          <option value="booking">Booking Issue</option>
                          <option value="payment">Payment &amp; Billing</option>
                          <option value="returns">Returns &amp; Refunds</option>
                          <option value="support">General Support</option>
                          <option value="other">Other</option>
                        </select>
                        <ChevronDown size={16} color="#9ca3af" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                      <FieldError message={touched.subject ? errors.subject ?? null : null} />
                    </div>

                    {/* Row 3 — Message */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Message</label>
                      <textarea
                        placeholder="Describe your issue or question in detail..."
                        value={message}
                        onChange={e => { const v = e.target.value.slice(0, 500); setMessage(v); if (touched.message) validateField('message', v) }}
                        onBlur={() => handleBlur('message', message)}
                        data-invalid={touched.message && !!errors.message ? 'true' : undefined}
                        rows={5}
                        style={{ ...inputBase, padding: '14px 16px', minHeight: '140px', resize: 'vertical', fontFamily: 'inherit', border: `1.5px solid ${getFieldBorder('message', message)}` }}
                        onFocus={onFocus}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <FieldError message={touched.message ? errors.message ?? null : null} />
                        <span style={{ fontSize: '12px', color: message.length > 480 ? '#ef4444' : '#9ca3af', marginLeft: 'auto' }}>
                          {message.length} / 500
                        </span>
                      </div>
                    </div>

                    {/* Row 4 — Priority */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>Priority:</span>
                      {(['Normal', 'Urgent', 'Critical'] as Priority[]).map(p => (
                        <button
                          key={p}
                          type="button"
                          className="priority-pill"
                          onClick={() => setPriority(p)}
                          style={{
                            ...priorityStyles[p],
                            fontWeight: priority === p ? 600 : 500,
                            opacity: priority === p ? 1 : 0.65,
                            transform: priority === p ? 'scale(1.04)' : 'scale(1)',
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        background: '#2563eb', color: '#fff', border: 'none',
                        borderRadius: '10px', padding: '14px',
                        fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#1d4ed8'
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.3)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#2563eb'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <Send size={16} color="#fff" />
                      Send Message
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '-8px' }}>
                      <Lock size={12} color="#9ca3af" />
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>Your information is secure and never shared.</span>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FAQ Strip ── */}
      <section ref={faqRef as React.RefObject<HTMLElement>} style={{ ...fadeInit, background: 'white', padding: '64px 24px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2563eb', fontWeight: 700, textAlign: 'center', margin: 0 }}>FAQ</p>
          <h2 style={{ fontSize: '30px', fontWeight: 700, color: '#0f172a', textAlign: 'center', marginTop: '8px', marginBottom: 0 }}>Common questions</h2>

          <div style={{ marginTop: '36px' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: '1px solid #e5e7eb', padding: '18px 0' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a' }}>{faq.q}</span>
                  {openFaq === i
                    ? <Minus size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                    : <Plus size={18} color="#9ca3af" style={{ flexShrink: 0 }} />
                  }
                </button>
                {openFaq === i && (
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginTop: '10px', marginBottom: 0 }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

