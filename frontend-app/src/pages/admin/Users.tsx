import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
      if (!token || !selectedUserId) {
        throw new Error('Missing user selection')
      }
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

  if (usersQuery.isLoading) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">Loading users...</div>
      </section>
    )
  }

  if (usersQuery.isError) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">Failed to load users.</div>
      </section>
    )
  }

  return (
    <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Admin Users</h1>
        <p className="text-sm text-zinc-400">Manage users and review individual booking and payment history.</p>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg space-y-6">
      {(roleMutation.error || activeMutation.error || allocateMutation.error || rejectMutation.error) && (
        <p className="error-text">{roleMutation.error?.message || activeMutation.error?.message || allocateMutation.error?.message || rejectMutation.error?.message}</p>
      )}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersQuery.data?.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No users found.
                </td>
              </tr>
            )}
            {usersQuery.data?.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{String(user.is_active)}</td>
                <td>
                  <div className="btn-inline">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      View History
                    </button>
                    <button
                      className="btn secondary"
                      type="button"
                      disabled={roleMutation.isPending}
                      onClick={() => roleMutation.mutate({ id: user.id, role: user.role === 'admin' ? 'user' : 'admin' })}
                    >
                      {roleMutation.isPending ? 'Updating...' : 'Toggle Role'}
                    </button>
                    <button
                      className="btn danger"
                      type="button"
                      disabled={activeMutation.isPending}
                      onClick={() => activeMutation.mutate({ id: user.id, is_active: !user.is_active })}
                    >
                      {activeMutation.isPending ? 'Updating...' : user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {selectedUserId && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur p-6 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">User Booking & Payment History</h3>
            <button className="btn btn-ghost" type="button" onClick={() => setSelectedUserId(null)}>
              Close
            </button>
          </div>

          {historyQuery.isLoading ? (
            <p className="muted">Loading user history...</p>
          ) : historyQuery.isError ? (
            <p className="error-text">Failed to load user history.</p>
          ) : historyQuery.data ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/70 p-4">
                  <p className="text-xs text-zinc-500">Total Bookings</p>
                  <p className="text-xl font-semibold text-white">{historyQuery.data.summary.total_bookings}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/70 p-4">
                  <p className="text-xs text-zinc-500">Active Bookings</p>
                  <p className="text-xl font-semibold text-white">{historyQuery.data.summary.active_bookings}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/70 p-4">
                  <p className="text-xs text-zinc-500">Deposit Paid</p>
                  <p className="text-xl font-semibold text-white">₹{historyQuery.data.summary.total_deposit_paid.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/70 p-4">
                  <p className="text-xs text-zinc-500">Rent Paid</p>
                  <p className="text-xl font-semibold text-white">₹{historyQuery.data.summary.total_rent_paid.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/70 p-4">
                  <p className="text-xs text-zinc-500">Fine Paid</p>
                  <p className="text-xl font-semibold text-white">₹{historyQuery.data.summary.total_fine_paid.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/70 p-4">
                  <p className="text-xs text-zinc-500">Deposit Refunded</p>
                  <p className="text-xl font-semibold text-white">₹{historyQuery.data.summary.total_deposit_refunded.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-zinc-300">Booking History</h4>
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
                            <td>#{booking.id}</td>
                            <td>{booking.status}</td>
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
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-zinc-300">Allocation Decisions For This User</h4>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Booking</th>
                        <th>Status</th>
                        <th>Requested Asset</th>
                        <th>Allocate Requested</th>
                        <th>Allocate Alternate</th>
                        <th>Reject Request</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyQuery.data.bookings.filter((b) => b.status === 'booked').length === 0 ? (
                        <tr>
                          <td colSpan={6} className="muted">No pending allocation decisions for this user.</td>
                        </tr>
                      ) : (
                        historyQuery.data.bookings
                          .filter((booking) => booking.status === 'booked')
                          .map((booking) => {
                            const requestedAsset = getRequestedAsset(booking.requested_asset_id)
                            const requestedAvailable = Boolean(requestedAsset && requestedAsset.status === 'available')
                            const alternateAssets = getAlternativeAssets(booking)
                            const selectedAltAssetId = selectedAssetByBooking[booking.id] ?? alternateAssets[0]?.id

                            return (
                              <tr key={`decision-${booking.id}`}>
                                <td>#{booking.id}</td>
                                <td>{booking.status}</td>
                                <td>
                                  {requestedAsset ? (
                                    <span>
                                      {requestedAsset.name} ({requestedAsset.asset_code}) - {requestedAsset.status}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400">No specific asset requested</span>
                                  )}
                                </td>
                                <td>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    type="button"
                                    disabled={!requestedAvailable || allocateMutation.isPending}
                                    onClick={() => {
                                      if (!requestedAsset) return
                                      allocateMutation.mutate({ bookingId: booking.id, assetId: requestedAsset.id })
                                    }}
                                  >
                                    {allocateMutation.isPending ? 'Allocating...' : 'Allocate Requested'}
                                  </button>
                                </td>
                                <td>
                                  <div className="flex items-center gap-2">
                                    <select
                                      className="form-select"
                                      value={selectedAltAssetId ?? ''}
                                      onChange={(e) => {
                                        const id = Number(e.target.value)
                                        setSelectedAssetByBooking((prev) => ({ ...prev, [booking.id]: id }))
                                      }}
                                      disabled={alternateAssets.length === 0 || allocateMutation.isPending}
                                    >
                                      {alternateAssets.length === 0 ? (
                                        <option value="">No alternate assets</option>
                                      ) : (
                                        alternateAssets.map((asset) => (
                                          <option key={asset.id} value={asset.id}>
                                            {asset.name} ({asset.asset_code})
                                          </option>
                                        ))
                                      )}
                                    </select>
                                    <button
                                      className="btn secondary"
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
                                    className="btn danger"
                                    type="button"
                                    disabled={rejectMutation.isPending}
                                    onClick={() => rejectMutation.mutate(booking.id)}
                                  >
                                    {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                                  </button>
                                </td>
                              </tr>
                            )
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-zinc-300">Payment History</h4>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Payment ID</th>
                        <th>Booking ID</th>
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
                            <td>{payment.type}</td>
                            <td>{payment.status}</td>
                            <td>₹{payment.amount.toLocaleString()}</td>
                            <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </section>
  )
}
