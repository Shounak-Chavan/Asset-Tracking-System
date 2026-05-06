import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../auth-context'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const me = await login({ email, password })
      navigate(me.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    paddingTop: '13px', paddingBottom: '13px',
    paddingLeft: '42px', paddingRight: '16px',
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

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Background blobs ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', top: -100, left: -150, filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(124,58,237,0.06)', bottom: -80, right: -100, filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(59,130,246,0.05)', top: '40%', left: '60%', filter: 'blur(70px)' }} />
      </div>

      {/* ── Card ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '440px',
        background: '#fff',
        borderRadius: '20px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        padding: '48px 44px',
      }}>

        {/* Brand header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '36px' }}>
          {/* Logo */}
          <img src="/logo.svg" alt="AssetTrack" style={{ height: 36, width: 'auto', marginBottom: '8px' }} />

          {/* Divider */}
          <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
            Welcome back 👋
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Sign in to continue to your account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            padding: '12px 14px', marginBottom: '20px',
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
          }}>
            <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  style={inputBase}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                  Password
                </label>
                <a
                  href="#"
                  style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  style={{ ...inputBase, paddingRight: '42px' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', marginTop: '24px',
              padding: '14px', borderRadius: '10px',
              background: loading ? '#7fa8d4' : '#1a3a6b',
              color: '#fff', border: 'none',
              fontSize: '15px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#16325e'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,58,107,0.35)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = loading ? '#7fa8d4' : '#1a3a6b'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.2)'
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Bottom link */}
        <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', marginTop: '24px', marginBottom: 0 }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{ color: '#00c9a7', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            Create an account
          </Link>
        </p>

      </div>
    </div>
  )
}
