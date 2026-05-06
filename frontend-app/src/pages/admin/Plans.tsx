import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Clock, IndianRupee, Shield, CreditCard } from "lucide-react"
import { api } from "../../api"
import { useAuth } from "../../auth-context"

const schema = z.object({
  name: z.string().min(2, "Plan name required"),
  duration_days: z.number().int().positive("Must be > 0"),
  daily_rate: z.number().nonnegative(),
  deposit_amount: z.number().nonnegative(),
  daily_fine_rate: z.number().nonnegative(),
  damage_fee: z.number().nonnegative(),
})

type FormValues = z.infer<typeof schema>

const inputStyle: React.CSSProperties = {
  width: '100%', height: '42px',
  border: '1.5px solid #d1d5db', borderRadius: '8px',
  padding: '0 12px', fontSize: '14px', color: '#111827',
  background: 'white', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#374151',
  display: 'block', marginBottom: '6px',
}

export function AdminPlansPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: async () => api.listRentalPlans(token!),
    enabled: Boolean(token),
  })

  const createMutation = useMutation({
    mutationFn: async (payload: FormValues) => api.createRentalPlan(token!, payload),
    onSuccess: async () => {
      form.reset()
      await queryClient.invalidateQueries({ queryKey: ["plans"] })
    },
  })

  const plans = plansQuery.data ?? []

  const fields: { name: keyof FormValues; label: string; placeholder: string; hint?: string }[] = [
    { name: 'name',           label: 'Plan Name',    placeholder: 'e.g. 7 Day Standard' },
    { name: 'duration_days',  label: 'Duration',     placeholder: '7',      hint: 'Days' },
    { name: 'daily_rate',     label: 'Daily Rate',   placeholder: '100.00', hint: '₹' },
    { name: 'deposit_amount', label: 'Deposit Amt.', placeholder: '500.00', hint: '₹' },
    { name: 'daily_fine_rate',label: 'Late Fine/Day',placeholder: '50.00',  hint: '₹' },
    { name: 'damage_fee',     label: 'Damage Fee',   placeholder: '200.00', hint: '₹' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>
          Rental Logic
        </h1>
        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>
          Configure pricing tiers, duration, and penalty logic.
        </p>
      </div>

      {/* Create form card */}
      <div style={{
        background: '#ffffff', border: '1px solid #e5e7eb',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#f9fafb',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: '#2563eb', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CreditCard size={15} />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
            Create New Rental Plan
          </span>
        </div>

        <form
          onSubmit={form.handleSubmit((vals) => createMutation.mutate(vals))}
          style={{ padding: '22px' }}
        >
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px',
            marginBottom: '20px',
          }}>
            {fields.map(({ name, label, placeholder, hint }) => (
              <div key={name}>
                <label style={labelStyle}>
                  {label}{hint && <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: '4px' }}>({hint})</span>}
                </label>
                <input
                  style={inputStyle}
                  placeholder={placeholder}
                  type={name === 'name' ? 'text' : 'number'}
                  step={name !== 'name' && name !== 'duration_days' ? '0.01' : undefined}
                  {...form.register(name, name !== 'name' ? { valueAsNumber: true } : {})}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db' }}
                />
                {form.formState.errors[name] && (
                  <p style={{ fontSize: '11px', color: '#dc2626', margin: '4px 0 0' }}>
                    {form.formState.errors[name]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                height: '40px', padding: '0 20px',
                background: '#2563eb', color: 'white',
                border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: 500,
                cursor: 'pointer', userSelect: 'none',
                opacity: createMutation.isPending ? 0.7 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!createMutation.isPending) e.currentTarget.style.background = '#1d4ed8' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb' }}
            >
              {createMutation.isPending ? 'Saving...' : 'Create Pricing Plan'}
            </button>
            {createMutation.error && (
              <span style={{ fontSize: '13px', color: '#dc2626' }}>
                {createMutation.error.message}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {plansQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              width: '220px', background: '#ffffff', border: '1px solid #e5e7eb',
              borderRadius: '12px', padding: '20px 22px',
            }}>
              {[40, 60, 30, 30, 30].map((w, j) => (
                <div key={j} style={{ height: '14px', background: '#f3f4f6', borderRadius: '4px', width: `${w}%`, marginBottom: '10px' }} />
              ))}
            </div>
          ))
        ) : plans.map((p) => (
          <div key={p.id} style={{
            background: '#ffffff', border: '1px solid #e5e7eb',
            borderRadius: '12px', padding: '20px 22px',
            minWidth: '220px', width: 'fit-content',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px' }}>
                PLAN #{p.id}
              </p>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>{p.name}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {[
                { icon: Clock,        label: 'Duration',   value: `${p.duration_days} Days` },
                { icon: IndianRupee,  label: 'Daily Rate', value: `₹${p.daily_rate}` },
                { icon: Shield,       label: 'Deposit',    value: `₹${p.deposit_amount}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon size={13} /> {label}
                  </span>
                  <strong style={{ color: '#111827' }}>{value}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: `Damage ₹${p.damage_fee}` },
                { label: `Late ₹${p.daily_fine_rate}/d` },
              ].map(({ label }) => (
                <span key={label} style={{
                  background: '#fee2e2', color: '#dc2626',
                  padding: '4px 10px', borderRadius: '6px',
                  fontSize: '12px', fontWeight: 500,
                }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
