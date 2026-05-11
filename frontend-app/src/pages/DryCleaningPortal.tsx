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
    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(224,112,112,0.15)', color: '#E07070', fontFamily: 'var(--font-sans)' }}>🔴 Urgent</span>
  )
  if (priority === 'low') return (
    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(158,128,112,0.15)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>Low</span>
  )
  return null
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    sent:        { label: 'Pending',     bg: 'rgba(201,169,110,0.15)', color: '#C9A96E' },
    in_progress: { label: 'In Progress', bg: 'rgba(100,160,220,0.15)', color: '#90B8E0' },
    completed:   { label: 'Completed',   bg: 'rgba(126,200,160,0.15)', color: '#7EC8A0' },
  }
  const s = map[status] ?? { label: status, bg: 'rgba(158,128,112,0.15)', color: 'var(--color-text-muted)' }
  return <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, fontFamily: 'var(--font-sans)' }}>{s.label}</span>
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
              background: i <= active ? 'var(--color-accent-gold)' : 'var(--color-bg-elevated)',
              color: i <= active ? 'var(--color-bg-primary)' : 'var(--color-text-faint)',
            }}>{i <= active ? '✓' : i + 1}</div>
            <span style={{ fontSize: 9, color: i <= active ? 'var(--color-accent-gold)' : 'var(--color-text-faint)', fontWeight: i === active ? 700 : 400, whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < active ? 'var(--color-accent-gold-dim)' : 'var(--color-border)', margin: '0 2px', marginBottom: 14 }} />
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,2,8,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
      <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
        {/* Modal header */}
        <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '20px 24px' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--color-accent-gold)', margin: 0 }}>✓ Confirm Cleaning Complete</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{request.asset?.name} · {request.asset?.asset_code}</p>
        </div>
        {/* Modal body */}
        <div style={{ padding: 24, maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Asset preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
            {request.asset?.image_url
              ? <img src={request.asset.image_url} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--color-border)' }} />
              : <div style={{ width: 60, height: 60, borderRadius: 10, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shirt size={24} color="var(--color-text-faint)" /></div>
            }
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{request.asset?.name}</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{request.asset?.asset_code}</p>
            </div>
          </div>
          {/* Checklist */}
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-accent-gold)', margin: '0 0 12px' }}>Cleaning Quality Checklist</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {CHECKLIST.map((item, i) => (
              <label key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, cursor: 'pointer',
                background: checks[i] ? 'rgba(126,200,160,0.08)' : 'var(--color-bg-secondary)',
                border: `1px solid ${checks[i] ? 'rgba(126,200,160,0.3)' : 'var(--color-border)'}`,
                transition: 'all 0.15s',
              }}>
                <input type="checkbox" checked={checks[i]} onChange={() => setChecks(p => p.map((v, j) => j === i ? !v : v))}
                  style={{ width: 16, height: 16, accentColor: 'var(--color-accent-gold)', cursor: 'pointer' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-primary)' }}>{item}</span>
              </label>
            ))}
          </div>
          {/* Rating */}
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-accent-gold)', margin: '0 0 8px' }}>Rate this cleaning job:</p>
          <StarRating value={rating} onChange={setRating} />
          {/* Notes */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>Cleaner Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add any notes about condition, damage found, etc."
              rows={3} style={{ width: '100%', boxSizing: 'border-box', borderRadius: 8, border: '1.5px solid var(--color-border)', padding: '10px 12px', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'var(--font-sans)', minHeight: 80, background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-accent-gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          {/* Cost */}
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>Cleaning Cost (₹)</label>
            <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="e.g. 150"
              style={{ width: '100%', boxSizing: 'border-box', height: 38, borderRadius: 8, border: '1.5px solid var(--color-border)', padding: '0 12px', fontSize: 13, outline: 'none', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-accent-gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10 }}>
          <button onClick={onCancel} className="btn-ghost" style={{ flex: 1, height: 42, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>Cancel</button>
          <button onClick={() => onConfirm({ cleaner_notes: notes, actual_cost: cost ? Number(cost) : undefined, rating })}
            disabled={!allChecked || loading}
            className={allChecked ? 'btn-gold' : ''}
            style={{ flex: 2, height: 42, borderRadius: 'var(--radius-sm)', background: allChecked ? undefined : 'var(--color-bg-elevated)', color: allChecked ? undefined : 'var(--color-text-faint)', border: allChecked ? undefined : 'none', fontSize: '0.7rem', fontWeight: 600, cursor: allChecked && !loading ? 'pointer' : 'not-allowed', transition: 'background 0.15s', justifyContent: 'center' }}>
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
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', fontFamily: 'var(--font-sans)' }}>

      {/* Header */}
      <header style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '0 32px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'rgba(201,169,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧺</div>
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--color-text-primary)', margin: 0 }}>Dry Cleaning Portal</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>Welcome, {user?.full_name}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(201,169,110,0.08)', border: '1px solid var(--color-border)', borderRadius: 100, padding: '6px 14px' }}>
            <Calendar size={12} color="var(--color-accent-gold)" />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-muted)' }}>{today()}</span>
          </div>
          <button onClick={handleLogout} className="btn-ghost" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '12px 32px', display: 'flex', gap: 0 }}>
        {[
          { label: 'PENDING', value: pending, color: 'var(--color-accent-gold)' },
          { label: 'IN PROGRESS', value: inProgress, color: '#90B8E0' },
          { label: 'COMPLETED TODAY', value: completedToday, color: '#7EC8A0' },
          { label: 'THIS MONTH', value: totalThisMonth, color: 'var(--color-text-primary)' },
        ].map((s, i) => (
          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, borderRight: i < 3 ? '1px solid var(--color-border)' : 'none', padding: '4px 0' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '0 32px', display: 'flex', gap: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '14px 20px', background: 'none', border: 'none', borderBottom: activeTab === t.key ? '2px solid var(--color-accent-gold)' : '2px solid transparent', marginBottom: -1, color: activeTab === t.key ? 'var(--color-accent-gold)' : 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: activeTab === t.key ? 600 : 400, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
            {t.label}
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: activeTab === t.key ? 'rgba(201,169,110,0.15)' : 'rgba(158,128,112,0.1)', color: activeTab === t.key ? 'var(--color-accent-gold)' : 'var(--color-text-faint)' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-bg-card)', border: '1px solid var(--color-accent-gold)', color: 'var(--color-accent-gold)', borderRadius: 10, padding: '12px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, zIndex: 400, boxShadow: 'var(--shadow-gold)', whiteSpace: 'nowrap' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main style={{ padding: '24px 32px', minHeight: 'calc(100vh - 140px)' }}>
        {requestsQuery.isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 380, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, opacity: 0.5 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(201,169,110,0.08)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 40 }}>🧺</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 24, fontWeight: 500, color: 'var(--color-text-primary)', margin: '20px 0 8px' }}>All Caught Up!</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>No pending dry cleaning requests at the moment.</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-accent-gold)', fontWeight: 600, marginTop: 12, letterSpacing: '0.06em' }}>You've completed {all.filter(r => r.status === 'completed').length} jobs this month</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {filtered.map((r: DryCleaningRequest) => {
              const days = daysSince(r.sent_at)
              const isCompleted = r.status === 'completed'
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'var(--color-bg-card)', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(201,169,110,0.12)' }}>

                  {/* Image */}
                  <div style={{ position: 'relative', background: 'var(--color-bg-secondary)' }}>
                    {r.asset?.image_url
                      ? <img src={r.asset.image_url} alt={r.asset.name} style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 280 }} />
                      : <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shirt size={40} color="var(--color-text-faint)" /></div>
                    }
                    <div style={{ position: 'absolute', top: 10, left: 10 }}><PriorityBadge priority={r.priority} /></div>
                    <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(30,10,20,0.75)', borderRadius: 100, padding: '3px 10px' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: days > 5 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                        {days === 0 ? 'Today' : days > 5 ? `⚠ ${days}d ago` : `${days}d ago`}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: 16 }}>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{r.asset?.name}</p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-text-faint)', margin: '2px 0 12px', letterSpacing: '0.06em' }}>{r.asset?.asset_code}</p>

                    {/* Info grid 2x2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { icon: <Calendar size={12} color="var(--color-accent-gold)" />, label: 'SENT', value: fmt(r.sent_at) },
                        { icon: <User size={12} color="var(--color-accent-gold)" />, label: 'RETURNED BY', value: r.returned_by?.full_name ?? '—' },
                        { icon: <Clock size={12} color="var(--color-accent-gold)" />, label: 'EXPECTED BY', value: r.expected_by ? fmt(r.expected_by) : 'ASAP' },
                        { icon: <Shirt size={12} color="var(--color-accent-gold)" />, label: 'CLEANER', value: r.dry_cleaner_name ?? 'Not assigned' },
                      ].map(cell => (
                        <div key={cell.label} style={{ background: 'var(--color-bg-secondary)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                            {cell.icon}
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{cell.label}</span>
                          </div>
                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    {(r.notes || r.admin_notes) && (
                      <div style={{ background: 'rgba(201,169,110,0.06)', borderLeft: '2px solid var(--color-accent-gold-dim)', borderRadius: '0 8px 8px 0', padding: '8px 12px', marginTop: 12, display: 'flex', gap: 6 }}>
                        <AlertTriangle size={12} color="var(--color-accent-gold)" style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>{r.notes || r.admin_notes}</p>
                      </div>
                    )}

                    {/* Progress steps */}
                    {!isCompleted && <ProgressSteps status={r.status} />}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
                    {isCompleted ? (
                      <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--color-success)', margin: 0 }}>✓ Completed on {fmt(r.completed_at)}</p>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-text-faint)', margin: '2px 0 0' }}>Asset returned to inventory</p>
                      </div>
                    ) : r.status === 'in_progress' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setConfirmRequest(r)} className="btn-gold" style={{ flex: 1, padding: '10px 0', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle2 size={13} /> Mark as Done ✓
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startMutation.mutate(r.id)} disabled={startMutation.isPending}
                        style={{ width: '100%', padding: '10px 0', borderRadius: 'var(--radius-sm)', background: 'rgba(201,169,110,0.08)', color: 'var(--color-accent-gold)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.15)'; e.currentTarget.style.borderColor = 'var(--color-accent-gold)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.08)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
                      >
                        <Play size={12} /> Start Cleaning
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
