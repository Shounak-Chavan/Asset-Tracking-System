import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Shirt, LogOut, CheckCircle2, Calendar, User, Clock, AlertTriangle, Play } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth-context'
import type { DryCleaningRequest } from '../types'

function daysSince(d: string | null) {
  if (!d) return 0
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function today() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'urgent') return (
    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}>🔴 Urgent</span>
  )
  if (priority === 'low') return (
    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: '#f3f4f6', color: '#6b7280' }}>Low</span>
  )
  return null
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    sent:        { label: 'Pending',     bg: '#fef3c7', color: '#92400e' },
    in_progress: { label: 'In Progress', bg: '#dbeafe', color: '#1e40af' },
    completed:   { label: 'Completed',   bg: '#d1fae5', color: '#065f46' },
  }
  const s = map[status] ?? { label: status, bg: '#f3f4f6', color: '#374151' }
  return <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>
}

function ProgressSteps({ status }: { status: string }) {
  const steps = ['Sent', 'Cleaning', 'Quality Check', 'Done']
  const active = status === 'sent' ? 0 : status === 'in_progress' ? 2 : 3
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '12px 0 0' }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i <= active ? '#00c9a7' : '#e5e7eb',
              color: i <= active ? '#fff' : '#9ca3af',
            }}>{i <= active ? '✓' : i + 1}</div>
            <span style={{ fontSize: 9, color: i <= active ? '#0d9488' : '#9ca3af', fontWeight: i === active ? 700 : 400, whiteSpace: 'nowrap' }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < active ? '#00c9a7' : '#e5e7eb', margin: '0 2px', marginBottom: 14 }} />
          )}
        </div>
      ))}
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: 0, color: n <= (hover || value) ? '#f59e0b' : '#d1d5db', transition: 'color 0.1s' }}
        >★</button>
      ))}
    </div>
  )
}

const CHECKLIST = [
  'Item has been fully cleaned and dried',
  'All stains have been treated',
  'Item has been inspected for damage',
  'Item is properly pressed/folded',
  'Item is ready to return to inventory',
]

function DoneModal({ request, onConfirm, onCancel, loading }: {
  request: DryCleaningRequest
  onConfirm: (p: { cleaner_notes: string; actual_cost: number | undefined; rating: number }) => void
  onCancel: () => void
  loading: boolean
}) {
  const [checks, setChecks] = useState<boolean[]>(CHECKLIST.map(() => false))
  const [notes, setNotes] = useState('')
  const [cost, setCost] = useState('')
  const [rating, setRating] = useState(0)
  const allChecked = checks.every(Boolean)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
      <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        {/* Modal header */}
        <div style={{ background: '#00c9a7', padding: '20px 24px' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>✓ Confirm Cleaning Complete</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: '4px 0 0' }}>{request.asset?.name} · {request.asset?.asset_code}</p>
        </div>
        {/* Modal body */}
        <div style={{ padding: 24, maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Asset preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 12, background: '#f8fafc', borderRadius: 10 }}>
            {request.asset?.image_url
              ? <img src={request.asset.image_url} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', border: '1px solid #e5e7eb' }} />
              : <div style={{ width: 60, height: 60, borderRadius: 10, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shirt size={24} color="#9ca3af" /></div>
            }
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{request.asset?.name}</p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{request.asset?.asset_code}</p>
            </div>
          </div>
          {/* Checklist */}
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 12px' }}>Cleaning Quality Checklist</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {CHECKLIST.map((item, i) => (
              <label key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, cursor: 'pointer',
                background: checks[i] ? '#f0fdf4' : '#fff',
                border: `1px solid ${checks[i] ? '#bbf7d0' : '#e5e7eb'}`,
                transition: 'all 0.15s',
              }}>
                <input type="checkbox" checked={checks[i]} onChange={() => setChecks(p => p.map((v, j) => j === i ? !v : v))}
                  style={{ width: 16, height: 16, accentColor: '#00c9a7', cursor: 'pointer' }} />
                <span style={{ fontSize: 14, color: '#374151' }}>{item}</span>
              </label>
            ))}
          </div>
          {/* Rating */}
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Rate this cleaning job:</p>
          <StarRating value={rating} onChange={setRating} />
          {/* Notes */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Cleaner Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add any notes about condition, damage found, etc."
              rows={3} style={{ width: '100%', boxSizing: 'border-box', borderRadius: 8, border: '1.5px solid #e2e8f0', padding: '10px 12px', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', minHeight: 80 }}
              onFocus={e => { e.target.style.borderColor = '#00c9a7' }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
            />
          </div>
          {/* Cost */}
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Cleaning Cost (₹)</label>
            <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="e.g. 150"
              style={{ width: '100%', boxSizing: 'border-box', height: 38, borderRadius: 8, border: '1.5px solid #e2e8f0', padding: '0 12px', fontSize: 13, outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = '#00c9a7' }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
            />
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 42, borderRadius: 10, background: '#f3f4f6', color: '#374151', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onConfirm({ cleaner_notes: notes, actual_cost: cost ? Number(cost) : undefined, rating })}
            disabled={!allChecked || loading}
            style={{ flex: 2, height: 42, borderRadius: 10, background: allChecked ? '#00c9a7' : '#e5e7eb', color: allChecked ? '#fff' : '#9ca3af', border: 'none', fontSize: 14, fontWeight: 600, cursor: allChecked && !loading ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}>
            {loading ? 'Marking...' : 'Confirm & Complete'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function DryCleaningPortal() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmRequest, setConfirmRequest] = useState<DryCleaningRequest | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'in_progress' | 'completed'>('all')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 5000) }

  const requestsQuery = useQuery({
    queryKey: ['dc-portal-jobs', token],
    queryFn: () => api.listDryCleaningPortalJobs(token!),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  })

  const completedQuery = useQuery({
    queryKey: ['dc-portal-completed', token],
    queryFn: () => api.listDryCleaningRequests(token!, 'completed'),
    enabled: Boolean(token),
    refetchInterval: 60_000,
  })

  const startMutation = useMutation({
    mutationFn: (id: number) => api.startCleaning(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dc-portal-jobs'] }),
  })

  const doneMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { cleaner_notes: string; actual_cost?: number; rating: number } }) =>
      api.markCleaningDone(token!, id, payload),
    onSuccess: (data) => {
      setConfirmRequest(null)
      showToast(`✓ ${data.asset?.name ?? 'Asset'} marked as complete! Asset is now available.`)
      queryClient.invalidateQueries({ queryKey: ['dc-portal-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['dc-portal-completed'] })
    },
  })

  const handleLogout = async () => { await logout(); navigate('/dry-cleaning/login') }

  const all = [
    ...(requestsQuery.data ?? []),
    ...(completedQuery.data ?? []),
  ]
  const pending = all.filter(r => r.status === 'sent').length
  const inProgress = all.filter(r => r.status === 'in_progress').length
  const completedToday = all.filter(r => r.status === 'completed' && r.completed_at && Date.now() - new Date(r.completed_at).getTime() < 86400000).length
  const totalThisMonth = all.filter(r => {
    if (!r.created_at) return false
    const d = new Date(r.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const filtered = activeTab === 'all' ? all
    : activeTab === 'sent' ? all.filter(r => r.status === 'sent')
    : activeTab === 'in_progress' ? all.filter(r => r.status === 'in_progress')
    : all.filter(r => r.status === 'completed')

  const tabs = [
    { key: 'all', label: 'All', count: all.length },
    { key: 'sent', label: 'Pending', count: pending },
    { key: 'in_progress', label: 'In Progress', count: inProgress },
    { key: 'completed', label: 'Completed', count: all.filter(r => r.status === 'completed').length },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'inherit' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 80%, #0d9488 100%)', padding: '0 32px', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#00c9a7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🧺</div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Dry Cleaning Portal</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Welcome, {user?.full_name}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '6px 14px' }}>
            <Calendar size={13} color="rgba(255,255,255,0.7)" />
            <span style={{ fontSize: 13, color: '#fff' }}>{today()}</span>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div style={{ background: '#134e4a', padding: '12px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 0 }}>
        {[
          { label: 'PENDING', value: pending, color: '#fbbf24' },
          { label: 'IN PROGRESS', value: inProgress, color: '#60a5fa' },
          { label: 'COMPLETED TODAY', value: completedToday, color: '#34d399' },
          { label: 'THIS MONTH', value: totalThisMonth, color: '#fff' },
        ].map((s, i) => (
          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none', padding: '4px 0' }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ background: '#fff', borderBottom: '2px solid #f0f0f0', padding: '0 32px', display: 'flex', gap: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '14px 20px', background: 'none', border: 'none', borderBottom: activeTab === t.key ? '2px solid #00c9a7' : '2px solid transparent', marginBottom: -2, color: activeTab === t.key ? '#00c9a7' : '#6b7280', fontSize: 14, fontWeight: activeTab === t.key ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
            {t.label}
            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: activeTab === t.key ? '#ccfbf1' : '#f3f4f6', color: activeTab === t.key ? '#0d9488' : '#9ca3af' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: '#065f46', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 500, zIndex: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main style={{ padding: '24px 32px', minHeight: 'calc(100vh - 140px)' }}>
        {requestsQuery.isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 380, background: '#fff', borderRadius: 16, opacity: 0.5 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #ccfbf1, #99f6e4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 48 }}>🧺</div>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '20px 0 8px' }}>All Caught Up!</p>
            <p style={{ fontSize: 16, color: '#64748b', margin: 0 }}>No pending dry cleaning requests at the moment.</p>
            <p style={{ fontSize: 13, color: '#00c9a7', fontWeight: 600, marginTop: 12 }}>You've completed {all.filter(r => r.status === 'completed').length} jobs this month</p>          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {filtered.map((r: DryCleaningRequest) => {
              const days = daysSince(r.sent_at)
              const isCompleted = r.status === 'completed'
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>

                  {/* Image */}
                  <div style={{ position: 'relative', background: '#f3f4f6' }}>
                    {r.asset?.image_url
                      ? <img src={r.asset.image_url} alt={r.asset.name} style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 320 }} />
                      : <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shirt size={48} color="#d1d5db" /></div>
                    }
                    <div style={{ position: 'absolute', top: 12, left: 12 }}><PriorityBadge priority={r.priority} /></div>
                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 100, padding: '4px 10px' }}>
                      <span style={{ fontSize: 11, color: days > 5 ? '#fca5a5' : '#fff' }}>
                        {days === 0 ? 'Today' : days > 5 ? `⚠ ${days}d ago` : `${days}d ago`}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: 16 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{r.asset?.name}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 12px' }}>{r.asset?.asset_code}</p>

                    {/* Info grid 2x2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { icon: <Calendar size={14} color="#00c9a7" />, label: 'SENT', value: fmt(r.sent_at) },
                        { icon: <User size={14} color="#00c9a7" />, label: 'RETURNED BY', value: r.returned_by?.full_name ?? '—' },
                        { icon: <Clock size={14} color="#00c9a7" />, label: 'EXPECTED BY', value: r.expected_by ? fmt(r.expected_by) : 'ASAP' },
                        { icon: <Shirt size={14} color="#00c9a7" />, label: 'CLEANER', value: r.dry_cleaner_name ?? 'Not assigned' },
                      ].map(cell => (
                        <div key={cell.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                            {cell.icon}
                            <span style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{cell.label}</span>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    {(r.notes || r.admin_notes) && (
                      <div style={{ background: '#fffbeb', borderLeft: '3px solid #fbbf24', borderRadius: '0 8px 8px 0', padding: '8px 12px', marginTop: 12, display: 'flex', gap: 6 }}>
                        <AlertTriangle size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>📋 {r.notes || r.admin_notes}</p>
                      </div>
                    )}

                    {/* Progress steps */}
                    {!isCompleted && <ProgressSteps status={r.status} />}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
                    {isCompleted ? (
                      <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', margin: 0 }}>✓ Completed on {fmt(r.completed_at)}</p>
                        <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>Asset returned to inventory</p>
                      </div>
                    ) : r.status === 'in_progress' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setConfirmRequest(r)}
                          style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: '#00c9a7', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <CheckCircle2 size={14} /> Mark as Done ✓
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startMutation.mutate(r.id)} disabled={startMutation.isPending}
                        style={{ width: '100%', padding: '10px 0', borderRadius: 8, background: '#dbeafe', color: '#1d4ed8', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <Play size={13} /> Start Cleaning
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      {confirmRequest && (
        <DoneModal
          request={confirmRequest}
          onConfirm={(payload) => doneMutation.mutate({ id: confirmRequest.id, payload })}
          onCancel={() => setConfirmRequest(null)}
          loading={doneMutation.isPending}
        />
      )}
    </div>
  )
}
