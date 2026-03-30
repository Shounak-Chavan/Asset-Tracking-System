import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import { z } from 'zod'
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
      setMessage('Profile updated')
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
      setMessage('Password changed')
      setIsPasswordOpen(false)
      passwordForm.reset()
    },
  })

  return (
    <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">{user?.role === 'admin' ? 'Admin Profile' : 'User Profile'}</h1>
        <p className="text-sm text-slate-400">Manage account details and keep credentials updated.</p>
      </header>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg p-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-2xl font-semibold text-indigo-300">
            {(user?.full_name ?? 'U').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-white">{user?.full_name ?? 'User'}</p>
            <p className="text-sm text-zinc-400">{user?.email ?? 'No email available'}</p>
            <p className="text-xs text-zinc-500 capitalize">Role: {user?.role ?? 'user'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-2xl border shadow-lg p-6 bg-zinc-900 border-zinc-800 space-y-6">
          <h2 className="text-lg font-semibold text-white">Profile Information</h2>
          <form
            className="space-y-6"
            onSubmit={profileForm.handleSubmit((values) => updateProfileMutation.mutate(values))}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group md:col-span-2">
                <label className="form-label">Full Name</label>
                <input className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200" type="text" {...profileForm.register('full_name')} />
                {profileForm.formState.errors.full_name && (
                  <p className="text-xs text-rose-400">{profileForm.formState.errors.full_name.message}</p>
                )}
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Phone</label>
                <input className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200" type="text" {...profileForm.register('phone')} />
                {profileForm.formState.errors.phone && (
                  <p className="text-xs text-rose-400">{profileForm.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button className="btn btn-primary" type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </button>
              {updateProfileMutation.error && (
                <p className="text-xs text-rose-400">{updateProfileMutation.error.message}</p>
              )}
            </div>
          </form>
        </div>

        <div className="rounded-2xl border shadow-lg p-6 bg-zinc-900 border-zinc-800 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Password & Security</h2>
              <p className="text-sm text-zinc-400">Update your credentials only when needed.</p>
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
                Change Password
              </button>
            )}
          </div>

          <AnimatePresence>
            {isPasswordOpen && (
              <motion.form
                className="space-y-6"
                onSubmit={passwordForm.handleSubmit((values) => changePasswordMutation.mutate(values))}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group md:col-span-2">
                    <label className="form-label">Current Password</label>
                    <input className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200" type="password" {...passwordForm.register('current_password')} />
                    {passwordForm.formState.errors.current_password && (
                      <p className="text-xs text-rose-400">{passwordForm.formState.errors.current_password.message}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200" type="password" {...passwordForm.register('new_password')} />
                    {passwordForm.formState.errors.new_password && (
                      <p className="text-xs text-rose-400">{passwordForm.formState.errors.new_password.message}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200" type="password" {...passwordForm.register('confirm_password')} />
                    {passwordForm.formState.errors.confirm_password && (
                      <p className="text-xs text-rose-400">{passwordForm.formState.errors.confirm_password.message}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <button className="btn btn-secondary" type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? 'Updating...' : 'Save Password'}
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
                    <p className="text-xs text-rose-400">{changePasswordMutation.error.message}</p>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl shadow-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-300">{message}</p>
        </div>
      )}
    </section>
  )
}
