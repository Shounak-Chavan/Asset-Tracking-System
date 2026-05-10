import { useQuery } from '@tanstack/react-query'
import { Package2, BookOpen, Users, RotateCcw, Plus, Eye, UserCog, BarChart2, Activity, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth-context'
import type { RecentActivityItem } from '../../types'

const statusStyles: Record<string, { bg: string; color: string }> = {
  returned:         { bg: 'rgba(158,128,112,0.15)', color: '#9E8070' },
  allocated:        { bg: 'rgba(126,200,160,0.15)', color: '#7EC8A0' },
  ready_for_pickup: { bg: 'rgba(126,200,160,0.15)', color: '#7EC8A0' },
  picked_up:        { bg: 'rgba(126,200,160,0.15)', color: '#7EC8A0' },
  overdue:          { bg: 'rgba(224,112,112,0.15)', color: '#E07070' },
  pending:          { bg: 'rgba(201,169,110,0.15)', color: '#C9A96E' },
  booked:           { bg: 'rgba(201,169,110,0.15)', color: '#C9A96E' },
  cancelled:        { bg: 'rgba(224,112,112,0.15)', color: '#E07070' },
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
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,169,110,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Asset thumbnail */}
          <div style={{
            width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
            background: 'rgba(201,169,110,0.1)', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {item.asset_image_url
              ? <img src={item.asset_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Package2 size={14} color="var(--color-accent-gold)" />
            }
          </div>

          {/* Description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.description
                ? item.description
                : `${item.asset_name ?? 'Asset'} — ${EVENT_LABELS[item.event_type] ?? item.event_type}`
              }
              {item.created_by_name && (
                <span style={{ color: 'var(--color-text-muted)' }}> by {item.created_by_name}</span>
              )}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--color-text-faint)', margin: '2px 0 0' }}>
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
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Admin Dashboard
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: 0 }}>
          Manage assets, bookings, and users
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {stats.map(({ label, value, icon: Icon, trend }) => (
          <div key={label} style={{
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
            borderRadius: '12px', padding: '20px 22px',
            borderTop: '2px solid var(--color-accent-gold)',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            cursor: 'default',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-gold)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent-gold)', margin: 0 }}>
                {label}
              </p>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(201,169,110,0.1)', border: '1px solid var(--color-border)', color: 'var(--color-accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} />
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '12px 0 4px' }}>{value}</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>{trend}</p>
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
              height: '42px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
              fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500,
              letterSpacing: '0.06em', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-gold)'; e.currentTarget.style.color = 'var(--color-accent-gold)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Bottom two-column layout: Recent Bookings + Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Recent Bookings table */}
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-accent-gold)' }}>
            Recent Bookings
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-secondary)' }}>
                  {['Booking ID', 'Plan', 'Pickup Date', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '11px 20px', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--color-accent-gold)', textAlign: 'left', borderBottom: '1px solid var(--color-border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookingsQuery.isLoading ? (
                  <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', fontFamily: 'var(--font-sans)', color: 'var(--color-text-faint)', fontSize: '13px' }}>Loading...</td></tr>
                ) : recentBookings.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', fontFamily: 'var(--font-sans)', color: 'var(--color-text-faint)', fontSize: '13px' }}>No bookings found</td></tr>
                ) : recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    style={{ borderBottom: '1px solid rgba(201,169,110,0.06)', cursor: 'pointer', transition: 'background 0.1s' }}
                    onClick={() => navigate(`/admin/tracking/${b.id}`)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,169,110,0.04)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>#{b.id}</td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-muted)' }}>{b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}</td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-muted)' }}>{new Date(b.pickup_date).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 20px' }}><StatusPill status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={15} color="var(--color-accent-gold)" />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-accent-gold)' }}>Recent Activity</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-faint)', marginLeft: 'auto' }}>auto-refreshes</span>
          </div>
          {activityQuery.isLoading ? (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-faint)', textAlign: 'center', padding: '32px' }}>Loading...</p>
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
