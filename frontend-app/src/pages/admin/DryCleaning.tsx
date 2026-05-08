import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Shirt, Inbox, CheckCircle2, Clock, Send, Plus, X, Phone, Zap, Eye, EyeOff, Calendar } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../../api'
import { useAuth } from '../../auth-context'
import { Alert } from '../../components/ui/Alert'
import type { User, DryCleaningRequest } from '../../types'

const SPECS = ['Silk', 'Cotton', 'Embroidery', 'Heavy Fabric', 'Delicate', 'Leather', 'General']

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function daysSince(d: string | null) {
  if (!d) return 0
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
}

function AssetThumb({ url, name }: { url: string | null; name: string }) {
  return url
    ? <img src={url} alt={name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #e5e7eb' }} />
    : <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Shirt size={20} color="#9ca3af" /></div>
}

function EmptyCol({ msg }: { msg: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: 8 }}>
      <Inbox size={20} color="#d1d5db" />
      <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, fontStyle: 'italic' }}>{msg}</p>
    </div>
  )
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

// ── View Jobs Modal ──────────────────────────────────────────────────────────
function ViewJobsModal({ cleaner, onClose }: { cleaner: User; onClose: () => void }) {
  const { token } = useAuth()

  const allJobsQuery = useQuery({
    queryKey: ['dc-all-jobs-for-cleaner', cleaner.id, token],
    queryFn: () => api.listDryCleaningRequests(token!),
    enabled: Boolean(token),
  })

  const jobs = (allJobsQuery.data ?? []).filter(
    r => r.dry_cleaner_name === cleaner.full_name
  )

  const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
    sent:        { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    in_progress: { bg: '#dbeafe', color: '#1e40af', label: 'In Progress' },
    completed:   { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
    pending:     { bg: '#f3f4f6', color: '#6b7280', label: 'Pending Send' },
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
      <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.15)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#00c9a7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials(cleaner.full_name)}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{cleaner.full_name}'s Jobs</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>{jobs.length} total assignment{jobs.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {allJobsQuery.isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: 64, background: '#f3f4f6', borderRadius: 10, opacity: 0.5 }} />)}
            </div>
          ) : jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Inbox size={28} color="#d1d5db" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>No jobs assigned to {cleaner.full_name} yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {jobs.map(r => {
                const s = statusStyle[r.status] ?? statusStyle.pending
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                    <AssetThumb url={r.asset?.image_url ?? null} name={r.asset?.name ?? ''} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.asset?.name}</p>
                      <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>
                        Sent {fmt(r.sent_at)}{r.completed_at ? ` · Done ${fmt(r.completed_at)}` : ''}
                      </p>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, flexShrink: 0 }}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: '100%', height: 38, borderRadius: 8, background: '#f3f4f6', color: '#374151', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Close</button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Add Dry Cleaner Modal — creates a user account with dry_cleaner role ─────
function AddCleanerModal({ onClose, onSaved }: { onClose: () => void; onSaved: (name: string) => void }) {
  const { token } = useAuth()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' })
  const [specs, setSpecs] = useState<string[]>([])
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.createDryCleanerUser(token!, {
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
    }),
    onSuccess: (data) => { onSaved(data.full_name); onClose() },
    onError: (e: Error) => setErr(e.message),
  })

  const canSubmit = form.full_name.trim() && form.email.trim() && form.password.length >= 8

  const fieldStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', height: 44,
    border: '1.5px solid #e2e8f0', borderRadius: 10,
    padding: '0 16px 0 42px', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
      <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #134e4a, #00c9a7)', padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🧺</div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Add Dry Cleaner</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>Create login credentials for the cleaning staff</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', padding: '6px 8px', marginTop: 2 }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 28, maxHeight: '65vh', overflowY: 'auto' }}>
          {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{err}</div>}

          {/* Account Details */}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Account Details</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>👤</span>
                <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="e.g. Ravi Kumar" style={fieldStyle}
                  onFocus={e => { e.target.style.borderColor = '#00c9a7'; e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Work Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>✉️</span>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="ravi@cleaners.com" style={fieldStyle}
                  onFocus={e => { e.target.style.borderColor = '#00c9a7'; e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>They will use this to login at /dry-cleaning/login</p>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Temporary Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>🔒</span>
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min. 8 characters" style={{ ...fieldStyle, paddingRight: 44 }}
                  onFocus={e => { e.target.style.borderColor = '#00c9a7'; e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>Ask them to change it after first login</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

          {/* Work Details */}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Work Details</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Phone Number</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ height: 44, padding: '0 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, display: 'flex', alignItems: 'center', fontSize: 14, color: '#374151', background: '#f9fafb', flexShrink: 0 }}>+91</div>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="98765 43210"
                  style={{ flex: 1, height: 44, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 16px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#00c9a7'; e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* Specializations */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Specializations</label>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>Select fabric types they can handle</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SPECS.map(s => (
                  <button key={s} type="button" onClick={() => setSpecs(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}
                    style={{ padding: '6px 14px', borderRadius: 100, fontSize: 13, cursor: 'pointer', border: '1.5px solid', transition: 'all 0.15s', fontFamily: 'inherit', borderColor: specs.includes(s) ? '#00c9a7' : '#e2e8f0', background: specs.includes(s) ? '#f0fdf4' : '#fff', color: specs.includes(s) ? '#065f46' : '#374151', fontWeight: specs.includes(s) ? 500 : 400 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ padding: '10px 20px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: '#fff', color: '#374151', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}
            style={{ padding: '10px 24px', borderRadius: 10, background: canSubmit ? '#00c9a7' : '#e5e7eb', color: canSubmit ? '#fff' : '#9ca3af', border: 'none', fontSize: 14, fontWeight: 600, cursor: canSubmit && !mutation.isPending ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}>
            {mutation.isPending ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Assignment Modal — uses dry_cleaner role users ───────────────────────────
function AssignModal({ request, cleaners, onClose, onSent }: {
  request: DryCleaningRequest
  cleaners: User[]
  onClose: () => void
  onSent: () => void
}) {
  const { token } = useAuth()
  const [selectedCleaner, setSelectedCleaner] = useState<User | null>(null)
  const [priority, setPriority] = useState<'low' | 'normal' | 'urgent'>('normal')
  const [adminNotes, setAdminNotes] = useState('')
  const [expectedBy, setExpectedBy] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]
  })
  const [err, setErr] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.sendToDryCleaner(token!, {
      asset_id: request.asset_id,
      booking_id: request.booking_id,
      // send name only — dry_cleaner_id is a user ID, not a dry_cleaners table FK
      dry_cleaner_name: selectedCleaner?.full_name,
      priority,
      admin_notes: adminNotes || undefined,
      expected_by: expectedBy,
    }),
    onSuccess: () => { onSent(); onClose() },
    onError: (e: Error) => setErr(e.message),
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
      <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>Send to Dry Cleaner</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>{request.asset?.name} · {request.asset?.asset_code}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
        </div>

        <div style={{ padding: 24, maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#dc2626' }}>{err}</div>}

          {/* Select cleaner */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 10px' }}>Select Dry Cleaner</p>
            {cleaners.length === 0 ? (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ fontSize: 13, color: '#92400e', margin: '0 0 6px', fontWeight: 500 }}>No dry cleaners added yet.</p>
                <p style={{ fontSize: 12, color: '#b45309', margin: 0 }}>Go to the Dry Cleaning page to add one first.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cleaners.map(c => (
                  <div key={c.id} onClick={() => setSelectedCleaner(c)}
                    style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${selectedCleaner?.id === c.id ? '#00c9a7' : '#e2e8f0'}`, background: selectedCleaner?.id === c.id ? '#f0fdfa' : '#fff', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#00c9a7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {initials(c.full_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>{c.full_name}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</p>
                    </div>
                    {selectedCleaner?.id === c.id && <CheckCircle2 size={18} color="#00c9a7" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Priority</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['low', 'normal', 'urgent'] as const).map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `2px solid ${priority === p ? (p === 'urgent' ? '#dc2626' : p === 'low' ? '#9ca3af' : '#00c9a7') : '#e2e8f0'}`, background: priority === p ? (p === 'urgent' ? '#fee2e2' : p === 'low' ? '#f3f4f6' : '#f0fdfa') : '#fff', color: priority === p ? (p === 'urgent' ? '#dc2626' : p === 'low' ? '#6b7280' : '#0d9488') : '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                  {p === 'urgent' ? '🔴 ' : ''}{p}
                </button>
              ))}
            </div>
          </div>

          {/* Expected by */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Expected By</label>
            <input type="date" value={expectedBy} onChange={e => setExpectedBy(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', height: 38, borderRadius: 8, border: '1.5px solid #e2e8f0', padding: '0 10px', fontSize: 13, outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = '#00c9a7' }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
            />
          </div>

          {/* Admin notes */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Admin Notes</label>
            <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2}
              placeholder="Any special instructions for the cleaner..."
              style={{ width: '100%', boxSizing: 'border-box', borderRadius: 8, border: '1.5px solid #e2e8f0', padding: '8px 10px', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = '#00c9a7' }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
            />
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, height: 38, borderRadius: 8, background: '#f3f4f6', color: '#374151', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || cleaners.length === 0}
            style={{ flex: 2, height: 38, borderRadius: 8, background: cleaners.length > 0 ? '#00c9a7' : '#e5e7eb', color: cleaners.length > 0 ? '#fff' : '#9ca3af', border: 'none', fontSize: 13, fontWeight: 600, cursor: cleaners.length > 0 ? 'pointer' : 'not-allowed' }}>
            {mutation.isPending ? 'Sending...' : selectedCleaner ? `Send to ${selectedCleaner.full_name}` : 'Send'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export function AdminDryCleaningPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [showAddCleaner, setShowAddCleaner] = useState(false)
  const [assignRequest, setAssignRequest] = useState<DryCleaningRequest | null>(null)
  const [viewJobsCleaner, setViewJobsCleaner] = useState<User | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['dc-pending-send'] })
    queryClient.invalidateQueries({ queryKey: ['dc-active'] })
    queryClient.invalidateQueries({ queryKey: ['dc-inprogress'] })
    queryClient.invalidateQueries({ queryKey: ['dc-completed'] })
    queryClient.invalidateQueries({ queryKey: ['dc-cleaners'] })
    queryClient.invalidateQueries({ queryKey: ['admin-assets'] })
  }

  // Fetch dry_cleaner role users as the directory
  const cleanersQuery = useQuery({
    queryKey: ['dc-cleaners', token],
    queryFn: () => api.listUsers(token!, { role: 'dry_cleaner' }),
    enabled: Boolean(token),
  })

  const pendingQuery = useQuery({ queryKey: ['dc-pending-send', token], queryFn: () => api.getDryCleaningPendingSend(token!), enabled: Boolean(token) })
  const activeQuery = useQuery({ queryKey: ['dc-active', token], queryFn: () => api.listDryCleaningRequests(token!, 'sent'), enabled: Boolean(token) })
  const inProgressQuery = useQuery({ queryKey: ['dc-inprogress', token], queryFn: () => api.listDryCleaningRequests(token!, 'in_progress'), enabled: Boolean(token) })
  const completedQuery = useQuery({ queryKey: ['dc-completed', token], queryFn: () => api.listDryCleaningRequests(token!, 'completed'), enabled: Boolean(token) })

  const suspendMutation = useMutation({
    mutationFn: (id: number) => api.setUserActive(token!, id, false),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dc-cleaners'] }),
    onError: (e: Error) => setError(e.message),
  })

  const pending = pendingQuery.data ?? []
  const active = [...(activeQuery.data ?? []), ...(inProgressQuery.data ?? [])]
  const now = Date.now()
  const completed14 = (completedQuery.data ?? []).filter(r => r.completed_at && now - new Date(r.completed_at).getTime() < 14 * 86400000)
  const cleaners = cleanersQuery.data ?? []

  const colHdr = (label: string, count: number, color: string, bg: string, icon: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{label}</p>
      </div>
      <span style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{count}</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Page header */}
      <div style={{ borderLeft: '4px solid #00c9a7', paddingLeft: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Dry Cleaning</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4, marginBottom: 0 }}>Manage the full cleaning lifecycle for cloth &amp; jewellery assets.</p>
      </div>

      <AnimatePresence>
        {notice && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Alert variant="success" message={notice} onDismiss={() => setNotice('')} /></motion.div>}
        {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Alert variant="error" message={error} onDismiss={() => setError('')} /></motion.div>}
      </AnimatePresence>

      {/* ── Section 1: Dry Cleaners Directory ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Dry Cleaners Directory</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>{cleaners.length} registered cleaner{cleaners.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowAddCleaner(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#00c9a7', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,201,167,0.3)' }}>
            <Plus size={14} /> Add Dry Cleaner
          </button>
        </div>

        {cleanersQuery.isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 180, background: '#f3f4f6', borderRadius: 14, opacity: 0.5 }} />)}
          </div>
        ) : cleaners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧺</div>
            <p style={{ fontSize: 14, margin: '0 0 8px' }}>No dry cleaners added yet.</p>
            <button onClick={() => setShowAddCleaner(true)} style={{ background: 'none', border: 'none', color: '#00c9a7', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Add your first dry cleaner →
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {cleaners.map(c => (
              <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#00c9a7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                      {initials(c.full_name)}
                    </div>
                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: c.is_active ? '#22c55e' : '#d1d5db', border: '2px solid #fff' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: c.is_active ? '#dcfce7' : '#f3f4f6', color: c.is_active ? '#16a34a' : '#6b7280' }}>
                    {c.is_active ? 'Active' : 'Suspended'}
                  </span>
                </div>

                <p style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{c.full_name}</p>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{c.email}</p>

                {/* Info row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Calendar size={14} color="#00c9a7" />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    Joined {new Date(c.created_at ?? '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {c.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Phone size={14} color="#00c9a7" />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{c.phone}</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  <button onClick={() => setViewJobsCleaner(c)}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: '#f0fdf4', color: '#065f46', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    View Jobs
                  </button>
                  <button onClick={() => suspendMutation.mutate(c.id)} disabled={!c.is_active}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: c.is_active ? '#fef2f2' : '#f3f4f6', color: c.is_active ? '#dc2626' : '#9ca3af', border: 'none', fontSize: 13, fontWeight: 500, cursor: c.is_active ? 'pointer' : 'not-allowed' }}>
                    Suspend
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2: Kanban ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

        {/* Col 1 — Needs Cleaning */}
        <div style={{ background: '#fffbf5', borderRadius: 16, border: '1px solid #fde68a', borderLeft: '4px solid #d97706', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 200 }}>
          {colHdr('Needs Cleaning', pending.length, '#92400e', '#fef3c7', <Send size={15} color="#d97706" />)}
          <div style={{ height: 1, background: '#fde68a', marginBottom: 4 }} />
          {pendingQuery.isLoading ? [1, 2].map(i => <div key={i} style={{ height: 60, background: '#fef3c7', borderRadius: 10, opacity: 0.5 }} />) :
           pending.length === 0 ? <EmptyCol msg="No assets waiting to be sent" /> :
           pending.map((r: DryCleaningRequest) => (
            <div key={`${r.asset_id}-${r.booking_id}`} style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AssetThumb url={r.asset?.image_url ?? null} name={r.asset?.name ?? ''} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.asset?.name}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>
                    Returned by {r.returned_by?.full_name ?? '—'}{r.returned_at ? ` · ${fmt(r.returned_at)}` : ''}
                  </p>
                </div>
                <button onClick={() => setAssignRequest(r)}
                  style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 8, background: '#d97706', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                  Assign
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Col 2 — At Dry Cleaner */}
        <div style={{ background: '#eff6ff', borderRadius: 16, border: '1px solid #bfdbfe', borderLeft: '4px solid #2563eb', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 200 }}>
          {colHdr('At Dry Cleaner', active.length, '#1e40af', '#dbeafe', <Clock size={15} color="#2563eb" />)}
          <div style={{ height: 1, background: '#bfdbfe', marginBottom: 4 }} />
          {activeQuery.isLoading ? [1, 2].map(i => <div key={i} style={{ height: 60, background: '#dbeafe', borderRadius: 10, opacity: 0.5 }} />) :
           active.length === 0 ? <EmptyCol msg="No assets at dry cleaner" /> :
           active.map((r: DryCleaningRequest) => {
            const overdue = r.expected_by && new Date(r.expected_by) < new Date()
            return (
              <div key={r.id} style={{ background: '#fff', border: `1px solid ${overdue ? '#fecaca' : '#bfdbfe'}`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AssetThumb url={r.asset?.image_url ?? null} name={r.asset?.name ?? ''} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.asset?.name}</p>
                    <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>
                      {r.dry_cleaner_name ? `@ ${r.dry_cleaner_name} · ` : ''}Sent {fmt(r.sent_at)}
                    </p>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: r.status === 'in_progress' ? '#dbeafe' : '#fef3c7', color: r.status === 'in_progress' ? '#1e40af' : '#92400e', flexShrink: 0 }}>
                    {r.status === 'in_progress' ? 'Cleaning' : 'Sent'}
                  </span>
                </div>
                {overdue && <div style={{ marginTop: 8, background: '#fee2e2', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#dc2626', fontWeight: 600 }}>⚠ Overdue by {daysSince(r.expected_by)} days</div>}
                {r.priority === 'urgent' && !overdue && <div style={{ marginTop: 6, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>🔴 Urgent</div>}
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '8px 0 0', fontStyle: 'italic' }}>
                  Awaiting completion by dry cleaner
                </p>
              </div>
            )
          })}
        </div>

        {/* Col 3 — Completed */}
        <div style={{ background: '#f0fdf4', borderRadius: 16, border: '1px solid #a7f3d0', borderLeft: '4px solid #16a34a', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 200 }}>
          {colHdr('Completed (14d)', completed14.length, '#064e3b', '#d1fae5', <CheckCircle2 size={15} color="#16a34a" />)}
          <div style={{ height: 1, background: '#a7f3d0', marginBottom: 4 }} />
          {completedQuery.isLoading ? [1].map(i => <div key={i} style={{ height: 60, background: '#d1fae5', borderRadius: 10, opacity: 0.5 }} />) :
           completed14.length === 0 ? <EmptyCol msg="Nothing completed in the last 14 days" /> :
           completed14.map((r: DryCleaningRequest) => (
            <div key={r.id} style={{ background: '#fff', border: '1px solid #a7f3d0', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AssetThumb url={r.asset?.image_url ?? null} name={r.asset?.name ?? ''} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.asset?.name}</p>
                <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>
                  {r.dry_cleaner_name ? `${r.dry_cleaner_name} · ` : ''}Done {fmt(r.completed_at)}
                </p>
                {r.actual_cost && <p style={{ fontSize: 11, color: '#6b7280', margin: '1px 0 0' }}>₹{r.actual_cost}</p>}
              </div>
              <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: '#d1fae5', color: '#065f46', flexShrink: 0 }}>✓ Ready</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Cleaner Performance ── */}
      {cleaners.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Zap size={16} color="#00c9a7" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Cleaner Performance</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {['Cleaner', 'Email', 'Status', 'Joined'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cleaners.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f9fafb' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#00c9a7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {initials(c.full_name)}
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{c.full_name}</p>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{c.email}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: c.is_active ? '#dcfce7' : '#f3f4f6', color: c.is_active ? '#16a34a' : '#6b7280' }}>
                        {c.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>
                      {new Date(c.created_at ?? '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddCleaner && (
        <AddCleanerModal
          onClose={() => setShowAddCleaner(false)}
          onSaved={(name) => {
            setNotice(`✓ Account created for ${name}. They can login at /dry-cleaning/login`)
            invalidate()
            setTimeout(() => setNotice(''), 6000)
          }}
        />
      )}
      {assignRequest && (
        <AssignModal
          request={assignRequest}
          cleaners={cleaners.filter(c => c.is_active)}
          onClose={() => setAssignRequest(null)}
          onSent={() => {
            invalidate()
            setNotice(`${assignRequest.asset?.name ?? 'Asset'} sent to dry cleaner.`)
            setTimeout(() => setNotice(''), 4000)
          }}
        />
      )}
      {viewJobsCleaner && (
        <ViewJobsModal
          cleaner={viewJobsCleaner}
          onClose={() => setViewJobsCleaner(null)}
        />
      )}
    </div>
  )
}
