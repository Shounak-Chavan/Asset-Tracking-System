import { useState, useRef, useEffect } from "react";
import { Mail, Phone, Clock, Calendar, CreditCard, Package, HelpCircle, ChevronRight, Send, Lock, Plus, Minus, User, ChevronDown, AlertCircle, Crown } from "lucide-react";
import { validateName, validateEmail, validateMessage } from "../utils/validation";

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-error)", margin: "4px 0 0 0", fontFamily: "var(--font-sans)" }}>
      <AlertCircle size={12} color="var(--color-error)" style={{ flexShrink: 0 }} />
      {message}
    </p>
  );
}

function useFadeIn() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.style.opacity = "1"; el.style.transform = "translateY(0)"; observer.disconnect(); }
    }, { threshold: 0.08 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

const fadeInit: React.CSSProperties = { opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" };

const faqs = [
  { q: "How long does it take to get a response?", a: "Our team responds within 24 hours on business days." },
  { q: "Can I cancel a booking after it's confirmed?", a: "Yes, contact support before the pickup date for cancellation options." },
  { q: "How is the security deposit refunded?", a: "Deposits are refunded within 3–5 business days after the piece is returned in good condition." },
  { q: "What if a piece is damaged during my rental?", a: "Report it immediately through your booking page. Our team will assess and guide you through the process." },
];

type Priority = "Normal" | "Urgent" | "Critical";

export function ContactPage() {
  const mainRef = useFadeIn();
  const faqRef = useFadeIn();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("Normal");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: string) => {
    let err: string | null = null;
    if (field === "name") err = validateName(value);
    if (field === "email") err = validateEmail(value);
    if (field === "subject") err = !value ? "Please select a topic" : null;
    if (field === "message") err = validateMessage(value);
    setErrors((prev) => ({ ...prev, [field]: err }));
    return err;
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const getFieldBorder = (field: string, value: string) => {
    if (!touched[field]) return "var(--color-border)";
    return errors[field] ? "var(--color-error)" : value ? "var(--color-success)" : "var(--color-border)";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { name: validateName(name), email: validateEmail(email), subject: !subject ? "Please select a topic" : null, message: validateMessage(message) };
    setErrors(newErrors);
    setTouched({ name: true, email: true, subject: true, message: true });
    if (Object.values(newErrors).some(Boolean)) return;
    setSubmitted(true);
  };

  const inputBase: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text-primary)", outline: "none", fontFamily: "var(--font-sans)", transition: "border-color 0.2s ease, box-shadow 0.2s ease" };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = "var(--color-accent-gold)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,169,110,0.1)"; };
  const onBlurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; };

  const labelStyle: React.CSSProperties = { display: "block", fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 8 };

  const contactItems = [
    { icon: <Mail size={18} color="var(--color-accent-gold)" />, label: "EMAIL", value: "support@riwaayat.in", sub: "Response within 24 hours" },
    { icon: <Phone size={18} color="var(--color-accent-gold)" />, label: "PHONE", value: "+91 90000 00000", sub: "Mon–Sat, 9:00 AM to 6:00 PM IST" },
    { icon: <Clock size={18} color="var(--color-accent-gold)" />, label: "HOURS", value: "Monday to Saturday", sub: "9:00 AM – 6:00 PM IST" },
  ];

  const helpChips = [
    { icon: <Calendar size={16} color="var(--color-accent-gold)" />, label: "Booking Issues" },
    { icon: <CreditCard size={16} color="var(--color-accent-gold)" />, label: "Payment & Billing" },
    { icon: <Package size={16} color="var(--color-accent-gold)" />, label: "Returns & Refunds" },
    { icon: <HelpCircle size={16} color="var(--color-accent-gold)" />, label: "General Support" },
  ];

  return (
    <div style={{ background: "var(--color-bg-primary)", width: "100%" }}>
      <style>{`
        .help-chip { display: flex; align-items: center; gap: 12px; background: var(--color-bg-secondary); border-radius: var(--radius-md); padding: 12px 14px; border: 1px solid var(--color-border); cursor: pointer; transition: border-color 0.2s ease; }
        .help-chip:hover { border-color: var(--color-border-strong); }
        @media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr !important; } .contact-name-email { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Hero */}
      <section style={{ background: "var(--color-bg-secondary)", borderBottom: "1px solid var(--color-border)", padding: "64px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,169,110,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,110,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <Crown size={24} color="var(--color-accent-gold)" strokeWidth={1.5} style={{ margin: "0 auto 16px" }} />
          <p className="section-eyebrow" style={{ marginBottom: 12 }}>Support & Contact</p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 48, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 12px 0" }}>Get in Touch</h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--color-text-muted)", lineHeight: 1.7 }}>We're here to help. Reach out to our support team anytime.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", marginTop: 20 }}>
            <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-success)", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text-muted)" }}>Average response: under 24 hours</span>
          </div>
        </div>
      </section>

      {/* Main 2-col */}
      <section ref={mainRef as React.RefObject<HTMLElement>} style={{ ...fadeInit }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 64px" }}>
          <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 28, alignItems: "start" }}>

            {/* Left — Contact Info */}
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "32px 28px" }}>
              <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-primary)", margin: "0 0 4px 0" }}>Contact Information</h2>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>Reach us through any of these channels</p>
              <hr className="gold-divider" style={{ margin: "20px 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {contactItems.map((item) => (
                  <div key={item.label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--color-border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</div>
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-accent-gold)", fontWeight: 600, margin: 0 }}>{item.label}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", margin: "2px 0 0 0" }}>{item.value}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <hr className="gold-divider" style={{ margin: "24px 0" }} />
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-primary)", marginBottom: 14, marginTop: 0 }}>How we can help</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {helpChips.map((chip) => (
                  <div key={chip.label} className="help-chip">
                    {chip.icon}
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{chip.label}</span>
                    <ChevronRight size={13} color="var(--color-text-faint)" style={{ marginLeft: "auto" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Form */}
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "36px 32px" }}>
              <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-primary)", margin: "0 0 4px 0" }}>Send a Message</h2>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>Fill out the form and we'll get back to you shortly.</p>
              <hr className="gold-divider" style={{ margin: "20px 0" }} />

              {submitted ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Send size={20} color="var(--color-accent-gold)" />
                  </div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 8px 0" }}>Message sent!</h3>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text-muted)" }}>We'll get back to you within 24 hours.</p>
                  <button className="btn-gold" style={{ marginTop: 20, padding: "10px 24px" }} onClick={() => { setSubmitted(false); setName(""); setEmail(""); setSubject(""); setMessage(""); setPriority("Normal"); }}>
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div className="contact-name-email" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={labelStyle}>Full Name</label>
                        <div style={{ position: "relative" }}>
                          <User size={14} color="var(--color-text-faint)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                          <input type="text" placeholder="Your name" value={name} onChange={(e) => { setName(e.target.value); if (touched.name) validateField("name", e.target.value); }} onBlur={() => handleBlur("name", name)} style={{ ...inputBase, padding: "12px 16px 12px 36px", border: `1.5px solid ${getFieldBorder("name", name)}` }} onFocus={onFocus} />
                        </div>
                        <FieldError message={touched.name ? errors.name ?? null : null} />
                      </div>
                      <div>
                        <label style={labelStyle}>Email Address</label>
                        <div style={{ position: "relative" }}>
                          <Mail size={14} color="var(--color-text-faint)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); if (touched.email) validateField("email", e.target.value); }} onBlur={() => handleBlur("email", email)} style={{ ...inputBase, padding: "12px 16px 12px 36px", border: `1.5px solid ${getFieldBorder("email", email)}` }} onFocus={onFocus} />
                        </div>
                        <FieldError message={touched.email ? errors.email ?? null : null} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Subject</label>
                      <div style={{ position: "relative" }}>
                        <select value={subject} onChange={(e) => { setSubject(e.target.value); if (touched.subject) validateField("subject", e.target.value); }} onBlur={() => handleBlur("subject", subject)} style={{ ...inputBase, padding: "12px 40px 12px 16px", appearance: "none", cursor: "pointer", border: `1.5px solid ${getFieldBorder("subject", subject)}` }} onFocus={onFocus}>
                          <option value="" disabled>Select a topic...</option>
                          <option value="booking">Booking Issue</option>
                          <option value="payment">Payment &amp; Billing</option>
                          <option value="returns">Returns &amp; Refunds</option>
                          <option value="support">General Support</option>
                          <option value="other">Other</option>
                        </select>
                        <ChevronDown size={14} color="var(--color-text-faint)" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      </div>
                      <FieldError message={touched.subject ? errors.subject ?? null : null} />
                    </div>
                    <div>
                      <label style={labelStyle}>Message</label>
                      <textarea placeholder="Describe your issue or question..." value={message} onChange={(e) => { const v = e.target.value.slice(0, 500); setMessage(v); if (touched.message) validateField("message", v); }} onBlur={() => handleBlur("message", message)} rows={5} style={{ ...inputBase, padding: "14px 16px", minHeight: 130, resize: "vertical", border: `1.5px solid ${getFieldBorder("message", message)}` }} onFocus={onFocus} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <FieldError message={touched.message ? errors.message ?? null : null} />
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: message.length > 480 ? "var(--color-error)" : "var(--color-text-faint)", marginLeft: "auto" }}>{message.length} / 500</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Priority:</span>
                      {(["Normal", "Urgent", "Critical"] as Priority[]).map((p) => (
                        <button key={p} type="button" onClick={() => setPriority(p)} style={{ padding: "6px 14px", borderRadius: 100, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: priority === p ? 600 : 400, cursor: "pointer", border: `1px solid ${priority === p ? "var(--color-accent-gold)" : "var(--color-border)"}`, background: priority === p ? "rgba(201,169,110,0.1)" : "transparent", color: priority === p ? "var(--color-accent-gold)" : "var(--color-text-muted)", transition: "all 0.15s ease" }}>
                          {p}
                        </button>
                      ))}
                    </div>
                    <button type="submit" className="btn-gold" style={{ width: "100%", padding: "14px", justifyContent: "center" }}>
                      <Send size={14} />
                      Send Message
                    </button>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: -8 }}>
                      <Lock size={11} color="var(--color-text-faint)" />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-text-faint)" }}>Your information is secure and never shared.</span>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section ref={faqRef as React.RefObject<HTMLElement>} style={{ ...fadeInit, background: "var(--color-bg-secondary)", borderTop: "1px solid var(--color-border)", padding: "64px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p className="section-eyebrow" style={{ textAlign: "center", marginBottom: 12 }}>FAQ</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 36, fontWeight: 500, color: "var(--color-text-primary)", textAlign: "center", margin: "0 0 0 0" }}>Common Questions</h2>
          <hr className="gold-divider" style={{ margin: "20px auto", maxWidth: 80 }} />
          <div style={{ marginTop: 36 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: "1px solid var(--color-border)", padding: "18px 0" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>{faq.q}</span>
                  {openFaq === i ? <Minus size={16} color="var(--color-accent-gold)" style={{ flexShrink: 0 }} /> : <Plus size={16} color="var(--color-text-faint)" style={{ flexShrink: 0 }} />}
                </button>
                {openFaq === i && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.7, marginTop: 10, marginBottom: 0 }}>{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
