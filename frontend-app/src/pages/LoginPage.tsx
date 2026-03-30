import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, AlertCircle, Loader2, Zap } from 'lucide-react'
import { useAuth } from '../auth-context'

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    setError('')
    try {
      await login(values)
      navigate('/assets')
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message)
      } else {
        setError('Login failed. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
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
              <LogIn className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Welcome back</h1>
              <p className="text-xs text-surface-400">Sign in to your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Email */}
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary-400" /> Email address
              </label>
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
              <label className="form-label flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary-400" /> Password
              </label>
              <input
                type="password"
                className={`form-input ${errors.password ? 'border-rose-500/50' : ''}`}
                placeholder="••••••••"
                {...register('password')}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="error-text text-xs mt-0.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Error */}
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

            {/* Submit */}
            <motion.button
              type="submit"
              className="btn-primary btn w-full mt-1"
              disabled={isSubmitting}
              whileTap={{ scale: 0.97 }}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </motion.button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm text-surface-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-4 flex items-center gap-2 text-xs text-surface-500 justify-center">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Connected to live FastAPI backend
        </div>
      </motion.div>
    </div>
  )
}
