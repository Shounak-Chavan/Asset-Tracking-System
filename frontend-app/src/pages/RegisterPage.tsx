import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { UserPlus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '../auth-context'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    setError('')
    setMessage('')
    try {
      await registerUser(values)
      setMessage('Account created! Redirecting to login...')
      setTimeout(() => navigate('/login'), 1200)
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message)
      } else {
        setError('Registration failed. Please try again.')
      }
    }
  }

  return (
    <div className="auth-shell">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <span className="text-white font-black text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-white">AssetFlow</span>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Create account</h1>
              <p className="text-xs text-surface-400">Join AssetFlow today</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className={`form-input ${errors.full_name ? 'border-rose-500/50' : ''}`}
                placeholder="John Doe"
                {...register('full_name')}
                autoComplete="name"
              />
              {errors.full_name && (
                <p className="error-text text-xs mt-0.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'border-rose-500/50' : ''}`}
                placeholder="you@example.com"
                {...register('email')}
                autoComplete="email"
              />
              {errors.email && (
                <p className="error-text text-xs mt-0.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className={`form-input ${errors.password ? 'border-rose-500/50' : ''}`}
                placeholder="••••••••"
                {...register('password')}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="error-text text-xs mt-0.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Feedback */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <p className="text-sm text-rose-300">{error}</p>
              </motion.div>
            )}
            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-300">{message}</p>
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              className="btn-primary btn w-full mt-1"
              disabled={isSubmitting}
              whileTap={{ scale: 0.97 }}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Create Account</>
              )}
            </motion.button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm text-surface-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
