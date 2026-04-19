import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck2, Clock, CheckCircle2, XCircle, CreditCard,
  AlertCircle, ArrowRight, BookOpen, Package2, ChevronRight,
  RotateCcw, IndianRupee,
} from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth-context'
import type { Asset, Booking } from '../types'

const statusConfig: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:          { label: 'Pending',          cls: 'badge badge-yellow', icon: <Clock className="w-3 h-3" /> },
  booked:           { label: 'Booked',           cls: 'badge badge-blue',   icon: <BookOpen className="w-3 h-3" /> },
  allocated:        { label: 'Allocated',        cls: 'badge badge-purple', icon: <CheckCircle2 className="w-3 h-3" /> },
  ready_for_pickup: { label: 'Return Requested', cls: 'badge badge-amber',  icon: <RotateCcw className="w-3 h-3" /> },
  picked_up:        { label: 'Picked Up',        cls: 'badge badge-green',  icon: <CheckCircle2 className="w-3 h-3" /> },
  returned:         { label: 'Returned',         cls: 'badge badge-gray',   icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled:        { label: 'Cancelled',        cls: 'badge badge-red',    icon: <XCircle className="w-3 h-3" /> },
  overdue:          { label: 'Overdue',          cls: 'badge badge-red',    icon: <AlertCircle className="w-3 h-3" /> },
}

const getNextStep = (status: string): { text: string; color: string } => {
  if (status === 'pending')          return { text: 'Pay deposit to confirm booking', color: '#fbbf24' }
  if (status === 'booked')           return { text: 'Waiting for admin to allocate', color: '#818cf8' }
  if (status === 'allocated')        return { text: 'Pay rent, then request return', color: '#a78bfa' }
  if (status === 'ready_for_pickup') return { text: 'Admin processing your return', color: '#fb923c' }
  if (status === 'picked_up')        return { text: 'Asset currently in use', color: '#34d399' }
  if (status === 'returned')         return { text: 'Booking completed ✓', color: '#6ee7b7' }
  if (status === 'cancelled')        return { text: 'Booking cancelled', color: '#f87171' }
  return { text: 'Monitor status', color: '#71717a' }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function BookingStatCard({ label, value, icon, iconBg }: { label: string; value: number; icon: React.ReactNode; iconBg: string }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconBg}`}>{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  )
}

export function BookingsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')

  const bookingsQuery = useQuery({
    queryKey: ['bookings', token],
    queryFn: async () => {
      if (!token) return []
      return api.listBookings(token)
    },
    enabled: Boolean(token),
  })

  // Load assets to resolve asset names by ID
  const assetsQuery = useQuery({
    queryKey: ['assetsForBookings', token],
    queryFn: async () => {
      if (!token) return [] as Asset[]
      return api.listAssets(token)
    },
    enabled: Boolean(token),
  })

  const assetById = new Map<number, Asset>()
  ;(assetsQuery.data ?? []).forEach((a) => assetById.set(a.id, a))

  const bookings: Booking[] = bookingsQuery.data ?? []
  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const allocatedCount = bookings.filter((b) => b.status === 'allocated').length
  const activeCount = bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'returned').length

  const payDepositMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      if (!token) throw new Error('Missing token')
      return api.payDeposit(token, bookingId)
    },
    onSuccess: async () => {
      setActionError('')
      setNotice('Deposit paid successfully! Your booking is now confirmed.')
      await queryClient.invalidateQueries({ queryKey: ['bookings', token] })
      setTimeout(() => setNotice(''), 5000)
    },
    onError: (error: unknown) => {
      setNotice('')
      setActionError(getErrorMessage(error, 'Failed to pay deposit'))
    },
  })

  const payRentMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      if (!token) throw new Error('Missing token')
      return api.payRent(token, bookingId)
    },
    onSuccess: async () => {
      setActionError('')
      setNotice('Rent paid successfully!')
      await queryClient.invalidateQueries({ queryKey: ['bookings', token] })
      setTimeout(() => setNotice(''), 5000)
    },
    onError: (error: unknown) => {
      setNotice('')
      setActionError(getErrorMessage(error, 'Failed to pay rent'))
    },
  })

  const requestReturnMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      if (!token) throw new Error('Missing token')
      return api.requestReturn(token, bookingId)
    },
    onSuccess: async () => {
      setActionError('')
      setNotice('Return request sent to admin. They will process it shortly.')
      await queryClient.invalidateQueries({ queryKey: ['bookings', token] })
      setTimeout(() => setNotice(''), 5000)
    },
    onError: (error: unknown) => {
      setNotice('')
      setActionError(getErrorMessage(error, 'Failed to request return'))
    },
  })

  const isActionPending = payDepositMutation.isPending || payRentMutation.isPending || requestReturnMutation.isPending
  const formatAmount = (value: number) => `₹${Number(value).toFixed(2)}`

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">View and manage all your bookings in one place</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/assets')}
        >
          <Package2 className="w-4 h-4" /> New Booking
        </button>
      </div>

      {/* Inline notifications */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: 'rgb(16 185 129 / 0.08)', border: '1px solid rgb(16 185 129 / 0.2)' }}
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#34d399' }} />
            <span style={{ fontSize: '0.875rem', color: '#6ee7b7' }}>{notice}</span>
          </motion.div>
        )}
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: 'rgb(239 68 68 / 0.08)', border: '1px solid rgb(239 68 68 / 0.2)' }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#f87171' }} />
            <span style={{ fontSize: '0.875rem', color: '#fca5a5' }}>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      {bookingsQuery.isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton w-11 h-11 rounded-xl" />
              <div>
                <div className="skeleton h-3 w-20 mb-2 rounded" />
                <div className="skeleton h-7 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BookingStatCard label="Total Bookings"  value={bookings.length} icon={<CalendarCheck2 className="w-5 h-5 text-primary-400" />} iconBg="bg-primary-500/15" />
          <BookingStatCard label="Pending Deposit" value={pendingCount}    icon={<Clock className="w-5 h-5 text-amber-400" />}           iconBg="bg-amber-500/15" />
          <BookingStatCard label="Ready to Pay Rent" value={allocatedCount} icon={<CreditCard className="w-5 h-5 text-emerald-400" />}  iconBg="bg-emerald-500/15" />
          <BookingStatCard label="Active"           value={activeCount}    icon={<CheckCircle2 className="w-5 h-5 text-blue-400" />}     iconBg="bg-blue-500/15" />
        </div>
      )}

      {/* Bookings Cards (mobile) + Table (desktop) */}
      <div>
        <div className="section-header">
          <div>
            <h2 className="section-title">Your Bookings</h2>
            <p className="section-subtitle">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {bookingsQuery.isLoading ? (
          <div className="card flex flex-col gap-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton h-4 w-8 rounded" />
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-6 w-20 rounded-full" />
                <div className="skeleton h-4 w-24 rounded" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="card empty-state py-16">
            <div className="empty-state-icon"><CalendarCheck2 className="w-7 h-7" /></div>
            <p className="empty-state-title">No bookings yet</p>
            <p className="empty-state-desc">Go to Assets page to create your first booking.</p>
            <button className="btn btn-primary btn-sm mt-4" onClick={() => navigate('/assets')}>
              Browse Assets
            </button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="flex flex-col gap-3 lg:hidden">
              {bookings.map((booking) => {
                const cfg = statusConfig[booking.status] ?? { label: booking.status, cls: 'badge badge-gray', icon: null }
                const step = getNextStep(booking.status)
                const allocatedAsset = booking.allocated_asset_id != null ? assetById.get(booking.allocated_asset_id) : undefined

                return (
                  <div key={booking.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#71717a' }}>#{booking.id}</span>
                          <span className={cfg.cls}>{cfg.icon}{cfg.label}</span>
                        </div>
                        <p style={{ fontWeight: '600', color: '#e4e4e7', fontSize: '0.9rem' }}>
                          {booking.rental_plan?.name ?? `Plan #${booking.rental_plan_id}`}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.75rem', color: '#71717a' }}>Deposit</p>
                        <p style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.9rem' }}>{formatAmount(booking.deposit_amount)}</p>
                      </div>
                    </div>

                    {allocatedAsset && (
                      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgb(99 102 241 / 0.08)', border: '1px solid rgb(99 102 241 / 0.15)' }}>
                        <Package2 className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
                        <div>
                          <span style={{ fontWeight: '600', color: '#c7d2fe', fontSize: '0.8125rem' }}>{allocatedAsset.name}</span>
                          <span style={{ color: '#71717a', fontSize: '0.75rem', marginLeft: '0.5rem' }}>({allocatedAsset.asset_code})</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mb-3" style={{ fontSize: '0.8125rem', color: '#71717a' }}>
                      <div><span style={{ color: '#52525b' }}>Pickup:</span> {formatDate(booking.pickup_date)}</div>
                      <div><span style={{ color: '#52525b' }}>Due:</span> {formatDate(booking.due_date)}</div>
                    </div>

                    <div className="flex items-center gap-1.5 mb-3" style={{ fontSize: '0.8125rem' }}>
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: step.color }} />
                      <span style={{ color: step.color }}>{step.text}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {booking.status === 'pending' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => { setNotice(''); setActionError(''); payDepositMutation.mutate(booking.id) }}
                          disabled={isActionPending}
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                          {payDepositMutation.isPending ? 'Processing…' : 'Pay Deposit'}
                        </button>
                      )}
                      {booking.status === 'allocated' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => { setNotice(''); setActionError(''); payRentMutation.mutate(booking.id) }}
                          disabled={isActionPending}
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                          {payRentMutation.isPending ? 'Processing…' : 'Pay Rent'}
                        </button>
                      )}
                      {(booking.status === 'picked_up' || booking.status === 'overdue') && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setNotice(''); setActionError(''); requestReturnMutation.mutate(booking.id) }}
                          disabled={isActionPending}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {requestReturnMutation.isPending ? 'Requesting…' : 'Request Return'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="table-wrap hidden lg:block">
              <table className="table">
                <thead>
                  <tr>
                    <th>#ID</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Asset Allocated</th>
                    <th>Pickup</th>
                    <th>Due Date</th>
                    <th>Deposit</th>
                    <th>Rent</th>
                    <th>Next Step</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const cfg = statusConfig[booking.status] ?? { label: booking.status, cls: 'badge badge-gray', icon: null }
                    const step = getNextStep(booking.status)
                    const allocatedAsset = booking.allocated_asset_id != null ? assetById.get(booking.allocated_asset_id) : undefined

                    return (
                      <tr key={booking.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#71717a' }}>#{booking.id}</td>
                        <td style={{ fontWeight: '600', color: '#e4e4e7' }}>{booking.rental_plan?.name ?? `Plan #${booking.rental_plan_id}`}</td>
                        <td>
                          <span className={cfg.cls}>
                            {cfg.icon}{cfg.label}
                          </span>
                        </td>
                        <td>
                          {allocatedAsset ? (
                            <div className="flex items-center gap-2">
                              <Package2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#818cf8' }} />
                              <div>
                                <div style={{ fontWeight: '600', color: '#c7d2fe', fontSize: '0.8125rem', lineHeight: 1.2 }}>{allocatedAsset.name}</div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#71717a' }}>{allocatedAsset.asset_code}</div>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#52525b', fontSize: '0.8125rem', fontStyle: 'italic' }}>Not yet allocated</span>
                          )}
                        </td>
                        <td style={{ color: '#a1a1aa' }}>{formatDate(booking.pickup_date)}</td>
                        <td style={{ color: '#a1a1aa' }}>{formatDate(booking.due_date)}</td>
                        <td style={{ fontWeight: '600', color: '#ffffff' }}>{formatAmount(booking.deposit_amount)}</td>
                        <td style={{ fontWeight: '600', color: '#ffffff' }}>{formatAmount(booking.rent_amount)}</td>
                        <td>
                          <div className="flex items-center gap-1.5" style={{ fontSize: '0.8125rem' }}>
                            <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: step.color }} />
                            <span style={{ color: step.color }}>{step.text}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1.5">
                            {booking.status === 'pending' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => { setNotice(''); setActionError(''); payDepositMutation.mutate(booking.id) }}
                                disabled={isActionPending}
                              >
                                {payDepositMutation.isPending ? 'Processing…' : 'Pay Deposit'}
                              </button>
                            )}
                            {booking.status === 'allocated' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => { setNotice(''); setActionError(''); payRentMutation.mutate(booking.id) }}
                                disabled={isActionPending}
                              >
                                {payRentMutation.isPending ? 'Processing…' : 'Pay Rent'}
                              </button>
                            )}
                            {(booking.status === 'picked_up' || booking.status === 'overdue') && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => { setNotice(''); setActionError(''); requestReturnMutation.mutate(booking.id) }}
                                disabled={isActionPending}
                              >
                                {requestReturnMutation.isPending ? 'Requesting…' : 'Request Return'}
                              </button>
                            )}
                            {booking.status === 'ready_for_pickup' && (
                              <span style={{ color: '#fb923c', fontSize: '0.8125rem' }}>Return Requested</span>
                            )}
                            {(booking.status === 'returned' || booking.status === 'cancelled') && (
                              <span style={{ color: '#52525b', fontSize: '0.8125rem' }}>—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
