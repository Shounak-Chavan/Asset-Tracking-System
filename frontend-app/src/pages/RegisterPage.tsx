import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle, CheckCircle2,
  Eye, EyeOff, Mail, Lock, User, Loader2,
  ShieldCheck, Star,
} from 'lucide-react'
import { useAuth } from '../auth-context'

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '#e5e7eb' }
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  const map = [
    { label: '',        color: '#e5e7eb' },
    { label: 'Weak',    color: '#ef4444' },
    { label: 'Fair',    color: '#f59e0b' },
    { label: 'Good',    color: '#3b82f6' },
    { label: 'Strong',  color: '#16a34a' },
  ]
  return { score: s, ...map[s] }
}

// ── Show/hide password input ──────────────────────────────────────────────────
function PwInput({
  value, onChange, placeholder, disabled, borderColor,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  borderColor?: string
}) {
  const [show, setShow] = useState(false)
  const base: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 42px 12px 42px',
    fontSize: '14px', color: '#111827',
    border: `1.5px solid ${borderColor ?? '#e5e7eb'}`,
    borderRadius: '10px', outline: 'none', background: '#fff',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }
  return (
    <div style={{ position: 'relative' }}>
      <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••'}
        disabled={disabled}
        autoComplete="new-password"
        style={base}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = borderColor ?? '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0 }}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const strength = getStrength(password)
  const confirmMismatch = Boolean(confirmPassword && password !== confirmPassword)
  const confirmMatch   = Boolean(confirmPassword && password === confirmPassword && confirmPassword.length > 0)

  const canSubmit = Boolean(fullName && email && password && confirmPassword && !confirmMismatch && termsAccepted && !loading && !success)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setLoading(true)
    try {
      await register({ full_name: fullName, email, password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 16px 12px 42px',
    fontSize: '14px', color: '#111827',
    border: '1.5px solid #e5e7eb', borderRadius: '10px',
    outline: 'none', background: '#fff',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#1a3a6b'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,58,107,0.08)'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#e5e7eb'
    e.currentTarget.style.boxShadow = 'none'
  }

  const confirmBorder = confirmMismatch ? '#ef4444' : confirmMatch ? '#16a34a' : '#e5e7eb'

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: 'linear-gradient(135deg, #e8f4fd 0%, #eef6ff 50%, #f0fdf9 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* ── Background blobs (static, no blur) ── */}
      <div style={{ position: 'fixed', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(0,201,167,0.08)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(26,58,107,0.06)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.2, pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Card ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '460px',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.8)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.6) inset',
        padding: '40px 44px',
      }}>

        {/* ── Brand header ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img src="/logo.svg" alt="AssetTrack" style={{ height: 36, width: 'auto', marginBottom: '8px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '16px 0 4px 0' }}>
            Create an account
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Join AssetTrack to start renting assets
          </p>
          <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', margin: '20px 0 0 0' }} />
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', margin: '16px 0 0 0', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
            <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>{error}</span>
          </div>
        )}
        {success && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', margin: '16px 0 0 0', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
            <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>Account created! Redirecting to login…</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>

            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text" placeholder="Jane Doe" value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required disabled={loading} autoComplete="name"
                  style={inputBase} onFocus={onFocus} onBlur={onBlur}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required disabled={loading} autoComplete="email"
                  style={inputBase} onFocus={onFocus} onBlur={onBlur}
                />
              </div>
            </div>

            {/* Password + Confirm — 2 col */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Password</label>
                <PwInput value={password} onChange={setPassword} placeholder="Min. 8 chars" disabled={loading} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Confirm Password</label>
                <PwInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Re-enter password"
                  disabled={loading}
                  borderColor={confirmBorder}
                />
                {confirmMismatch && (
                  <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0 0' }}>Passwords don't match</p>
                )}
              </div>
            </div>

            {/* Strength bar */}
            {password && (
              <div>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
                  {[1, 2, 3, 4].map((seg) => (
                    <div key={seg} style={{
                      flex: 1, height: '4px', borderRadius: '4px',
                      background: seg <= strength.score ? strength.color : '#e5e7eb',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Password strength</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: strength.color }}>{strength.label}</span>
                </div>
              </div>
            )}

            {/* Terms checkbox */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <div
                onClick={() => setTermsAccepted(v => !v)}
                style={{
                  width: 16, height: 16, borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                  border: `1.5px solid ${termsAccepted ? '#2563eb' : '#d1d5db'}`,
                  background: termsAccepted ? '#2563eb' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {termsAccepted && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                I agree to the{' '}
                <Link to="/terms" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}>
                  Terms of Service
                </Link>
                {' '}and{' '}
                <a href="#" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}>
                  Privacy Policy
                </a>
              </span>
            </label>

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%', marginTop: '20px',
              padding: '14px', borderRadius: '10px',
              background: '#1a3a6b', color: '#fff', border: 'none',
              fontSize: '15px', fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (canSubmit) {
                e.currentTarget.style.background = '#16325e'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,58,107,0.35)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1a3a6b'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            onMouseDown={(e) => { if (canSubmit) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.2)' } }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {/* Bottom link */}
        <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', marginTop: '20px', marginBottom: 0 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#00c9a7', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}>
            Sign in
          </Link>
        </p>
      </div>

      {/* ── Trust badges ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', gap: '24px', justifyContent: 'center',
        marginTop: '20px', flexWrap: 'wrap',
      }}>
        {[
          { icon: ShieldCheck, text: 'Secure & encrypted' },
          { icon: Lock,        text: 'No spam ever' },
          { icon: Star,        text: 'Free to join' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon size={14} color="#9ca3af" />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{text}</span>
          </div>
        ))}
      </div>

    </div>
  )
}

