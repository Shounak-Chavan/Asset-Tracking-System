import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, X, Shield, User as UserIcon,
  CheckCircle2, XCircle, History,
} from 'lucide-react'
import { api } from '../../api'
import { useAuth } from '../../auth-context'
import type { Asset } from '../../types'

export function AdminUsersPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedAssetByBooking, setSelectedAssetByBooking] = useState<Record<number, number>>({})

  const usersQuery = useQuery({
    queryKey: ['users', token],
    queryFn: async () => {
      if (!token) return []
      return api.listUsers(token)
    },
    enabled: Boolean(token),
  })

  const roleMutation = useMutation({
    mutationFn: async (payload: { id: number; role: 'admin' | 'user' }) => {
      if (!token) throw new Error('Missing token')
      return api.setUserRole(token, payload.id, payload.role)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users', token] })
    },
  })

  const activeMutation = useMutation({
    mutationFn: async (payload: { id: number; is_active: boolean }) => {
      if (!token) throw new Error('Missing token')
      return api.setUserActive(token, payload.id, payload.is_active)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users', token] })
    },
  })

  const historyQuery = useQuery({
    queryKey: ['userHistory', token, selectedUserId],
    queryFn: async () => {
      if (!token || !selectedUserId) throw new Error('Missing user selection')
      return api.getUserHistory(token, selectedUserId)
    },
    enabled: Boolean(token) && selectedUserId !== null,
  })

  const assetsQuery = useQuery({
    queryKey: ['assets', token],
    queryFn: async () => {
      if (!token) return []
      return api.listAssets(token)
    },
    enabled: Boolean(token),
  })

  const allocateMutation = useMutation({
    mutationFn: async (payload: { bookingId: number; assetId: number }) => {
      if (!token) throw new Error('Missing token')
      return api.allocateAsset(token, payload.bookingId, payload.assetId)
    },
    onSuccess: async () => {
      if (selectedUserId !== null) {
        await queryClient.invalidateQueries({ queryKey: ['userHistory', token, selectedUserId] })
      }
      await queryClient.invalidateQueries({ queryKey: ['adminBookings', token] })
      await queryClient.invalidateQueries({ queryKey: ['assets', token] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      if (!token) throw new Error('Missing token')
      return api.rejectBookingByAdmin(token, bookingId)
    },
    onSuccess: async () => {
      if (selectedUserId !== null) {
        await queryClient.invalidateQueries({ queryKey: ['userHistory', token, selectedUserId] })
      }
      await queryClient.invalidateQueries({ queryKey: ['adminBookings', token] })
    },
  })

  const availableAssets = (assetsQuery.data ?? []).filter((asset) => asset.status === 'available')

  const getRequestedAsset = (requestedAssetId?: number | null): Asset | null => {
    if (!requestedAssetId) return null
    return (assetsQuery.data ?? []).find((asset) => asset.id === requestedAssetId) ?? null
  }

  const getAlternativeAssets = (booking: { category_id?: number | null; requested_asset_id?: number | null }) => {
    return availableAssets.filter((asset) => {
      if (booking.category_id && asset.category_id !== booking.category_id) return false
      if (booking.requested_asset_id && asset.id === booking.requested_asset_id) return false
      return true
    })
  }

  const users = usersQuery.data ?? []
  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage user accounts, roles, and view booking history.</p>
        </div>
        <div className="badge badge-blue">
          <Users className="w-3 h-3" /> {users.length} Users
        </div>
      </div>

      {/* Error strip */}
      {(roleMutation.error || activeMutation.error || allocateMutation.error || rejectMutation.error) && (
        <div className="error-text text-sm rounded-xl px-4 py-3" style={{ background: 'rgb(239 68 68 / 0.08)', border: '1px solid rgb(239 68 68 / 0.2)' }}>
          {roleMutation.error?.message || activeMutation.error?.message || allocateMutation.error?.message || rejectMutation.error?.message}
        </div>
      )}

      {/* Users table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #27272a' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#e4e4e7' }}>All Users</h2>
          {usersQuery.isLoading && <span style={{ fontSize: '0.8125rem', color: '#71717a' }}>Loading...</span>}
        </div>

        {usersQuery.isError ? (
          <div className="px-5 py-6"><p className="error-text text-sm">Failed to load users.</p></div>
        ) : users.length === 0 && !usersQuery.isLoading ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="w-10 h-10" style={{ color: '#3f3f46' }} />
            <p style={{ color: '#71717a', fontSize: '0.875rem' }}>No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full" style={{ minWidth: '680px' }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: user.role === 'admin' ? 'linear-gradient(135deg, #6366f1, #4338ca)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}
                        >
                          {(user.full_name ?? 'U').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#e4e4e7', fontSize: '0.875rem' }}>{user.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>#{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-purple' : 'badge-blue'}`} style={{ display: 'inline-flex' }}>
                        {user.role === 'admin'
                          ? <><Shield className="w-3 h-3" /> Admin</>
                          : <><UserIcon className="w-3 h-3" /> User</>
                        }
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-green' : 'badge-red'}`} style={{ display: 'inline-flex' }}>
                        {user.is_active
                          ? <><CheckCircle2 className="w-3 h-3" /> Active</>
                          : <><XCircle className="w-3 h-3" /> Inactive</>
                        }
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          className="btn btn-primary"
                          style={{ height: '2rem', padding: '0 0.625rem', fontSize: '0.8125rem', gap: '0.25rem' }}
                          type="button"
                          onClick={() => setSelectedUserId(user.id === selectedUserId ? null : user.id)}
                        >
                          <History className="w-3 h-3" />
                          History
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ height: '2rem', padding: '0 0.625rem', fontSize: '0.8125rem', gap: '0.25rem' }}
                          type="button"
                          disabled={roleMutation.isPending}
                          onClick={() => roleMutation.mutate({ id: user.id, role: user.role === 'admin' ? 'user' : 'admin' })}
                        >
                          <Shield className="w-3 h-3" />
                          {user.role === 'admin' ? '→ User' : '→ Admin'}
                        </button>
                        <button
                          className={`btn ${user.is_active ? 'btn-danger' : 'btn-primary'}`}
                          style={{ height: '2rem', padding: '0 0.625rem', fontSize: '0.8125rem', gap: '0.25rem' }}
                          type="button"
                          disabled={activeMutation.isPending}
                          onClick={() => activeMutation.mutate({ id: user.id, is_active: !user.is_active })}
                        >
                          {user.is_active ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User History Panel */}
      <AnimatePresence>
        {selectedUserId && selectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="card"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}
                >
                  {(selectedUser.full_name ?? 'U').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#e4e4e7' }}>
                    {selectedUser.full_name}
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>{selectedUser.email}</p>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setSelectedUserId(null)}
                style={{ height: '2rem', padding: '0 0.75rem', fontSize: '0.8125rem', gap: '0.25rem' }}
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </div>

            {historyQuery.isLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
              </div>
            ) : historyQuery.isError ? (
              <p className="error-text text-sm">Failed to load user history.</p>
            ) : historyQuery.data ? (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Total Bookings', value: historyQuery.data.summary.total_bookings },
                    { label: 'Active Bookings', value: historyQuery.data.summary.active_bookings },
                    { label: 'Deposit Paid', value: `₹${historyQuery.data.summary.total_deposit_paid.toLocaleString()}` },
                    { label: 'Rent Paid', value: `₹${historyQuery.data.summary.total_rent_paid.toLocaleString()}` },
                    { label: 'Fine Paid', value: `₹${historyQuery.data.summary.total_fine_paid.toLocaleString()}` },
                    { label: 'Deposit Refunded', value: `₹${historyQuery.data.summary.total_deposit_refunded.toLocaleString()}` },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3.5"
                      style={{ background: '#27272a', border: '1px solid #3f3f46' }}
                    >
                      <p style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '0.25rem' }}>{label}</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: '700', color: '#ffffff' }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Booking History */}
                <div className="flex flex-col gap-4">
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#e4e4e7' }}>Booking History</h3>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Status</th>
                          <th>Pickup</th>
                          <th>Due</th>
                          <th>Deposit</th>
                          <th>Rent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyQuery.data.bookings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="muted">No bookings found for this user.</td>
                          </tr>
                        ) : (
                          historyQuery.data.bookings.map((booking) => (
                            <tr key={booking.id}>
                              <td><strong>#{booking.id}</strong></td>
                              <td>
                                <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
                              </td>
                              <td>{new Date(booking.pickup_date).toLocaleDateString()}</td>
                              <td>{new Date(booking.due_date).toLocaleDateString()}</td>
                              <td>₹{booking.deposit_amount.toLocaleString()}</td>
                              <td>₹{booking.rent_amount.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Allocation decisions for pending bookings */}
                  {historyQuery.data.bookings.some((b) => b.status === 'booked') && (
                    <>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#e4e4e7' }}>Pending Allocation Decisions</h3>
                      <div className="table-wrap">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Booking</th>
                              <th>Requested Asset</th>
                              <th>Allocate Requested</th>
                              <th>Allocate Alternate</th>
                              <th>Reject</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyQuery.data.bookings
                              .filter((b) => b.status === 'booked')
                              .map((booking) => {
                                const requestedAsset = getRequestedAsset(booking.requested_asset_id)
                                const requestedAvailable = Boolean(requestedAsset && requestedAsset.status === 'available')
                                const alternateAssets = getAlternativeAssets(booking)
                                const selectedAltAssetId = selectedAssetByBooking[booking.id] ?? alternateAssets[0]?.id

                                return (
                                  <tr key={`decision-${booking.id}`}>
                                    <td><strong>#{booking.id}</strong></td>
                                    <td>
                                      {requestedAsset ? (
                                        <div>
                                          <div style={{ fontWeight: '500', color: '#e4e4e7', fontSize: '0.875rem' }}>{requestedAsset.name}</div>
                                          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>{requestedAsset.asset_code} · {requestedAsset.status}</div>
                                        </div>
                                      ) : (
                                        <span style={{ color: '#71717a', fontSize: '0.875rem' }}>Any in category</span>
                                      )}
                                    </td>
                                    <td>
                                      <button
                                        className="btn btn-primary"
                                        style={{ height: '2rem', padding: '0 0.625rem', fontSize: '0.8125rem' }}
                                        type="button"
                                        disabled={!requestedAvailable || allocateMutation.isPending}
                                        onClick={() => {
                                          if (!requestedAsset) return
                                          allocateMutation.mutate({ bookingId: booking.id, assetId: requestedAsset.id })
                                        }}
                                      >
                                        Allocate Requested
                                      </button>
                                    </td>
                                    <td>
                                      <div className="flex items-center gap-2">
                                        <select
                                          className="form-select"
                                          style={{ height: '2rem', fontSize: '0.8125rem', width: '160px' }}
                                          value={selectedAltAssetId ?? ''}
                                          onChange={(e) => {
                                            const id = Number(e.target.value)
                                            setSelectedAssetByBooking((prev) => ({ ...prev, [booking.id]: id }))
                                          }}
                                          disabled={alternateAssets.length === 0 || allocateMutation.isPending}
                                        >
                                          {alternateAssets.length === 0
                                            ? <option value="">No alternatives</option>
                                            : alternateAssets.map((asset) => (
                                              <option key={asset.id} value={asset.id}>
                                                {asset.name}
                                              </option>
                                            ))
                                          }
                                        </select>
                                        <button
                                          className="btn btn-secondary"
                                          style={{ height: '2rem', padding: '0 0.625rem', fontSize: '0.8125rem' }}
                                          type="button"
                                          disabled={!selectedAltAssetId || allocateMutation.isPending}
                                          onClick={() => {
                                            if (!selectedAltAssetId) return
                                            allocateMutation.mutate({ bookingId: booking.id, assetId: selectedAltAssetId })
                                          }}
                                        >
                                          Allocate
                                        </button>
                                      </div>
                                    </td>
                                    <td>
                                      <button
                                        className="btn btn-danger"
                                        style={{ height: '2rem', padding: '0 0.625rem', fontSize: '0.8125rem' }}
                                        type="button"
                                        disabled={rejectMutation.isPending}
                                        onClick={() => rejectMutation.mutate(booking.id)}
                                      >
                                        Reject
                                      </button>
                                    </td>
                                  </tr>
                                )
                              })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* Payment History */}
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#e4e4e7' }}>Payment History</h3>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Payment ID</th>
                          <th>Booking</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Amount</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyQuery.data.payments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="muted">No payments found for this user.</td>
                          </tr>
                        ) : (
                          historyQuery.data.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td>#{payment.id}</td>
                              <td>#{payment.booking_id}</td>
                              <td>
                                <span className={`badge ${payment.type === 'deposit_refund' ? 'badge-green' : 'badge-blue'}`} style={{ display: 'inline-flex', fontSize: '0.75rem' }}>
                                  {payment.type}
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge status-${payment.status}`}>{payment.status}</span>
                              </td>
                              <td style={{ fontWeight: '600', color: '#e4e4e7' }}>₹{payment.amount.toLocaleString()}</td>
                              <td style={{ color: '#a1a1aa' }}>{new Date(payment.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
