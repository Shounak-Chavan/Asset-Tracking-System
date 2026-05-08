import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  ArrowLeft,
  Package,
  Clock,
  Loader2,
  AlertCircle,
  MapPin,
  Sparkles,
  User,
  AlertTriangle,
} from 'lucide-react'
import { api } from '../../api'
import { useAuth } from '../../auth-context'
import type { TrackingEventType, TrackingPageData } from '../../types'

// ── Step definitions (same as user page) ─────────────────────────────────────

interface StepDef {
  event_type: TrackingEventType
  label: string
  defaultDesc: string
  clothOnly?: boolean
}

const ALL_STEPS: StepDef[] = [
  { event_type: 'booking_confirmed',  label: 'Booking Confirmed',       defaultDesc: 'Booking confirmed' },
  { event_type: 'deposit_paid',       label: 'Deposit Paid',            defaultDesc: 'Security deposit received' },
  { event_type: 'rent_paid',          label: 'Rent Paid',               defaultDesc: 'Total rent paid' },
  { event_type: 'asset_allocated',    label: 'Asset Allocated',         defaultDesc: 'Asset allocated by admin' },
  { event_type: 'ready_for_pickup',   label: 'Ready for Pickup',        defaultDesc: 'Scheduled for pickup' },
  { event_type: 'picked_up',          label: 'Picked Up',               defaultDesc: 'Asset handed over' },
  { event_type: 'return_requested',   label: 'Return Requested',        defaultDesc: 'User requested return' },
  { event_type: 'returned',           label: 'Returned',                defaultDesc: 'Item returned' },
  { event_type: 'sent_dry_cleaning',  label: 'Sent for Dry Cleaning',   defaultDesc: 'Sent to dry cleaning', clothOnly: true },
  { event_type: 'dry_cleaning_done',  label: 'Dry Cleaned & Available', defaultDesc: 'Cleaning complete', clothOnly: true },
]

function isClothCategory(category: string | null): boolean {
  if (!category) return true
  const c = category.toLowerCase()
  return c === 'cloth' || c === 'jwellary' || c === 'jewellery' || c === 'jewelry'
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function elapsed(from: string, to: string): string {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ${mins % 60}m`
  return `${Math.floor(hrs / 24)}d ${hrs % 24}h`
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  pending:          { label: 'Pending',          bg: '#fef3c7', color: '#d97706' },
  booked:           { label: 'Approved',         bg: '#dbeafe', color: '#2563eb' },
  allocated:        { label: 'Allocated',        bg: '#ede9fe', color: '#7c3aed' },
  rent_paid:        { label: 'Rent Paid',        bg: '#f3e8ff', color: '#9333ea' },
  ready_for_pickup: { label: 'Return Requested', bg: '#ffedd5', color: '#ea580c' },
  picked_up:        { label: 'Picked Up',        bg: '#dcfce7', color: '#16a34a' },
  returned:         { label: 'Returned',         bg: '#f0fdf4', color: '#15803d' },
  overdue:          { label: 'Overdue',          bg: '#fee2e2', color: '#dc2626' },
  cancelled:        { label: 'Cancelled',        bg: '#f3f4f6', color: '#6b7280' },
}

// ── Dry cleaning overdue flag: > 3 days ───────────────────────────────────────

function isDryCleaningOverdue(data: TrackingPageData): boolean {
  const sentEv = data.events.find(e => e.event_type === 'sent_dry_cleaning')
  const doneEv = data.events.find(e => e.event_type === 'dry_cleaning_done')
  if (!sentEv || doneEv) return false
  const days = (Date.now() - new Date(sentEv.event_at).getTime()) / 86400000
  return days > 3
}

export function BookingTrackingAdminPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-tracking', bookingId, token],
    queryFn: () => api.getBookingTracking(token!, Number(bookingId)),
    enabled: Boolean(token && bookingId),
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
        <Loader2 size={32} color="#00c9a7" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '80px' }}>
        <AlertCircle size={40} color="#ef4444" />
        <p style={{ fontSize: '16px', color: '#374151' }}>Could not load tracking info.</p>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 20px', borderRadius: '8px', background: '#1a3a6b', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    )
  }

  const isCloth = isClothCategory(data.asset_category)
  const steps = isCloth ? ALL_STEPS : ALL_STEPS.filter(s => !s.clothOnly)
  const eventMap = new Map<string, { event_at: string; description: string | null; created_by_name: string | null }>()
  for (const ev of data.events) {
    eventMap.set(ev.event_type, { event_at: ev.event_at, description: ev.description, created_by_name: ev.created_by_name })
  }
  const completedTypes = new Set(eventMap.keys())
  const statusInfo = STATUS_LABELS[data.current_status] ?? { label: data.current_status, bg: '#f3f4f6', color: '#374151' }
  const dryCleaningAlert = isDryCleaningOverdue(data)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '14px', color: '#64748b', padding: '4px 0',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#0f172a')}
        onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
      >
        <ArrowLeft size={16} />
        Back to Operations
      </button>

      {/* Dry cleaning overdue alert */}
      {dryCleaningAlert && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px',
          padding: '12px 16px', color: '#c2410c',
        }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>
            Dry cleaning has been pending for more than 3 days — follow up with the cleaner.
          </span>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: '#fff', borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: '24px', border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '12px', flexShrink: 0,
            background: '#f0fdf4', border: '1px solid #d1fae5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {data.asset_image_url
              ? <img src={data.asset_image_url} alt={data.asset_name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Package size={28} color="#00c9a7" />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Booking #{data.booking_id}
              </h1>
              <span style={{
                fontSize: '12px', fontWeight: 600, padding: '3px 12px',
                borderRadius: '20px', background: statusInfo.bg, color: statusInfo.color,
              }}>
                {statusInfo.label}
              </span>
            </div>
            {data.asset_name && (
              <p style={{ fontSize: '14px', color: '#374151', margin: '4px 0 0', fontWeight: 500 }}>
                {data.asset_name}
                {data.asset_category && (
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 400, marginLeft: '6px' }}>
                    · {data.asset_category}
                  </span>
                )}
              </p>
            )}
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> Pickup: {formatDate(data.pickup_date)}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> Due: {formatDate(data.due_date)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin timeline */}
      <div style={{
        background: '#fff', borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: '28px 24px', border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Sparkles size={18} color="#00c9a7" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Admin Tracking View
          </h2>
          <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>
            {data.events.length} events recorded
          </span>
        </div>

        <div>
          {steps.map((stepDef, idx) => {
            const ev = eventMap.get(stepDef.event_type)
            const isCompleted = completedTypes.has(stepDef.event_type)
            const prevEv = idx > 0 ? eventMap.get(steps[idx - 1].event_type) : null
            const elapsedTime = ev && prevEv ? elapsed(prevEv.event_at, ev.event_at) : null
            const isLast = idx === steps.length - 1
            const nextCompleted = !isLast && completedTypes.has(steps[idx + 1].event_type)

            return (
              <div key={stepDef.event_type} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {/* Circle */}
                  {isCompleted ? (
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', background: '#00c9a7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      boxShadow: '0 0 0 4px rgba(0,201,167,0.15)',
                    }}>
                      <CheckCircle2 size={20} color="#fff" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', background: '#fff',
                      border: '2px solid #e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d1d5db' }} />
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ flex: 1, paddingTop: '8px', paddingBottom: isLast ? 0 : '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '15px', fontWeight: isCompleted ? 600 : 400,
                        color: isCompleted ? '#0f172a' : '#9ca3af',
                      }}>
                        {stepDef.label}
                      </span>
                      {elapsedTime && (
                        <span style={{
                          fontSize: '11px', color: '#64748b',
                          background: '#f1f5f9', padding: '2px 8px', borderRadius: '20px',
                        }}>
                          +{elapsedTime} from prev
                        </span>
                      )}
                    </div>

                    {ev && (
                      <>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} />
                          {formatDateTime(ev.event_at)}
                        </p>
                        {ev.description && (
                          <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0' }}>
                            {ev.description}
                          </p>
                        )}
                        {ev.created_by_name && (
                          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={11} />
                            by {ev.created_by_name}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Connector */}
                {!isLast && (
                  <div style={{
                    width: 2, height: 36, marginLeft: 19,
                    background: nextCompleted ? '#00c9a7' : '#e2e8f0',
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>


    </div>
  )
}
