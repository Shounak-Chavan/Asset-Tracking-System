import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '../../api'
import { useAuth } from '../../auth-context'
import type { Asset, Booking, Category } from '../../types'

const allocationSchema = z.object({
  booking_id: z.number().int().positive(),
  asset_id: z.number().int().positive(),
})

const returnSchema = z.object({
  booking_id: z.number().int().positive(),
  returned_at: z.string().min(1),
  damage_amount: z.number().min(0),
  damage_notes: z.string().optional(),
})

type AllocationForm = z.infer<typeof allocationSchema>
type ReturnForm = z.infer<typeof returnSchema>

export function AdminOperationsPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [selectedBookingForAlloc, setSelectedBookingForAlloc] = useState<Booking | null>(null)
  const [selectedAssetForAlloc, setSelectedAssetForAlloc] = useState<Asset | null>(null)
  const [selectedReturnBookingId, setSelectedReturnBookingId] = useState<number | null>(null)
  const [allocationNotice, setAllocationNotice] = useState('')
  const [returnNotice, setReturnNotice] = useState('')

  const allocationForm = useForm<AllocationForm>({
    resolver: zodResolver(allocationSchema),
  })

  const returnForm = useForm<ReturnForm>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      damage_amount: 0,
      damage_notes: '',
    },
  })

  const bookingsQuery = useQuery({
    queryKey: ['adminBookings', token],
    queryFn: async () => {
      if (!token) return []
      return api.listAdminBookings(token)
    },
    enabled: Boolean(token),
  })

  const assetsQuery = useQuery({
    queryKey: ['assets', token],
    queryFn: async () => {
      if (!token) return []
      return api.listAssets(token)
    },
    enabled: Boolean(token),
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories', token],
    queryFn: async () => {
      if (!token) return []
      return api.listCategories(token)
    },
    enabled: Boolean(token),
  })

  // Get bookings ready for allocation (status = "booked")
  const bookedBookings = useMemo(() => {
    return bookingsQuery.data?.filter((b) => b.status === 'booked') ?? []
  }, [bookingsQuery.data])

  // Bookings eligible for admin return acceptance and processing
  const returnableBookings = useMemo(() => {
    return (
      bookingsQuery.data?.filter(
        (b) => b.status === 'ready_for_pickup',
      ) ?? []
    )
  }, [bookingsQuery.data])

  // All bookings for reference
  const allBookings = bookingsQuery.data ?? []

  // Map ID to category name
  const categoryMap = useMemo(() => {
    const map: Record<number, string> = {}
    categoriesQuery.data?.forEach((cat: Category) => {
      map[cat.id] = cat.name
    })
    return map
  }, [categoriesQuery.data])

  const assetById = useMemo(() => {
    const map = new Map<number, Asset>()
    ;(assetsQuery.data ?? []).forEach((asset) => {
      map.set(asset.id, asset)
    })
    return map
  }, [assetsQuery.data])

  // Available assets filtered by requested category
  const availableAssetsForSelectedBooking = useMemo(() => {
    if (!selectedBookingForAlloc || !selectedBookingForAlloc.category_id) {
      return assetsQuery.data?.filter((a) => a.status === 'available') ?? []
    }
    return (
      assetsQuery.data?.filter(
        (a) => a.status === 'available' && a.category_id === selectedBookingForAlloc.category_id
      ) ?? []
    )
  }, [selectedBookingForAlloc, assetsQuery.data])

  const requestedAsset = selectedBookingForAlloc?.requested_asset_id
    ? assetById.get(selectedBookingForAlloc.requested_asset_id)
    : null
  const isRequestedAssetAvailable = Boolean(requestedAsset && requestedAsset.status === 'available')

  const allocateMutation = useMutation({
    mutationFn: async (values: AllocationForm) => {
      if (!token) throw new Error('Missing token')
      return api.allocateAsset(token, values.booking_id, values.asset_id)
    },
    onSuccess: async () => {
      setAllocationNotice('✓ Asset allocated successfully!')
      allocationForm.reset()
      setSelectedBookingForAlloc(null)
      setSelectedAssetForAlloc(null)
      await queryClient.invalidateQueries({ queryKey: ['adminBookings', token] })
      await queryClient.invalidateQueries({ queryKey: ['assets', token] })
      setTimeout(() => setAllocationNotice(''), 3000)
    },
  })

  const returnMutation = useMutation({
    mutationFn: async (values: ReturnForm) => {
      if (!token) throw new Error('Missing token')
      return api.processReturn(
        token,
        values.booking_id,
        values.returned_at,
        values.damage_amount,
        values.damage_notes ?? null,
      )
    },
    onSuccess: async () => {
      setReturnNotice('Return processed and asset moved back to available inventory.')
      returnForm.reset()
      setSelectedReturnBookingId(null)
      await queryClient.invalidateQueries({ queryKey: ['adminBookings', token] })
      await queryClient.invalidateQueries({ queryKey: ['assets', token] })
      setTimeout(() => setReturnNotice(''), 3000)
    },
  })

  if (bookingsQuery.isLoading || assetsQuery.isLoading) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">Loading booking & assets...</div>
      </section>
    )
  }

  if (bookingsQuery.isError || assetsQuery.isError) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">Failed to load data.</div>
      </section>
    )
  }

  return (
    <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Admin Operations</h1>
        <p className="text-sm text-zinc-400">Handle smart allocation, returns, and booking oversight.</p>
      </header>

      {/* ALLOCATION WORKFLOW */}
      <div className="ops-section bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
        <h3>Smart Asset Allocation</h3>
        <p className="muted">Step 1: Select a booking → Step 2: Choose an available asset from that category</p>

        {allocationNotice && <div className="notice">{allocationNotice}</div>}

        {/* STEP 1: Booking Selection Cards */}
        <div className="ops-step">
          <h4>Step 1: Select Booking (Status: Booked)</h4>
          {bookedBookings.length === 0 ? (
            <p className="notice">ℹ️ No bookings with "booked" status.</p>
          ) : (
            <div className="ops-grid ops-grid-booking">
              {bookedBookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => {
                    setSelectedBookingForAlloc(booking)
                    setSelectedAssetForAlloc(null)
                  }}
                  className={selectedBookingForAlloc?.id === booking.id ? 'ops-select-card is-selected' : 'ops-select-card'}
                >
                  <div className="ops-card-title">
                    <strong>Booking #{booking.id}</strong>
                  </div>
                  <div className="ops-card-meta">User #{booking.user_id}</div>
                  <div className="ops-card-meta">Pickup: {new Date(booking.pickup_date).toLocaleDateString()}</div>
                  <div className="ops-card-meta">Plan: {booking.rental_plan?.name ?? `Plan #${booking.rental_plan_id}`}</div>
                  {booking.category_id && (
                    <div className="ops-chip">Requested: {categoryMap[booking.category_id] || `Category #${booking.category_id}`}
                    </div>
                  )}
                  {booking.requested_asset_id && (
                    <div className="ops-card-meta">Requested Asset ID: #{booking.requested_asset_id}</div>
                  )}
                  <div className="ops-card-subtle">
                    Deposit: ₹{booking.deposit_amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STEP 2: Asset Selection (only if booking selected) */}
        {selectedBookingForAlloc && (
          <div className="ops-step">
            <h4>Step 2: Select Available Asset (Category: {categoryMap[selectedBookingForAlloc.category_id!] || 'Any'})</h4>
            {selectedBookingForAlloc.requested_asset_id && (
              <div className="ops-confirm-panel">
                <h4>User Requested Asset</h4>
                {requestedAsset ? (
                  <div className="ops-confirm-copy">
                    <strong>{requestedAsset.name}</strong> ({requestedAsset.asset_code})
                    <br />
                    Status: {requestedAsset.status}
                    <br />
                    {isRequestedAssetAvailable
                      ? 'Requested asset is available. You can allocate it directly.'
                      : 'Requested asset is not available. Select a different asset below.'}
                  </div>
                ) : (
                  <div className="ops-confirm-copy">Requested asset was not found. Choose another available asset.</div>
                )}
                {isRequestedAssetAvailable && requestedAsset && (
                  <button
                    className="btn primary"
                    type="button"
                    disabled={allocateMutation.isPending}
                    onClick={() => {
                      setSelectedAssetForAlloc(requestedAsset)
                      allocateMutation.mutate({
                        booking_id: selectedBookingForAlloc.id,
                        asset_id: requestedAsset.id,
                      })
                    }}
                  >
                    {allocateMutation.isPending ? 'Allocating...' : 'Allocate Requested Asset'}
                  </button>
                )}
              </div>
            )}

            {availableAssetsForSelectedBooking.length === 0 ? (
              <p className="error-text">
                ✗ No available assets in {categoryMap[selectedBookingForAlloc.category_id!] || 'this'} category.
              </p>
            ) : (
              <div className="ops-grid ops-grid-asset">
                {availableAssetsForSelectedBooking.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAssetForAlloc(asset)}
                    className={selectedAssetForAlloc?.id === asset.id ? 'ops-select-card is-selected' : 'ops-select-card'}
                  >
                    <div className="ops-card-title">
                      <strong>{asset.name}</strong>
                    </div>
                    <div className="ops-card-meta">
                      Code: <code>{asset.asset_code}</code>
                    </div>
                    <div className="ops-card-meta">
                      Category: {categoryMap[asset.category_id] || `#${asset.category_id}`}
                    </div>
                    <div className="ops-card-subtle">
                      Status: <span className="ops-available-status">{asset.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Confirmation & Action */}
        {selectedBookingForAlloc && selectedAssetForAlloc && (
          <div className="ops-confirm-panel">
            <h4>Step 3: Confirm Allocation</h4>
            <div className="ops-confirm-copy">
              <strong>Booking #{selectedBookingForAlloc.id}</strong> (User #{selectedBookingForAlloc.user_id})
              <br />
              <strong>Requested:</strong> {categoryMap[selectedBookingForAlloc.category_id!]}
              <br />
              <strong>Requested Asset:</strong> {selectedBookingForAlloc.requested_asset_id ? `#${selectedBookingForAlloc.requested_asset_id}` : 'No specific asset'}
              <br />
              <strong>Assigning:</strong> {selectedAssetForAlloc.name} ({selectedAssetForAlloc.asset_code})
            </div>
            <button
              className="btn primary"
              type="button"
              disabled={allocateMutation.isPending}
              onClick={() => {
                allocateMutation.mutate({
                  booking_id: selectedBookingForAlloc.id,
                  asset_id: selectedAssetForAlloc.id,
                })
              }}
            >
              {allocateMutation.isPending ? 'Allocating...' : 'Confirm Allocation'}
            </button>
            {allocateMutation.error && <p className="error-text">{allocateMutation.error.message}</p>}
          </div>
        )}
      </div>

      {/* RETURN WORKFLOW */}
      <div className="ops-section ops-section-divider bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
        <h3>Accept and Process Returns</h3>
        <p className="muted">Accept user return requests and refund deposit minus fine/damage.</p>
        {returnNotice && <div className="notice">{returnNotice}</div>}

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>User ID</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Due Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {returnableBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    No user return requests pending acceptance.
                  </td>
                </tr>
              )}
              {returnableBookings.map((booking) => (
                <tr key={booking.id} className="status-allocated">
                  <td>
                    <strong>#{booking.id}</strong>
                  </td>
                  <td>{booking.user_id}</td>
                  <td>
                    <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
                  </td>
                  <td>{booking.rental_plan?.name ?? `Plan #${booking.rental_plan_id}`}</td>
                  <td>{new Date(booking.due_date).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn secondary"
                      type="button"
                      disabled={returnMutation.isPending}
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0]
                        setSelectedReturnBookingId(booking.id)
                        returnForm.setValue('booking_id', booking.id)
                        returnForm.setValue('returned_at', today)
                        returnForm.setValue('damage_amount', 0)
                        returnForm.setValue('damage_notes', '')
                      }}
                    >
                      Accept & Process
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedReturnBookingId && (
          <form
            className="form-stack ops-return-form"
            onSubmit={returnForm.handleSubmit((values) => returnMutation.mutate(values))}
          >
            <h4>Return Form: Booking #{selectedReturnBookingId}</h4>
            <div className="form-inline">
              <label>
                Return Date
                <input type="date" {...returnForm.register('returned_at')} />
              </label>
              <label>
                Damage Amount
                <input type="number" step="0.01" min={0} {...returnForm.register('damage_amount', { valueAsNumber: true })} />
              </label>
            </div>
            <label>
              Damage Notes
              <input type="text" placeholder="Optional notes about scratches/breakage" {...returnForm.register('damage_notes')} />
            </label>
            <div className="btn-inline">
              <button className="btn secondary" type="submit" disabled={returnMutation.isPending}>
                {returnMutation.isPending ? 'Processing...' : 'Confirm Return'}
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => setSelectedReturnBookingId(null)}
                disabled={returnMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {returnMutation.error && <p className="error-text">{returnMutation.error.message}</p>}
      </div>

      {/* ALL BOOKINGS OVERVIEW */}
      <div className="ops-section ops-section-divider bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
        <h3>All Bookings Overview</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Category</th>
                <th>Pickup Date</th>
                <th>Due Date</th>
                <th>Deposit</th>
                <th>Rent</th>
              </tr>
            </thead>
            <tbody>
              {allBookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted">
                    No bookings found.
                  </td>
                </tr>
              )}
              {allBookings.map((booking) => (
                <tr key={booking.id} className={`status-${booking.status}`}>
                  <td>
                    <strong>#{booking.id}</strong>
                  </td>
                  <td>
                    <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
                  </td>
                  <td>{booking.rental_plan?.name ?? `Plan #${booking.rental_plan_id}`}</td>
                  <td>{booking.category_id ? categoryMap[booking.category_id] : '—'}</td>
                  <td>{new Date(booking.pickup_date).toLocaleDateString()}</td>
                  <td>{new Date(booking.due_date).toLocaleDateString()}</td>
                  <td>₹{booking.deposit_amount}</td>
                  <td>₹{booking.rent_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
