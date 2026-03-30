import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  AlertCircle,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth-context'
import type { Booking } from '../types'

const statusConfig: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    cls: 'badge badge-yellow', icon: <Clock className="w-3 h-3" /> },
  booked:     { label: 'Booked',     cls: 'badge badge-blue',   icon: <BookOpen className="w-3 h-3" /> },
  allocated:  { label: 'Allocated',  cls: 'badge badge-purple', icon: <CheckCircle2 className="w-3 h-3" /> },
  picked_up:  { label: 'Picked Up',  cls: 'badge badge-green',  icon: <CheckCircle2 className="w-3 h-3" /> },
  returned:   { label: 'Returned',   cls: 'badge badge-gray',   icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled:  { label: 'Cancelled',  cls: 'badge badge-red',    icon: <XCircle className="w-3 h-3" /> },
  overdue:    { label: 'Overdue',    cls: 'badge badge-red',    icon: <AlertCircle className="w-3 h-3" /> },
}

const getNextStep = (status: string): string => {
  if (status === 'pending')   return 'Pay deposit to confirm'
  if (status === 'booked')    return 'Admin will allocate'
  if (status === 'allocated') return 'Pay rent or request return'
  if (status === 'ready_for_pickup') return 'Return request sent to admin'
  if (status === 'picked_up') return 'Asset in use'
  if (status === 'returned')  return 'Completed'
  if (status === 'cancelled') return 'Cancelled'
  return 'Monitor status'
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
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
      setNotice('Deposit paid successfully.')
      await queryClient.invalidateQueries({ queryKey: ['bookings', token] })
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
      setNotice('Rent paid successfully.')
      await queryClient.invalidateQueries({ queryKey: ['bookings', token] })
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
      setNotice('Return request sent to admin successfully.')
      await queryClient.invalidateQueries({ queryKey: ['bookings', token] })
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Bookings</h1>
          <p className="text-surface-400 text-sm mt-1">View all your bookings in one place</p>
        </div>
        <button
          className="btn-primary btn"
          onClick={() => navigate('/assets')}
        >
          Create Booking
        </button>
      </div>

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
          <BookingStatCard label="Total Bookings" value={bookings.length} icon={<CalendarCheck2 className="w-5 h-5 text-primary-400" />} iconBg="bg-primary-500/15" />
          <BookingStatCard label="Pending Deposit" value={pendingCount} icon={<Clock className="w-5 h-5 text-amber-400" />} iconBg="bg-amber-500/15" />
          <BookingStatCard label="Ready for Rent" value={allocatedCount} icon={<CreditCard className="w-5 h-5 text-emerald-400" />} iconBg="bg-emerald-500/15" />
          <BookingStatCard label="Active" value={activeCount} icon={<CheckCircle2 className="w-5 h-5 text-blue-400" />} iconBg="bg-blue-500/15" />
        </div>
      )}

      {/* Bookings Table */}
      <div>
        {notice && <p className="text-emerald-300 text-sm">{notice}</p>}
        {actionError && <p className="error-text">{actionError}</p>}

        <div className="section-header">
          <div>
            <h2 className="section-title">Your Bookings</h2>
            <p className="section-subtitle">{bookings.length} total bookings</p>
          </div>
        </div>

        <div className="table-wrap">
          {bookingsQuery.isLoading ? (
            <div className="p-6 flex flex-col gap-4">
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
            <div className="empty-state py-16">
              <div className="empty-state-icon"><CalendarCheck2 className="w-7 h-7" /></div>
              <p className="empty-state-title">No bookings yet</p>
              <p className="empty-state-desc">Go to Assets page to create your first booking.</p>
              <button className="btn-primary btn btn-sm mt-4" onClick={() => navigate('/assets')}>
                Create My First Booking
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Asset</th>
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
                  return (
                    <tr key={booking.id}>
                      <td className="font-mono text-xs text-surface-400">#{booking.id}</td>
                      <td className="font-medium text-white">{booking.rental_plan?.name ?? `Plan #${booking.rental_plan_id}`}</td>
                      <td>
                        <span className={cfg.cls}>
                          {cfg.icon}{cfg.label}
                        </span>
                      </td>
                      <td className="text-surface-400">{booking.allocated_asset_id ? `#${booking.allocated_asset_id}` : 'Not allocated yet'}</td>
                      <td className="text-surface-400">{booking.pickup_date}</td>
                      <td className="text-surface-400">{booking.due_date}</td>
                      <td className="text-white font-semibold">{formatAmount(booking.deposit_amount)}</td>
                      <td className="text-white font-semibold">{formatAmount(booking.rent_amount)}</td>
                      <td className="text-xs text-surface-400">
                        <span className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-primary-500" />
                          {getNextStep(booking.status)}
                        </span>
                      </td>
                      <td>
                        {booking.status === 'pending' ? (
                          <button
                            className="btn-primary btn btn-sm"
                            type="button"
                            onClick={() => {
                              setNotice('')
                              setActionError('')
                              payDepositMutation.mutate(booking.id)
                            }}
                            disabled={isActionPending}
                          >
                            {payDepositMutation.isPending ? 'Processing...' : 'Pay Deposit'}
                          </button>
                        ) : booking.status === 'allocated' || booking.status === 'picked_up' || booking.status === 'overdue' ? (
                          <div className="btn-inline">
                            {booking.status === 'allocated' && (
                              <button
                                className="btn-primary btn btn-sm"
                                type="button"
                                onClick={() => {
                                  setNotice('')
                                  setActionError('')
                                  payRentMutation.mutate(booking.id)
                                }}
                                disabled={isActionPending}
                              >
                                {payRentMutation.isPending ? 'Processing...' : 'Pay Rent'}
                              </button>
                            )}
                            <button
                              className="btn secondary"
                              type="button"
                              onClick={() => {
                                setNotice('')
                                setActionError('')
                                requestReturnMutation.mutate(booking.id)
                              }}
                              disabled={isActionPending}
                            >
                              {requestReturnMutation.isPending ? 'Requesting...' : `Request Return ${booking.allocated_asset_id ? `Asset #${booking.allocated_asset_id}` : ''}`}
                            </button>
                          </div>
                        ) : booking.status === 'ready_for_pickup' ? (
                          <span className="text-xs text-amber-300">Return Requested</span>
                        ) : (
                          <span className="text-xs text-surface-500">No action</span>
                        )}
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
