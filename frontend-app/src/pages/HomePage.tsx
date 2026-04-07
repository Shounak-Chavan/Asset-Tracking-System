import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Package2, CalendarCheck2, CheckCircle2, TrendingUp, Clock,
  ArrowRight, Zap, Shield, BarChart3, IndianRupee, Sparkles,
} from 'lucide-react'
import { useAuth } from '../auth-context'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'
import { getAssetImage } from '../imageStore'
import type { Booking, Asset } from '../types'

const fallbackImages = [
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
]

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  iconBg: string
  change?: string
  positive?: boolean
  delay?: number
}

function StatCard({ label, value, icon, iconBg, change, positive, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className={`stat-icon ${iconBg}`}>{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {change && (
          <p className={`stat-change ${positive ? 'positive' : 'negative'}`}>
            <TrendingUp className="inline w-3 h-3 mr-1" />
            {change}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <div className="skeleton w-11 h-11 rounded-xl" />
      <div className="flex-1">
        <div className="skeleton h-3 w-20 mb-2 rounded" />
        <div className="skeleton h-7 w-12 rounded" />
      </div>
    </div>
  )
}

function SkeletonAssetCard() {
  return (
    <div className="asset-card">
      <div className="skeleton w-full" style={{ height: '11rem' }} />
      <div className="p-4 flex flex-col gap-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-8 w-full rounded-xl mt-2" />
      </div>
    </div>
  )
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'badge badge-yellow' },
  booked:    { label: 'Booked',    cls: 'badge badge-blue' },
  allocated: { label: 'Allocated', cls: 'badge badge-purple' },
  picked_up: { label: 'Picked Up', cls: 'badge badge-green' },
  returned:  { label: 'Returned',  cls: 'badge badge-gray' },
  cancelled: { label: 'Cancelled', cls: 'badge badge-red' },
  overdue:   { label: 'Overdue',   cls: 'badge badge-red' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

export function HomePage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const bookingsQuery = useQuery({
    queryKey: ['bookings', token],
    queryFn: () => (token ? api.listBookings(token) : Promise.resolve([])),
    enabled: Boolean(token),
  })

  const adminBookingsQuery = useQuery({
    queryKey: ['adminBookings', token],
    queryFn: () => (token ? api.listAdminBookings(token) : Promise.resolve([])),
    enabled: Boolean(token) && isAdmin,
  })

  const assetsQuery = useQuery({
    queryKey: ['assetsHome', token],
    queryFn: () => (token ? api.listAssets(token) : Promise.resolve([])),
    enabled: Boolean(token),
  })

  const bookings: Booking[] = isAdmin
    ? (adminBookingsQuery.data ?? [])
    : (bookingsQuery.data ?? [])

  const assets: Asset[] = assetsQuery.data ?? []

  const totalAssets = assets.length
  const availableAssets = assets.filter((a) => a.status === 'available').length
  const allocatedAssets = assets.filter((a) => a.status === 'allocated').length
  const activeBookings = bookings.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'returned'
  ).length

  const totalRevenue = bookings.reduce((sum, b) => {
    if (b.status !== 'cancelled') return sum + (b.deposit_amount ?? 0) + (b.rent_amount ?? 0)
    return sum
  }, 0)

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)

  // Featured available assets - deduplicated by name
  const seen = new Set<string>()
  const featuredAssets = assets.filter((a) => {
    if (a.status !== 'available') return false
    const key = a.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 4)

  const statsLoading = bookingsQuery.isLoading || assetsQuery.isLoading || adminBookingsQuery.isLoading
  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  // ── Guest landing ────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="flex flex-col gap-10">
        {/* Hero */}
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900/60 via-surface-900 to-surface-950 border border-primary-800/30 p-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-600/10 via-transparent to-transparent" />
          <div className="relative z-10 max-w-2xl">
            <span className="badge badge-purple mb-4 inline-flex">
              <Zap className="w-3 h-3" /> Production Ready SaaS
            </span>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Control your full asset<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-violet-400">
                lifecycle in one place
              </span>
            </h1>
            <p className="text-surface-300 mb-8 text-lg leading-relaxed">
              Real-time booking, allocation, early returns, fines, damage handling, and payment tracking — all connected to a live FastAPI backend.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button className="btn-primary btn btn-lg" onClick={() => navigate('/login')}>
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
              <button className="btn-secondary btn btn-lg" onClick={() => navigate('/register')}>
                Create Account
              </button>
            </div>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: <Package2 className="w-5 h-5 text-primary-400" />, bg: 'bg-primary-500/10', title: 'Book & Pay', desc: 'Browse by category, create bookings, pay deposits and rent in real-time.' },
            { icon: <Shield className="w-5 h-5 text-emerald-400" />, bg: 'bg-emerald-500/10', title: 'Admin Controls', desc: 'Smart allocation, early/mid returns with automatic availability resets.' },
            { icon: <BarChart3 className="w-5 h-5 text-amber-400" />, bg: 'bg-amber-500/10', title: 'Financial Tracking', desc: 'Late fines, damage deductions, deposit refunds with full breakdown.' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i, duration: 0.4 }}
            >
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-surface-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  // ── Authenticated dashboard ──────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Greeting row */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 mb-4"
          style={{
            background: 'linear-gradient(135deg, rgb(99 102 241 / 0.12) 0%, rgb(67 56 202 / 0.06) 50%, transparent 100%)',
            border: '1px solid rgb(99 102 241 / 0.18)',
          }}
        >
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at top right, rgb(99 102 241 / 0.2) 0%, transparent 60%)' }} />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4" style={{ color: '#818cf8' }} />
                <span style={{ fontSize: '0.8125rem', color: '#818cf8', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {getGreeting()}
                </span>
              </div>
              <h1 style={{ fontSize: '1.625rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.03em' }}>
                {firstName} 👋
              </h1>
              <p style={{ color: '#71717a', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Here's what's happening with your assets today.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/assets')}
              style={{ flexShrink: 0 }}
            >
              <Package2 className="w-4 h-4" /> Browse Assets
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label="Total Assets" value={totalAssets} icon={<Package2 className="w-5 h-5 text-primary-400" />} iconBg="bg-primary-500/15" change="+12% this month" positive delay={0} />
            <StatCard label="Active Bookings" value={activeBookings} icon={<CalendarCheck2 className="w-5 h-5 text-emerald-400" />} iconBg="bg-emerald-500/15" delay={0.08} />
            <StatCard label="Available" value={availableAssets} icon={<CheckCircle2 className="w-5 h-5 text-blue-400" />} iconBg="bg-blue-500/15" delay={0.16} />
            <StatCard
              label={isAdmin ? 'Total Revenue' : 'Allocated'}
              value={isAdmin ? `₹${totalRevenue.toLocaleString()}` : allocatedAssets}
              icon={<IndianRupee className="w-5 h-5 text-amber-400" />}
              iconBg="bg-amber-500/15"
              change={isAdmin ? '+8% this week' : undefined}
              positive={isAdmin}
              delay={0.24}
            />
          </>
        )}
      </div>

      {/* Featured Assets */}
      <div>
        <div className="section-header">
          <div>
            <h2 className="section-title">Featured Assets</h2>
            <p className="section-subtitle">Available items ready to book instantly</p>
          </div>
          <button className="btn-ghost btn btn-sm" onClick={() => navigate('/assets')}>
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {assetsQuery.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonAssetCard key={i} />)
            : featuredAssets.length === 0
            ? (
              <div className="col-span-4 empty-state py-14">
                <div className="empty-state-icon"><Package2 className="w-8 h-8" /></div>
                <p className="empty-state-title">No available assets</p>
                <p className="empty-state-desc">Assets will appear here once added by admin.</p>
              </div>
            )
            : featuredAssets.map((asset, i) => {
              const customImg = getAssetImage(asset.asset_code)
              const img = customImg ?? fallbackImages[i % fallbackImages.length]
              return (
                <motion.article
                  key={asset.id}
                  className="asset-card card-hover"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.35 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="relative overflow-hidden" style={{ height: '11rem' }}>
                    <img
                      src={img}
                      alt={asset.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Available</span>
                    </div>
                  </div>
                  <div className="asset-body">
                    <div>
                      <h3 className="font-semibold text-white leading-tight" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{asset.name}</h3>
                      <p className="text-xs text-surface-400 line-clamp-2">
                        {asset.description || 'No description available.'}
                      </p>
                    </div>
                    <button
                      className="btn btn-primary w-full"
                      style={{ marginTop: 'auto', fontSize: '0.8125rem' }}
                      onClick={() => navigate('/assets')}
                    >
                      Book Now
                    </button>
                  </div>
                </motion.article>
              )
            })
          }
        </div>
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="section-header">
          <div>
            <h2 className="section-title">{isAdmin ? 'All Recent Bookings' : 'My Recent Bookings'}</h2>
            <p className="section-subtitle">Latest booking activity</p>
          </div>
          <button className="btn-ghost btn btn-sm" onClick={() => navigate('/bookings')}>
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="table-wrap">
          {bookingsQuery.isLoading ? (
            <div className="p-6 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="skeleton h-4 w-8 rounded" />
                  <div className="skeleton h-4 flex-1 rounded" />
                  <div className="skeleton h-6 w-20 rounded-full" />
                  <div className="skeleton h-4 w-16 rounded" />
                </div>
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon"><Clock className="w-7 h-7" /></div>
              <p className="empty-state-title">No bookings yet</p>
              <p className="empty-state-desc">Go to Assets to create your first booking.</p>
              <button className="btn btn-primary btn-sm mt-4" onClick={() => navigate('/assets')}>
                Browse Assets
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Pickup</th>
                  <th>Due</th>
                  <th>Deposit</th>
                  <th>Rent</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => {
                  const cfg = statusConfig[booking.status] ?? { label: booking.status, cls: 'badge badge-gray' }
                  return (
                    <tr key={booking.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#71717a' }}>#{booking.id}</td>
                      <td className="font-medium">{booking.rental_plan?.name ?? `Plan #${booking.rental_plan_id}`}</td>
                      <td><span className={cfg.cls}>{cfg.label}</span></td>
                      <td style={{ color: '#a1a1aa' }}>{formatDate(booking.pickup_date)}</td>
                      <td style={{ color: '#a1a1aa' }}>{formatDate(booking.due_date)}</td>
                      <td style={{ color: '#ffffff', fontWeight: '600' }}>₹{booking.deposit_amount}</td>
                      <td style={{ color: '#ffffff', fontWeight: '600' }}>₹{booking.rent_amount}</td>
                      <td>
                        <button className="btn-ghost btn btn-sm" onClick={() => navigate('/bookings')}>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
