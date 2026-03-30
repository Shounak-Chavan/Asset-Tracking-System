import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '../../api'
import { useAuth } from '../../auth-context'

const schema = z.object({
  name: z.string().min(2),
  duration_days: z.number().int().positive(),
  daily_rate: z.number().positive(),
  deposit_amount: z.number().nonnegative(),
  daily_fine_rate: z.number().nonnegative(),
  damage_fee: z.number().nonnegative(),
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

  if (plansQuery.isLoading) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border shadow-lg p-6 border-zinc-800 bg-zinc-900">
          Loading rental plans...
        </div>
      </section>
    )
  }

  if (plansQuery.isError) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border shadow-lg p-6 border-zinc-800 bg-zinc-900">
          Failed to load rental plans.
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Rental Plans</h1>
        <p className="text-sm text-zinc-400">Create and manage pricing plans with consistent billing rules.</p>
      </header>

      <div className="rounded-2xl border shadow-lg p-6 border-zinc-800 bg-zinc-900 space-y-6 w-full">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-zinc-200">Create New Plan</h2>
          <p className="text-xs text-zinc-500">Fill pricing details to add a rental plan.</p>
        </div>

        <div className="border-t border-zinc-800 pt-6">
        <form className="space-y-6" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input h-10" type="text" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-xs text-rose-400">{form.formState.errors.name.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Duration Days</label>
              <input className="form-input h-10" type="number" {...form.register('duration_days', { valueAsNumber: true })} />
              {form.formState.errors.duration_days && <p className="text-xs text-rose-400">{form.formState.errors.duration_days.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Daily Rate</label>
              <input className="form-input h-10" type="number" step="0.01" {...form.register('daily_rate', { valueAsNumber: true })} />
              {form.formState.errors.daily_rate && <p className="text-xs text-rose-400">{form.formState.errors.daily_rate.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Deposit Amount</label>
              <input className="form-input h-10" type="number" step="0.01" {...form.register('deposit_amount', { valueAsNumber: true })} />
              {form.formState.errors.deposit_amount && <p className="text-xs text-rose-400">{form.formState.errors.deposit_amount.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Daily Fine Rate</label>
              <input className="form-input h-10" type="number" step="0.01" {...form.register('daily_fine_rate', { valueAsNumber: true })} />
              {form.formState.errors.daily_fine_rate && <p className="text-xs text-rose-400">{form.formState.errors.daily_fine_rate.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Damage Fee</label>
              <input className="form-input h-10" type="number" step="0.01" {...form.register('damage_fee', { valueAsNumber: true })} />
              {form.formState.errors.damage_fee && <p className="text-xs text-rose-400">{form.formState.errors.damage_fee.message}</p>}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Plan'}
            </button>
            {createMutation.error && <p className="text-xs text-rose-400">{createMutation.error.message}</p>}
          </div>
        </form>
        </div>
      </div>

      <div className="rounded-2xl border shadow-lg p-6 border-zinc-800 bg-zinc-900 space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-medium text-zinc-200">Existing Plans</h2>
            <p className="text-xs text-zinc-500">Toggle active status for current plans.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table min-w-[900px]">
            <thead>
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">Daily</th>
                <th className="px-4 py-2">Deposit</th>
                <th className="px-4 py-2">Fine</th>
                <th className="px-4 py-2">Damage Fee</th>
                <th className="px-4 py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {plansQuery.data?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-2 text-slate-400">
                    No rental plans found.
                  </td>
                </tr>
              )}
              {plansQuery.data?.map((plan) => (
                <tr key={plan.id}>
                  <td className="px-4 py-2">{plan.id}</td>
                  <td className="px-4 py-2">{plan.name}</td>
                  <td className="px-4 py-2">{plan.duration_days}</td>
                  <td className="px-4 py-2">{plan.daily_rate}</td>
                  <td className="px-4 py-2">{plan.deposit_amount}</td>
                  <td className="px-4 py-2">{plan.daily_fine_rate}</td>
                  <td className="px-4 py-2">{plan.damage_fee}</td>
                  <td className="px-4 py-2">
                    {(() => {
                      const buttonText = toggleMutation.isPending
                        ? 'Updating...'
                        : plan.is_active
                          ? 'Deactivate'
                          : 'Activate'

                      return (
                        <button
                          className={plan.is_active ? 'btn btn-secondary' : 'btn btn-primary'}
                          type="button"
                          onClick={() => toggleMutation.mutate({ id: plan.id, is_active: !plan.is_active })}
                          disabled={toggleMutation.isPending}
                        >
                          {buttonText}
                        </button>
                      )
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {toggleMutation.error && <p className="text-xs text-rose-400">{toggleMutation.error.message}</p>}
      </div>
    </section>
  )
}
