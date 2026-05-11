import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Shirt } from 'lucide-react'
import { useAuth } from '../../auth-context'

export function DryCleaningLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true); setError('')
    try {
      const user = await login({ email, password })
      if (user.role !== 'dry_cleaner' && user.role !== 'admin') {
        setError('You do not have access to this portal.')
        setLoading(false); return
      }
      navigate('/dry-cleaning/portal')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.')
    } finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px 12px 42px',
    fontSize: 14,
    color: 'var(--color-text-primary)',
    background: 'var(--color-bg-secondary)',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(201,169,110,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,110,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none', zIndex: 0 }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420,
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 16, padding: '44px 40px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Corner ornaments */}
        <div style={{ position: 'absolute', top: 16, left: 16, width: 32, height: 32, borderTop: '1px solid var(--color-border-strong)', borderLeft: '1px solid var(--color-border-strong)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 16, right: 16, width: 32, height: 32, borderBottom: '1px solid var(--color-border-strong)', borderRight: '1px solid var(--color-border-strong)', pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'rgba(201,169,110,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shirt size={24} color="var(--color-accent-gold)" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 26, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>
            Staff Portal
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
            Sign in to manage dry cleaning requests
          </p>
          <hr className="gold-divider" style={{ margin: '20px auto 0', maxWidth: 60 }} />
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(224,112,112,0.08)', border: '1px solid rgba(224,112,112,0.25)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 20 }}>
            <AlertCircle size={14} color="var(--color-error)" style={{ flexShrink: 0 }} />
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-error)', margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
              Work Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color="var(--color-text-faint)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--color-accent-gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.1)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="var(--color-text-faint)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" style={{ ...inputStyle, paddingRight: 42 }}
                onFocus={e => { e.target.style.borderColor = 'var(--color-accent-gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.1)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-text-faint)', display: 'flex', alignItems: 'center' }} aria-label={showPassword ? 'Hide' : 'Show'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-gold" style={{ width: '100%', padding: '13px', fontSize: '0.75rem', justifyContent: 'center', marginTop: 4, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-faint)', textAlign: 'center', marginTop: 20, position: 'relative', zIndex: 1 }}>
        This portal is for authorized staff only.{' '}
        <Link to="/" style={{ color: 'var(--color-accent-gold)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >
          ← Main site
        </Link>
      </p>
    </div>
  )
}
