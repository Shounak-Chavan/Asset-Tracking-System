import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import { z } from 'zod'
import { User, Mail, Phone, Lock, Shield, CheckCircle2, AlertCircle } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth-context'

const profileSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
})

const passwordSchema = z
  .object({
    current_password: z.string().min(6),
    new_password: z.string().min(6),
    confirm_password: z.string().min(6),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const { token, user } = useAuth()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: user?.full_name ?? '',
      phone: user?.phone ?? '',
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: ProfileForm) => {
      if (!token) throw new Error('Missing token')
      return api.updateMe(token, payload)
    },
    onSuccess: async () => {
      setMessage('Profile updated successfully')
      await queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: PasswordForm) => {
      if (!token) throw new Error('Missing token')
      return api.changePassword(token, {
        current_password: payload.current_password,
        new_password: payload.new_password,
      })
    },
    onSuccess: () => {
      setMessage('Password changed successfully')
      setIsPasswordOpen(false)
      passwordForm.reset()
    },
  })

  const initials = (user?.full_name ?? 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {user?.role === 'admin' ? 'Admin Profile' : 'My Profile'}
          </h1>
          <p className="page-subtitle">Manage your account details and security settings</p>
        </div>
      </div>

      {/* Profile Banner */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' }}
          >
            {initials}
          </div>

          {/* User Info */}
          <div className="flex flex-col gap-1 text-center sm:text-left flex-1">
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#ffffff' }}>
              {user?.full_name ?? 'User'}
            </h2>
            <div className="flex items-center gap-1.5 justify-center sm:justify-start" style={{ color: '#71717a', fontSize: '0.875rem' }}>
              <Mail style={{ width: '0.875rem', height: '0.875rem' }} />
              {user?.email ?? '—'}
            </div>
            {user?.phone && (
              <div className="flex items-center gap-1.5 justify-center sm:justify-start" style={{ color: '#71717a', fontSize: '0.875rem' }}>
                <Phone style={{ width: '0.875rem', height: '0.875rem' }} />
                {user.phone}
              </div>
            )}
            <div className="mt-1 flex justify-center sm:justify-start">
              <span className={`badge ${user?.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>
                {user?.role === 'admin' ? <Shield style={{ width: '0.75rem', height: '0.75rem' }} /> : <User style={{ width: '0.75rem', height: '0.75rem' }} />}
                {user?.role === 'admin' ? 'Administrator' : 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{ background: 'rgb(16 185 129 / 0.08)', border: '1px solid rgb(16 185 129 / 0.2)' }}
          >
            <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#34d399', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: '#6ee7b7' }}>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of cards */}
      <div className="flex flex-col gap-5">
        {/* Profile Information */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#e4e4e7', marginBottom: '1.25rem' }}>
            Profile Information
          </h2>
          <form
            className="flex flex-col gap-4"
            onSubmit={profileForm.handleSubmit((values) => {
              setMessage('')
              updateProfileMutation.mutate(values)
            })}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Your full name"
                  {...profileForm.register('full_name')}
                />
                {profileForm.formState.errors.full_name && (
                  <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                    <AlertCircle style={{ width: '0.75rem', height: '0.75rem' }} />
                    {profileForm.formState.errors.full_name.message}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="+91 98765 43210"
                  {...profileForm.register('phone')}
                />
                {profileForm.formState.errors.phone && (
                  <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                    <AlertCircle style={{ width: '0.75rem', height: '0.75rem' }} />
                    {profileForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <button className="btn btn-primary" type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              {updateProfileMutation.error && (
                <p className="error-text text-xs">{updateProfileMutation.error.message}</p>
              )}
            </div>
          </form>
        </div>

        {/* Password & Security */}
        <div className="card">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#e4e4e7' }}>
                Password & Security
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '0.25rem' }}>
                Keep your account secure with a strong password
              </p>
            </div>
            {!isPasswordOpen && (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setMessage('')
                  setIsPasswordOpen(true)
                }}
              >
                <Lock style={{ width: '0.875rem', height: '0.875rem' }} />
                Change Password
              </button>
            )}
          </div>

          <AnimatePresence>
            {isPasswordOpen && (
              <motion.form
                className="flex flex-col gap-4"
                onSubmit={passwordForm.handleSubmit((values) => {
                  setMessage('')
                  changePasswordMutation.mutate(values)
                })}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="••••••••"
                    {...passwordForm.register('current_password')}
                  />
                  {passwordForm.formState.errors.current_password && (
                    <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                      <AlertCircle style={{ width: '0.75rem', height: '0.75rem' }} />
                      {passwordForm.formState.errors.current_password.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      className="form-input"
                      type="password"
                      placeholder="Min. 6 characters"
                      {...passwordForm.register('new_password')}
                    />
                    {passwordForm.formState.errors.new_password && (
                      <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                        <AlertCircle style={{ width: '0.75rem', height: '0.75rem' }} />
                        {passwordForm.formState.errors.new_password.message}
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input
                      className="form-input"
                      type="password"
                      placeholder="Repeat new password"
                      {...passwordForm.register('confirm_password')}
                    />
                    {passwordForm.formState.errors.confirm_password && (
                      <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                        <AlertCircle style={{ width: '0.75rem', height: '0.75rem' }} />
                        {passwordForm.formState.errors.confirm_password.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap mt-1">
                  <button className="btn btn-primary" type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => {
                      setIsPasswordOpen(false)
                      passwordForm.reset()
                    }}
                    disabled={changePasswordMutation.isPending}
                  >
                    Cancel
                  </button>
                  {changePasswordMutation.error && (
                    <p className="error-text text-xs">{changePasswordMutation.error.message}</p>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {!isPasswordOpen && (
            <div className="flex items-center gap-2" style={{ color: '#52525b', fontSize: '0.875rem' }}>
              <Lock style={{ width: '0.875rem', height: '0.875rem' }} />
              Password last updated: —
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
