import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  RotateCcw,
  CircleDollarSign,
  History,
  Sparkles,
  Package,
  CheckCircle2,
  PlusCircle,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CreditCard,
  X,
  Tag,
  MapPin,
  CalendarDays,
} from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth-context'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import type { Booking } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function durationLabel(pickup: string, due: string): string {
  const days = Math.ceil(
    (new Date(due).getTime() - new Date(pickup).getTime()) / (1000 * 60 * 60 * 24)
  )
  return days === 1 ? '1 Day' : `${days} Days`
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  topBorderColor,
  valueColor,
}: {
  label: string
  value: number
  icon: React.ElementType
  iconBg: string
  topBorderColor: string
  valueColor: string
}) {
  return (
    <div
      className="bg-white rounded-xl hover:shadow-md transition-all duration-200 cursor-default"
      style={{
        padding: '20px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        borderTop: `4px solid ${topBorderColor}`,
        borderRadius: '12px',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`font-bold ${valueColor}`} style={{ fontSize: '36px', lineHeight: 1.1 }}>
            {value}
          </p>
          <p className="text-gray-500 font-medium mt-1" style={{ fontSize: '14px' }}>
            {label}
          </p>
        </div>
        <div
          className={`flex items-center justify-center shrink-0 ${iconBg}`}
          style={{ width: 40, height: 40, borderRadius: '50%' }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────
type Tab = 'all' | 'active' | 'upcoming' | 'past'

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Completed' },
  ]
  return (
    <div
      className="flex gap-1"
      style={{ background: 'white', borderRadius: '12px', padding: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="flex-1 transition-all"
          style={{
            padding: '6px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: active === t.id ? 600 : 400,
            color: active === t.id ? '#ffffff' : '#6b7280',
            background: active === t.id ? '#0f172a' : 'transparent',
            boxShadow: active === t.id ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ paddingTop: '40px', paddingBottom: '40px' }}
    >
      <div
        className="flex items-center justify-center mb-3"
        style={{ width: 56, height: 56, borderRadius: '50%', background: '#f4f4f5' }}
      >
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <p style={{ fontSize: '15px', fontWeight: 500, color: '#111827' }}>{title}</p>
      <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{subtitle}</p>
    </div>
  )
}

// ── Section Wrapper ───────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  iconColor,
  children,
  count,
}: {
  icon: React.ElementType
  title: string
  iconColor: string   // hex for the circle bg
  children: React.ReactNode
  count?: number
}) {
  return (
    <section
      style={{
        background: '#fff',
        borderRadius: '14px',
        padding: '20px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        {/* Icon circle */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon style={{ width: 15, height: 15, color: '#fff' }} />
        </div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>{title}</h2>
        {count !== undefined && (
          <span style={{
            fontSize: '12px', fontWeight: 500, color: '#374151',
            background: '#e5e7eb', padding: '2px 10px', borderRadius: '20px',
          }}>
            {count}
          </span>
        )}
        {count !== undefined && count > 3 && (
          <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#3b82f6', cursor: 'pointer' }}>
            View All
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

// ── Booking Card Image ────────────────────────────────────────────────────────
function BookingThumb({ variant }: { variant: 'active' | 'upcoming' }) {
  const bg = variant === 'active' ? '#dcfce7' : '#dbeafe'
  const color = variant === 'active' ? '#16a34a' : '#2563eb'
  return (
    <div style={{
      width: 48, height: 48, borderRadius: '10px', flexShrink: 0,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Package style={{ width: 22, height: 22, color }} />
    </div>
  )
}

// ── Active / Upcoming Booking Card ───────────────────────────────────────────
interface BookingCardProps {
  booking: Booking
  onPayDeposit: (id: number) => void
  onPayRent: (id: number) => void
  onCancel: (id: number) => void
  onReturn: (id: number) => void
  onTrack: (id: number) => void
  isActionPending: boolean
  variant?: 'active' | 'upcoming'
}

function BookingCard({
  booking: b,
  onPayDeposit,
  onPayRent,
  onCancel,
  onReturn,
  onTrack,
  isActionPending,
  variant = 'active',
}: BookingCardProps) {
  const daysLeft = variant === 'upcoming' ? daysUntil(b.pickup_date) : null

  // Status badge colours
  const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
    pending:          { bg: '#fef3c7', color: '#d97706', label: 'Pending Approval' },
    booked:           { bg: '#dbeafe', color: '#2563eb', label: 'Approved' },
    allocated:        { bg: '#ede9fe', color: '#7c3aed', label: 'Allocated' },
    rent_paid:        { bg: '#f3e8ff', color: '#9333ea', label: `Rent Paid · Pickup on ${formatDate(b.pickup_date)}` },
    ready_for_pickup: { bg: '#ffedd5', color: '#ea580c', label: 'Return Requested' },
    picked_up:        { bg: '#dcfce7', color: '#16a34a', label: 'Picked Up' },
    overdue:          { bg: '#fee2e2', color: '#dc2626', label: 'Overdue' },
  }
  const badge = statusStyle[b.status] ?? { bg: '#f3f4f6', color: '#374151', label: b.status }

  const daysLeftLabel = daysLeft === null ? null
    : daysLeft <= 0 ? 'Today'
    : `Starts in ${daysLeft}d`

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: '20px 24px',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
    >
      {/* ── Top row ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <BookingThumb variant={variant} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>
            {b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0 0' }}>
            Booking #{b.id}
          </p>
        </div>

        {/* Right badges */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
          <span style={{
            background: badge.bg, color: badge.color,
            borderRadius: '20px', padding: '4px 12px',
            fontSize: '12px', fontWeight: 600,
          }}>
            {badge.label}
          </span>
          {daysLeftLabel && (
            <span style={{
              background: '#fee2e2', color: '#dc2626',
              borderRadius: '20px', padding: '3px 10px',
              fontSize: '11px', fontWeight: 500,
            }}>
              {daysLeftLabel}
            </span>
          )}
        </div>
      </div>

      {/* ── Info chips ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
        {[
          { icon: Calendar, color: '#2563eb', text: `${formatDate(b.pickup_date)} – ${formatDate(b.due_date)}` },
          { icon: Clock,    color: '#d97706', text: durationLabel(b.pickup_date, b.due_date) },
          { icon: Tag,      color: '#16a34a', text: b.rental_plan?.daily_rate ? `₹${b.rental_plan.daily_rate}/day` : null },
        ].filter(c => c.text).map(({ icon: Icon, color, text }) => (
          <div key={text} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#f8fafc', border: '1px solid #e5e7eb',
            borderRadius: '8px', padding: '7px 12px',
            fontSize: '13px', color: '#374151',
          }}>
            <Icon style={{ width: 14, height: 14, color, flexShrink: 0 }} />
            {text}
          </div>
        ))}
      </div>

      {/* ── Cost row ── */}
      <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '13px' }}>
        <span style={{ color: '#6b7280' }}>
          Rent: <strong style={{ color: '#111827' }}>₹{b.rent_amount}</strong>
        </span>
        <span style={{ color: '#6b7280' }}>
          Deposit: <strong style={{ color: '#111827' }}>₹{b.deposit_amount}</strong>
        </span>
      </div>

      {/* ── Action buttons ── */}
      {(b.status === 'pending' || b.status === 'allocated' || b.status === 'picked_up' || b.status === 'overdue' || b.status === 'rent_paid') && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '10px',
          marginTop: '16px', paddingTop: '14px',
          borderTop: '1px solid #f1f5f9',
        }}>
          {b.status === 'pending' && (
            <>
              <button
                onClick={() => onPayDeposit(b.id)}
                disabled={isActionPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  background: '#2563eb', color: '#fff',
                  border: 'none', borderRadius: '8px',
                  padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                  cursor: isActionPending ? 'not-allowed' : 'pointer',
                  opacity: isActionPending ? 0.6 : 1,
                  boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                  transition: 'background 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => { if (!isActionPending) { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <CreditCard style={{ width: 16, height: 16 }} />
                Pay Deposit
              </button>
              <button
                onClick={() => onCancel(b.id)}
                disabled={isActionPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  background: '#fff', color: '#ef4444',
                  border: '1.5px solid #fca5a5', borderRadius: '8px',
                  padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                  cursor: isActionPending ? 'not-allowed' : 'pointer',
                  opacity: isActionPending ? 0.6 : 1,
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => { if (!isActionPending) { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#ef4444' } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#fca5a5' }}
              >
                <X style={{ width: 16, height: 16 }} />
                Cancel
              </button>
            </>
          )}
          {b.status === 'allocated' && (
            <button
              onClick={() => onPayRent(b.id)}
              disabled={isActionPending}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: '#2563eb', color: '#fff',
                border: 'none', borderRadius: '8px',
                padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                cursor: isActionPending ? 'not-allowed' : 'pointer',
                opacity: isActionPending ? 0.6 : 1,
                boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                transition: 'background 0.15s, transform 0.15s',
              }}
              onMouseEnter={(e) => { if (!isActionPending) { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <CreditCard style={{ width: 16, height: 16 }} />
              Pay Rent
            </button>
          )}
          {b.status === 'rent_paid' && (
            <p style={{ fontSize: '13px', color: '#7c3aed', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarDays style={{ width: 15, height: 15 }} />
              Your pickup is scheduled for {formatDate(b.pickup_date)}
            </p>
          )}
          {(b.status === 'picked_up' || b.status === 'overdue') && (
            <button
              onClick={() => onReturn(b.id)}
              disabled={isActionPending}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: '#fff', color: '#374151',
                border: '1.5px solid #d1d5db', borderRadius: '8px',
                padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                cursor: isActionPending ? 'not-allowed' : 'pointer',
                opacity: isActionPending ? 0.6 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!isActionPending) e.currentTarget.style.background = '#f9fafb' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
            >
              <RotateCcw style={{ width: 16, height: 16 }} />
              Request Return
            </button>
          )}
        </div>
      )}
      {/* ── Track button — always visible for non-cancelled bookings ── */}
      {b.status !== 'cancelled' && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={() => onTrack(b.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'transparent', color: '#00c9a7',
              border: '1.5px solid #00c9a7', borderRadius: '8px',
              padding: '8px 16px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf9'; e.currentTarget.style.borderColor = '#00b396' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#00c9a7' }}
          >
            <MapPin style={{ width: 14, height: 14 }} />
            Track
          </button>
        </div>
      )}
    </div>
  )
}
function PastBookingRow({ booking: b, onRebook, onTrack }: { booking: Booking; onRebook: () => void; onTrack: () => void }) {
  const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
    returned:  { bg: '#dcfce7', color: '#16a34a', label: 'Returned' },
    cancelled: { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled' },
  }
  const badge = statusBadge[b.status] ?? { bg: '#f3f4f6', color: '#6b7280', label: b.status }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: '14px',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.09)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)')}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: '8px',
        background: '#f3f4f6', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Package style={{ width: 18, height: 18, color: '#9ca3af' }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>
          {b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>
          {formatDate(b.pickup_date)} – {formatDate(b.due_date)} · {durationLabel(b.pickup_date, b.due_date)}
        </p>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <span style={{
          background: badge.bg, color: badge.color,
          borderRadius: '20px', padding: '4px 12px',
          fontSize: '12px', fontWeight: 600,
        }}>
          {badge.label}
        </span>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
          ₹{b.rent_amount}
        </p>
        <button
          onClick={onRebook}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            border: '1.5px solid #2563eb', color: '#2563eb',
            borderRadius: '8px', padding: '6px 14px',
            fontSize: '13px', fontWeight: 500,
            background: 'transparent', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <RefreshCw style={{ width: 13, height: 13 }} />
          Rebook
        </button>
        {b.status === 'returned' && (
          <button
            onClick={onTrack}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              border: '1.5px solid #00c9a7', color: '#00c9a7',
              borderRadius: '8px', padding: '6px 14px',
              fontSize: '13px', fontWeight: 500,
              background: 'transparent', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf9')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <MapPin style={{ width: 13, height: 13 }} />
            Track
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
const PAST_PAGE_SIZE = 5

export function BookingsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [pastVisible, setPastVisible] = useState(PAST_PAGE_SIZE)

  const bookingsQuery = useQuery({
    queryKey: ['bookings', token],
    queryFn: () => api.listBookings(token!),
    enabled: Boolean(token),
  })

  const payDepositMutation = useMutation({
    mutationFn: (bookingId: number) => api.payDeposit(token!, bookingId),
    onSuccess: () => {
      setActionSuccess('Deposit paid successfully!')
      setActionError('')
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setTimeout(() => setActionSuccess(''), 3000)
    },
    onError: (err: Error) => setActionError(err.message),
  })

  const payRentMutation = useMutation({
    mutationFn: (bookingId: number) => api.payRent(token!, bookingId),
    onSuccess: () => {
      setActionSuccess('Rent paid successfully!')
      setActionError('')
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setTimeout(() => setActionSuccess(''), 3000)
    },
    onError: (err: Error) => setActionError(err.message),
  })

  const cancelMutation = useMutation({
    mutationFn: (bookingId: number) => api.cancelBooking(token!, bookingId),
    onSuccess: () => {
      setActionSuccess('Booking cancelled.')
      setActionError('')
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setTimeout(() => setActionSuccess(''), 3000)
    },
    onError: (err: Error) => setActionError(err.message),
  })

  const returnMutation = useMutation({
    mutationFn: (bookingId: number) => api.requestReturn(token!, bookingId),
    onSuccess: () => {
      setActionSuccess('Return requested successfully!')
      setActionError('')
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setTimeout(() => setActionSuccess(''), 3000)
    },
    onError: (err: Error) => setActionError(err.message),
  })

  const isActionPending =
    payDepositMutation.isPending ||
    payRentMutation.isPending ||
    cancelMutation.isPending ||
    returnMutation.isPending

  const bookings = bookingsQuery.data ?? []
  const activeBookings = bookings.filter((b) => ['picked_up', 'overdue', 'ready_for_pickup'].includes(b.status))
  const upcomingBookings = bookings.filter((b) =>
    ['pending', 'booked', 'allocated', 'rent_paid'].includes(b.status)
  )
  const pastBookings = bookings.filter((b) => ['returned', 'cancelled'].includes(b.status))

  const cardActions = {
    onPayDeposit: (id: number) => payDepositMutation.mutate(id),
    onPayRent: (id: number) => payRentMutation.mutate(id),
    onCancel: (id: number) => cancelMutation.mutate(id),
    onReturn: (id: number) => returnMutation.mutate(id),
    onTrack: (id: number) => navigate(`/bookings/${id}/track`),
    isActionPending,
  }

  const showActive = activeTab === 'all' || activeTab === 'active'
  const showUpcoming = activeTab === 'all' || activeTab === 'upcoming'
  const showPast = activeTab === 'all' || activeTab === 'past'

  return (
    <div style={{ minHeight: 'calc(100vh - 4rem)', background: 'linear-gradient(180deg, #eef6ff 0%, #f0f4f8 100%)' }}>
      {/* Centered container — max 1200px, full bleed padding */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px',
        }}
      >
        {/* ── Page Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <div style={{ borderLeft: '4px solid #00c9a7', paddingLeft: '12px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              My Bookings
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
              Track your active and past rentals
            </p>
          </div>
          <button
            onClick={() => navigate('/assets')}
            style={{
              background: '#00c9a7', color: '#fff', border: 'none',
              borderRadius: '10px', padding: '10px 20px',
              fontSize: '14px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px',
              cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,201,167,0.3)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00b396'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,201,167,0.4)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#00c9a7'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,201,167,0.3)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <PlusCircle style={{ width: 16, height: 16 }} />
            Book New Asset
          </button>
        </div>

        {/* ── Stats Grid — 4 equal columns ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <StatCard
            label="Total Bookings"
            value={bookings.length}
            icon={CircleDollarSign}
            iconBg="bg-blue-50 text-blue-600"
            topBorderColor="#1a3a6b"
            valueColor="text-blue-700"
          />
          <StatCard
            label="Active Now"
            value={activeBookings.length}
            icon={Sparkles}
            iconBg="bg-green-50 text-green-600"
            topBorderColor="#00c9a7"
            valueColor="text-green-700"
          />
          <StatCard
            label="Upcoming"
            value={upcomingBookings.length}
            icon={Clock}
            iconBg="bg-amber-50 text-amber-600"
            topBorderColor="#f59e0b"
            valueColor="text-amber-700"
          />
          <StatCard
            label="Completed"
            value={pastBookings.length}
            icon={History}
            iconBg="bg-purple-50 text-purple-600"
            topBorderColor="#7c3aed"
            valueColor="text-purple-700"
          />
        </div>

        {/* ── Alerts ── */}
        {actionError && (
          <Alert variant="error" message={actionError} onDismiss={() => setActionError('')} className="mb-5" />
        )}
        {actionSuccess && (
          <Alert variant="success" message={actionSuccess} onDismiss={() => setActionSuccess('')} className="mb-5" />
        )}

        {/* ── Loading skeleton ── */}
        {bookingsQuery.isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white animate-pulse"
                style={{ borderRadius: '12px', padding: '20px 24px', height: '96px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
              />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          /* ── Zero state ── */
          <div className="flex justify-center" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
            <div
              className="text-center bg-white"
              style={{
                maxWidth: '360px',
                width: '100%',
                borderRadius: '16px',
                padding: '48px 32px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              <div
                className="flex items-center justify-center mx-auto"
                style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', marginBottom: '16px' }}
              >
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
              <p className="font-semibold text-gray-900" style={{ fontSize: '17px' }}>No bookings yet</p>
              <p className="text-gray-500" style={{ fontSize: '14px', marginTop: '8px' }}>
                Browse the catalog to book an asset and start your rental journey.
              </p>
              <Button onClick={() => navigate('/assets')} className="mt-6 w-full">
                Browse Catalog
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* ── Tab bar ── */}
            <TabBar active={activeTab} onChange={setActiveTab} />

            {/* ── Active Bookings ── */}
            {showActive && (
              <Section icon={Sparkles} title="Active Bookings" iconColor="#22c55e" count={activeBookings.length}>
                {activeBookings.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="No active rentals right now"
                    subtitle="Assets you've picked up will appear here"
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeBookings.map((b) => (
                      <BookingCard key={b.id} booking={b} variant="active" {...cardActions} />
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* ── Upcoming Bookings ── */}
            {showUpcoming && (
              <Section icon={Clock} title="Upcoming Bookings" iconColor="#f59e0b" count={upcomingBookings.length}>
                {upcomingBookings.length === 0 ? (
                  <EmptyState
                    icon={AlertCircle}
                    title="No upcoming bookings"
                    subtitle="Confirmed bookings awaiting pickup will appear here"
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {upcomingBookings.map((b) => (
                      <BookingCard key={b.id} booking={b} variant="upcoming" {...cardActions} />
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* ── Past Bookings ── */}
            {showPast && (pastBookings.length > 0 || activeTab === 'past') && (
              <Section icon={History} title="Past Bookings" iconColor="#94a3b8" count={pastBookings.length}>
                {pastBookings.length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="No completed bookings"
                    subtitle="Returned or cancelled bookings will appear here"
                  />
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {pastBookings.slice(0, pastVisible).map((b) => (
                        <PastBookingRow key={b.id} booking={b} onRebook={() => navigate('/assets')} onTrack={() => navigate(`/bookings/${b.id}/track`)} />
                      ))}
                    </div>
                    {pastVisible < pastBookings.length && (
                      <button
                        onClick={() => setPastVisible((v) => v + PAST_PAGE_SIZE)}
                        className="flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        style={{ fontSize: '13px', marginTop: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Load more <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
