import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Mail, Lock, Loader2, Check } from 'lucide-react'
import { useAuth } from '../auth-context'
import { validateEmail } from '../utils/validation'

function FieldError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ef4444', margin: '4px 0 0 0' }}>
      <AlertCircle size={12} color="#ef4444" style={{ flexShrink: 0 }} />
      {message}
    </p>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = (field: string, value: string) => {
    let err: string | null = null
    if (field === 'email') err = validateEmail(value)
    if (field === 'password') err = !value ? 'Password is required' : value.length < 8 ? 'Password must be at least 8 characters' : null
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors = {
      email: validateEmail(email),
      password: !password ? 'Password is required' : password.length < 8 ? 'Password must be at least 8 characters' : null,
    }
    setErrors(newErrors)
    setTouched({ email: true, password: true })

    if (Object.values(newErrors).some(Boolean)) {
      const firstErrorField = document.querySelector('[data-invalid="true"]') as HTMLElement
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstErrorField?.focus()
      return
    }

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
    borderRadius: '10px',
    outline: 'none', background: '#fff',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  const emailBorder = getFieldBorder('email', email)
  const pwBorder = getFieldBorder('password', password)

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: 'linear-gradient(135deg, #e8f4fd 0%, #eef6ff 50%, #f0fdf9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background blobs */}
      <div style={{ position: 'fixed', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(0,201,167,0.08)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(26,58,107,0.06)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.2, pointerEvents: 'none', zIndex: 0 }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '460px',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.8)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.6) inset',
        padding: '44px',
      }}>

        {/* Brand header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '36px' }}>
          <img src="/logo.svg" alt="AssetTrack" style={{ height: 36, width: 'auto', marginBottom: '8px' }} />
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

        <form onSubmit={handleSubmit} noValidate>
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
                  onChange={(e) => { setEmail(e.target.value); if (touched.email) validateField('email', e.target.value) }}
                  onBlur={() => handleBlur('email', email)}
                  disabled={loading}
                  autoComplete="email"
                  data-invalid={touched.email && !!errors.email ? 'true' : undefined}
                  style={{ ...inputBase, border: `1.5px solid ${emailBorder}`, paddingRight: touched.email && !errors.email && email ? '42px' : '16px' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#1a3a6b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,58,107,0.08)' }}
                />
                {touched.email && !errors.email && email && (
                  <Check size={16} color="#22c55e" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                )}
              </div>
              <FieldError message={touched.email ? errors.email ?? null : null} />
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
                  onChange={(e) => { setPassword(e.target.value); if (touched.password) validateField('password', e.target.value) }}
                  onBlur={() => handleBlur('password', password)}
                  disabled={loading}
                  autoComplete="current-password"
                  data-invalid={touched.password && !!errors.password ? 'true' : undefined}
                  style={{ ...inputBase, border: `1.5px solid ${pwBorder}`, paddingRight: '42px' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#1a3a6b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,58,107,0.08)' }}
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
              <FieldError message={touched.password ? errors.password ?? null : null} />
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
