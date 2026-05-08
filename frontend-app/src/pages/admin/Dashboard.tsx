import { useQuery } from '@tanstack/react-query'
import { Package2, BookOpen, Users, RotateCcw, Plus, Eye, UserCog, BarChart2, Activity, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth-context'
import type { RecentActivityItem } from '../../types'

const statusStyles: Record<string, { bg: string; color: string }> = {
  returned:         { bg: '#f3f4f6', color: '#6b7280' },
  allocated:        { bg: '#dcfce7', color: '#16a34a' },
  ready_for_pickup: { bg: '#dcfce7', color: '#16a34a' },
  picked_up:        { bg: '#dcfce7', color: '#16a34a' },
  overdue:          { bg: '#fee2e2', color: '#dc2626' },
  pending:          { bg: '#fef9c3', color: '#ca8a04' },
  booked:           { bg: '#fef9c3', color: '#ca8a04' },
  cancelled:        { bg: '#fee2e2', color: '#dc2626' },
}

function StatusPill({ status }: { status: string }) {
  const s = statusStyles[status] ?? { bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span style={{
      display: 'inline-flex', padding: '3px 10px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 600, background: s.bg, color: s.color,
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

// ── Event type → human label ──────────────────────────────────────────────────
const EVENT_LABELS: Record<string, string> = {
  booking_confirmed: 'Booking confirmed',
  deposit_paid:      'Deposit paid',
  rent_paid:         'Rent paid',
  asset_allocated:   'Asset allocated',
  ready_for_pickup:  'Ready for pickup',
  picked_up:         'Picked up',
  return_requested:  'Return requested',
  returned:          'Returned',
  sent_dry_cleaning: 'Sent for dry cleaning',
  dry_cleaning_done: 'Dry cleaned',
  booking_cancelled: 'Booking cancelled',
  booking_rejected:  'Booking rejected',
  overdue:           'Overdue',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

// ── Recent Activity Feed ──────────────────────────────────────────────────────
function RecentActivityFeed({ items, onClickItem }: { items: RecentActivityItem[]; onClickItem: (bookingId: number) => void }) {
  if (items.length === 0) {
    return (
      <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
        No recent activity yet.
      </p>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {items.map(item => (
        <div
          key={item.event_id}
          onClick={() => onClickItem(item.booking_id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 16px', borderRadius: '10px', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Asset thumbnail */}
          <div style={{
            width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
            background: '#f0fdf4', border: '1px solid #d1fae5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {item.asset_image_url
              ? <img src={item.asset_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Package2 size={14} color="#00c9a7" />
            }
          </div>

          {/* Description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.description
                ? item.description
                : `${item.asset_name ?? 'Asset'} — ${EVENT_LABELS[item.event_type] ?? item.event_type}`
              }
              {item.created_by_name && (
                <span style={{ color: '#9ca3af' }}> by {item.created_by_name}</span>
              )}
            </p>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>
              Booking #{item.booking_id} · {timeAgo(item.event_at)}
            </p>
          </div>

          {/* Track icon */}
          <MapPin size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function AdminDashboardPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const bookingsQuery = useQuery({
    queryKey: ['admin-bookings', token],
    queryFn: () => api.listAdminBookings(token!),
    enabled: Boolean(token),
  })
  const assetsQuery = useQuery({
    queryKey: ['admin-assets', token],
    queryFn: () => api.listAssets(token!),
    enabled: Boolean(token),
  })
  const usersQuery = useQuery({
    queryKey: ['admin-users', token],
    queryFn: () => api.listUsers(token!),
    enabled: Boolean(token),
  })
  const activityQuery = useQuery({
    queryKey: ['recent-activity', token],
    queryFn: () => api.getRecentActivity(token!, 10),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  })

  const bookings = bookingsQuery.data ?? []
  const assets = assetsQuery.data ?? []
  const users = usersQuery.data ?? []
  const activityItems = activityQuery.data ?? []

  const totalAssets = assets.filter(a => a.is_active).length
  const activeBookings = bookings.filter(b =>
    ['allocated', 'ready_for_pickup', 'picked_up', 'overdue'].includes(b.status)
  ).length
  const totalUsers = users.length
  const pendingReturns = bookings.filter(b => b.status === 'returned').length
  const recentBookings = bookings.slice(0, 5)

  const stats = [
    { label: 'Total Assets',    value: totalAssets,    icon: Package2,  trend: '+3 this week' },
    { label: 'Active Bookings', value: activeBookings, icon: BookOpen,  trend: '+12% this week' },
    { label: 'Total Users',     value: totalUsers,     icon: Users,     trend: '+2 this month' },
    { label: 'Pending Returns', value: pendingReturns, icon: RotateCcw, trend: 'Needs review' },
  ]

  const quickActions = [
    { label: 'Add New Asset',     icon: Plus,     path: '/admin/assets' },
    { label: 'View All Bookings', icon: Eye,      path: '/admin/ops' },
    { label: 'Manage Users',      icon: UserCog,  path: '/admin/users' },
    { label: 'View Reports',      icon: BarChart2, path: '/admin/assets' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>
          Manage assets, bookings, and users
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {stats.map(({ label, value, icon: Icon, trend }) => (
          <div key={label} style={{
            background: '#ffffff', border: '1px solid rgba(226,232,240,0.8)',
            borderRadius: '16px', padding: '20px 22px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            cursor: 'default',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>
                {label}
              </p>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} />
              </div>
            </div>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', margin: '12px 0 4px' }}>{value}</p>
            <p style={{ fontSize: '11px', color: '#16a34a', margin: 0 }}>{trend}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {quickActions.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            style={{
              height: '42px', borderRadius: '8px',
              background: '#ffffff', border: '1px solid #e5e7eb',
              fontSize: '13.5px', fontWeight: 500, color: '#374151',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              userSelect: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#111827' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151' }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Bottom two-column layout: Recent Bookings + Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Recent Bookings table */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #f3f4f6', fontSize: '15px', fontWeight: 600, color: '#111827' }}>
            Recent Bookings
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Booking ID', 'Plan', 'Pickup Date', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '11px 20px', fontSize: '11px', fontWeight: 600,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: '#64748b', textAlign: 'left', borderBottom: '2px solid #e2e8f0',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookingsQuery.isLoading ? (
                  <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Loading...</td></tr>
                ) : recentBookings.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No bookings found</td></tr>
                ) : recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/tracking/${b.id}`)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf9' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '14px 20px', fontSize: '13.5px', color: '#374151', fontWeight: 500 }}>#{b.id}</td>
                    <td style={{ padding: '14px 20px', fontSize: '13.5px', color: '#374151' }}>{b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}</td>
                    <td style={{ padding: '14px 20px', fontSize: '13.5px', color: '#374151' }}>{new Date(b.pickup_date).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 20px' }}><StatusPill status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#00c9a7" />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Recent Activity</span>
            <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto' }}>auto-refreshes</span>
          </div>
          {activityQuery.isLoading ? (
            <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '32px' }}>Loading...</p>
          ) : (
            <RecentActivityFeed
              items={activityItems}
              onClickItem={(bookingId) => navigate(`/admin/tracking/${bookingId}`)}
            />
          )}
        </div>

      </div>
    </div>
  )
}
