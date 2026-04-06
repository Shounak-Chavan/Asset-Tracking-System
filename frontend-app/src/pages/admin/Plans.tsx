import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Clock, IndianRupee, AlertCircle, CheckCircle2,
  ToggleLeft, ToggleRight, BadgePercent, Shield,
} from 'lucide-react'
import { api } from '../../api'
import { useAuth } from '../../auth-context'

const schema = z.object({
  name: z.string().min(2, 'Plan name required'),
  duration_days: z.number().int().positive('Must be a positive integer'),
  daily_rate: z.number().positive('Must be positive'),
  deposit_amount: z.number().nonnegative('Cannot be negative'),
  daily_fine_rate: z.number().nonnegative('Cannot be negative'),
  damage_fee: z.number().nonnegative('Cannot be negative'),
})

type FormValues = z.infer<typeof schema>

export function AdminPlansPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const plansQuery = useQuery({
    queryKey: ['plans', token],
    queryFn: async () => {
      if (!token) return []
      return api.listRentalPlans(token)
    },
    enabled: Boolean(token),
  })

  const createMutation = useMutation({
    mutationFn: async (payload: FormValues) => {
      if (!token) throw new Error('Missing token')
      return api.createRentalPlan(token, payload)
    },
    onSuccess: async () => {
      form.reset()
      await queryClient.invalidateQueries({ queryKey: ['plans', token] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (payload: { id: number; is_active: boolean }) => {
      if (!token) throw new Error('Missing token')
      return api.updateRentalPlan(token, payload.id, { is_active: payload.is_active })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['plans', token] })
    },
  })

  const plans = plansQuery.data ?? []
  const activePlans = plans.filter((p) => p.is_active).length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rental Plans</h1>
          <p className="page-subtitle">Create and manage pricing plans with billing rules.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="badge badge-green">
            <CheckCircle2 className="w-3 h-3" /> {activePlans} Active
          </div>
          <div className="badge badge-purple">
            <CreditCard className="w-3 h-3" /> {plans.length} Total
          </div>
        </div>
      </div>

      {/* Create Form */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' }}
          >
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#e4e4e7' }}>Create New Plan</h2>
            <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>Define pricing and billing parameters</p>
          </div>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="form-group">
              <label className="form-label">Plan Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. 7 Day Standard"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="form-group">
              <label className="form-label">
                <Clock className="w-3 h-3" style={{ color: '#818cf8' }} />
                Duration (days)
              </label>
              <input
                className="form-input"
                type="number"
                placeholder="7"
                {...form.register('duration_days', { valueAsNumber: true })}
              />
              {form.formState.errors.duration_days && (
                <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> {form.formState.errors.duration_days.message}
                </p>
              )}
            </div>

            {/* Daily Rate */}
            <div className="form-group">
              <label className="form-label">
                <IndianRupee className="w-3 h-3" style={{ color: '#818cf8' }} />
                Daily Rate (₹)
              </label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                placeholder="100.00"
                {...form.register('daily_rate', { valueAsNumber: true })}
              />
              {form.formState.errors.daily_rate && (
                <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> {form.formState.errors.daily_rate.message}
                </p>
              )}
            </div>

            {/* Deposit */}
            <div className="form-group">
              <label className="form-label">
                <Shield className="w-3 h-3" style={{ color: '#818cf8' }} />
                Deposit Amount (₹)
              </label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                placeholder="500.00"
                {...form.register('deposit_amount', { valueAsNumber: true })}
              />
              {form.formState.errors.deposit_amount && (
                <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> {form.formState.errors.deposit_amount.message}
                </p>
              )}
            </div>

            {/* Daily Fine */}
            <div className="form-group">
              <label className="form-label">
                <BadgePercent className="w-3 h-3" style={{ color: '#818cf8' }} />
                Daily Fine Rate (₹)
              </label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                placeholder="50.00"
                {...form.register('daily_fine_rate', { valueAsNumber: true })}
              />
              {form.formState.errors.daily_fine_rate && (
                <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> {form.formState.errors.daily_fine_rate.message}
                </p>
              )}
            </div>

            {/* Damage Fee */}
            <div className="form-group">
              <label className="form-label">
                <AlertCircle className="w-3 h-3" style={{ color: '#818cf8' }} />
                Damage Fee (₹)
              </label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                placeholder="200.00"
                {...form.register('damage_fee', { valueAsNumber: true })}
              />
              {form.formState.errors.damage_fee && (
                <p className="error-text text-xs flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> {form.formState.errors.damage_fee.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button className="btn btn-primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Plan'}
            </button>
            {createMutation.error && (
              <p className="error-text text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {createMutation.error.message}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Existing Plans */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #27272a' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#e4e4e7' }}>Existing Plans</h2>
          {plansQuery.isLoading && (
            <span style={{ fontSize: '0.8125rem', color: '#71717a' }}>Loading...</span>
          )}
        </div>

        {plansQuery.isError ? (
          <div className="px-5 py-6">
            <p className="error-text text-sm">Failed to load plans.</p>
          </div>
        ) : plans.length === 0 && !plansQuery.isLoading ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgb(99 102 241 / 0.08)', border: '1px solid rgb(99 102 241 / 0.15)' }}
            >
              <CreditCard className="w-5 h-5" style={{ color: '#818cf8' }} />
            </div>
            <p style={{ color: '#71717a', fontSize: '0.875rem' }}>No plans yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full" style={{ minWidth: '700px' }}>
              <thead>
                <tr>
                  <th>Plan Name</th>
                  <th>Duration</th>
                  <th>Daily Rate</th>
                  <th>Deposit</th>
                  <th>Fine / day</th>
                  <th>Damage Fee</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <div style={{ fontWeight: '600', color: '#e4e4e7' }}>{plan.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#71717a' }}>ID #{plan.id}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5" style={{ color: '#d4d4d8' }}>
                        <Clock className="w-3.5 h-3.5" style={{ color: '#818cf8', flexShrink: 0 }} />
                        {plan.duration_days} days
                      </div>
                    </td>
                    <td style={{ color: '#d4d4d8' }}>₹{plan.daily_rate}/day</td>
                    <td style={{ color: '#d4d4d8' }}>₹{plan.deposit_amount}</td>
                    <td style={{ color: '#d4d4d8' }}>₹{plan.daily_fine_rate}</td>
                    <td style={{ color: '#d4d4d8' }}>₹{plan.damage_fee}</td>
                    <td>
                      <button
                        className={plan.is_active ? 'btn btn-secondary' : 'btn btn-primary'}
                        style={{ height: '2rem', padding: '0 0.75rem', fontSize: '0.8125rem', gap: '0.375rem' }}
                        type="button"
                        onClick={() => toggleMutation.mutate({ id: plan.id, is_active: !plan.is_active })}
                        disabled={toggleMutation.isPending}
                      >
                        {plan.is_active
                          ? <><ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> Active</>
                          : <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {toggleMutation.error && (
          <div className="px-5 py-3" style={{ borderTop: '1px solid #27272a' }}>
            <p className="error-text text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {toggleMutation.error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
