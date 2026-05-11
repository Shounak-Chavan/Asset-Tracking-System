import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Clock, IndianRupee, Shield, CreditCard, AlertCircle } from "lucide-react"
import { api } from "../../api"
import { useAuth } from "../../auth-context"

const schema = z.object({
  name: z.string().min(2, "Plan name must be at least 2 characters"),
  duration_days: z.number({ invalid_type_error: "Duration is required" }).int("Must be a whole number").positive("Must be greater than 0"),
  daily_rate: z.number({ invalid_type_error: "Daily rate is required" }).positive("Must be greater than 0"),
  deposit_amount: z.number({ invalid_type_error: "Deposit amount is required" }).min(0, "Must be 0 or greater"),
  daily_fine_rate: z.number({ invalid_type_error: "Late fine is required" }).min(0, "Must be 0 or greater"),
  damage_fee: z.number({ invalid_type_error: "Damage fee is required" }).min(0, "Must be 0 or greater"),
})

type FormValues = z.infer<typeof schema>

const inputStyle: React.CSSProperties = {
  width: '100%', height: '42px',
  border: '1.5px solid rgba(201,169,110,0.3)', borderRadius: '8px',
  padding: '0 12px', fontSize: '14px', color: '#F5ECD7',
  background: '#1A0A12', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#C9A96E',
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
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Rental Logic
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: 0 }}>
          Configure pricing tiers, duration, and penalty logic.
        </p>
      </div>

      {/* Create form card */}
      <div style={{
        background: '#2D1020', border: '1px solid rgba(201,169,110,0.15)',
        borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid rgba(201,169,110,0.15)',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#3A1528',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(201,169,110,0.2)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CreditCard size={15} />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#F5ECD7' }}>
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
                  {label}{hint && <span style={{ color: '#9E8070', fontWeight: 400, marginLeft: '4px' }}>({hint})</span>}
                </label>
                <input
                  style={{
                    ...inputStyle,
                    borderColor: form.formState.errors[name] ? '#ef4444' : form.formState.touchedFields[name] && !form.formState.errors[name] ? '#22c55e' : 'rgba(201,169,110,0.3)',
                  }}
                  placeholder={placeholder}
                  type={name === 'name' ? 'text' : 'number'}
                  step={name !== 'name' && name !== 'duration_days' ? '0.01' : undefined}
                  {...form.register(name, name !== 'name' ? { valueAsNumber: true } : {})}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#C9A96E' }}
                  onBlur={(e) => {
                    form.trigger(name)
                    e.currentTarget.style.borderColor = form.formState.errors[name] ? '#ef4444' : 'rgba(201,169,110,0.3)'
                  }}
                />
                {form.formState.errors[name] && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ef4444', margin: '4px 0 0 0' }}>
                    <AlertCircle size={12} color="#ef4444" style={{ flexShrink: 0 }} />
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
                background: '#C9A96E', color: '#1E0A14',
                border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: 500,
                cursor: 'pointer', userSelect: 'none',
                opacity: createMutation.isPending ? 0.7 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!createMutation.isPending) e.currentTarget.style.background = '#E8C98A' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#C9A96E' }}
            >
              {createMutation.isPending ? 'Saving...' : 'Create Pricing Plan'}
            </button>
            {createMutation.error && (
              <span style={{ fontSize: '13px', color: '#E07070' }}>
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
              width: '220px', background: '#2D1020', border: '1px solid rgba(201,169,110,0.15)',
              borderRadius: '12px', padding: '20px 22px',
            }}>
              {[40, 60, 30, 30, 30].map((w, j) => (
                <div key={j} style={{ height: '14px', background: '#3A1528', borderRadius: '4px', width: `${w}%`, marginBottom: '10px' }} />
              ))}
            </div>
          ))
        ) : plans.map((p) => (
          <div key={p.id} style={{
            background: '#2D1020', border: '1px solid rgba(201,169,110,0.2)',
            borderRadius: '16px', padding: '20px 22px',
            minWidth: '220px', width: 'fit-content',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, color: '#C9A96E', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px' }}>
                PLAN #{p.id}
              </p>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#F5ECD7', margin: 0 }}>{p.name}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {[
                { icon: Clock,        label: 'Duration',   value: `${p.duration_days} Days` },
                { icon: IndianRupee,  label: 'Daily Rate', value: `₹${p.daily_rate}` },
                { icon: Shield,       label: 'Deposit',    value: `₹${p.deposit_amount}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#9E8070', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon size={13} /> {label}
                  </span>
                  <strong style={{ color: '#F5ECD7' }}>{value}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: `Damage ₹${p.damage_fee}` },
                { label: `Late ₹${p.daily_fine_rate}/d` },
              ].map(({ label }) => (
                <span key={label} style={
                  label.startsWith('Damage')
                    ? { background: '#3D0808', color: '#E07070', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 500 }
                    : { background: '#2D1A00', color: '#C9A96E', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 500 }
                }>
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
