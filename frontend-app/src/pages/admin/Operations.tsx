import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, RotateCcw, LayoutList, CheckCircle2, AlertCircle,
  ArrowRight, Package2, User, Calendar, IndianRupee, RefreshCw,
  ChevronRight, Clock, PackageCheck, Link2, UserCheck, Tag,
} from 'lucide-react'
import { api } from '../../api'
import { useAuth } from '../../auth-context'
import type { Asset, Booking, Category, User as UserType } from '../../types'

const returnSchema = z.object({
  booking_id: z.number().int().positive(),
  returned_at: z.string().min(1),
  damage_amount: z.number().min(0),
  damage_notes: z.string().optional(),
})

type ReturnForm = z.infer<typeof returnSchema>

// ── Status-to-style map ──────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  booked: 'badge-blue',
  allocated: 'badge-purple',
  ready_for_pickup: 'badge-amber',
  returned: 'badge-green',
  cancelled: 'badge-red',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] ?? 'badge-blue'}`} style={{ display: 'inline-flex', fontSize: '0.75rem', textTransform: 'capitalize' }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export function AdminOperationsPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  // Allocation state
  const [selectedBookingForAlloc, setSelectedBookingForAlloc] = useState<Booking | null>(null)
  const [selectedAssetForAlloc, setSelectedAssetForAlloc] = useState<Asset | null>(null)
  const [allocationNotice, setAllocationNotice] = useState('')

  // Return state
  const [selectedReturnBookingId, setSelectedReturnBookingId] = useState<number | null>(null)
  const [returnNotice, setReturnNotice] = useState('')

  const returnForm = useForm<ReturnForm>({
    resolver: zodResolver(returnSchema),
    defaultValues: { damage_amount: 0, damage_notes: '' },
  })

  // ── Queries ────────────────────────────────────────────────────────────────
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

  const usersQuery = useQuery({
    queryKey: ['users', token],
    queryFn: async () => {
      if (!token) return [] as UserType[]
      return api.listUsers(token)
    },
    enabled: Boolean(token),
  })

  const allocationsQuery = useQuery({
    queryKey: ['allocations', token],
    queryFn: async () => {
      if (!token) return []
      return api.listAllocations(token)
    },
    enabled: Boolean(token),
  })

  // ── Derived data ───────────────────────────────────────────────────────────
  const categoryMap = useMemo(() => {
    const map: Record<number, string> = {}
    categoriesQuery.data?.forEach((cat: Category) => { map[cat.id] = cat.name })
    return map
  }, [categoriesQuery.data])

  const assetById = useMemo(() => {
    const map = new Map<number, Asset>()
    ;(assetsQuery.data ?? []).forEach((asset) => map.set(asset.id, asset))
    return map
  }, [assetsQuery.data])

  const bookedBookings = useMemo(() =>
    bookingsQuery.data?.filter((b) => b.status === 'booked') ?? [], [bookingsQuery.data])

  const returnableBookings = useMemo(() =>
    bookingsQuery.data?.filter((b) => b.status === 'ready_for_pickup') ?? [], [bookingsQuery.data])

  const allBookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data])

  // Build user map for display
  const userById = useMemo(() => {
    const map = new Map<number, UserType>()
    ;(usersQuery.data ?? []).forEach((u) => map.set(u.id, u))
    return map
  }, [usersQuery.data])

  // Derive active allocations: bookings in allocated/ready_for_pickup/picked_up state with an allocated_asset_id
  const activeAllocations = useMemo(() => {
    const activeStatuses = new Set(['allocated', 'ready_for_pickup', 'picked_up'])
    return allBookings
      .filter((b) => activeStatuses.has(b.status) && b.allocated_asset_id != null)
      .map((b) => ({
        booking: b,
        asset: b.allocated_asset_id != null ? assetById.get(b.allocated_asset_id) : undefined,
        user: userById.get(b.user_id),
      }))
  }, [allBookings, assetById, userById])

  const availableAssetsForSelectedBooking = useMemo(() => {
    if (!selectedBookingForAlloc?.category_id) {
      return assetsQuery.data?.filter((a) => a.status === 'available') ?? []
    }
    return assetsQuery.data?.filter(
      (a) => a.status === 'available' && a.category_id === selectedBookingForAlloc.category_id
    ) ?? []
  }, [selectedBookingForAlloc, assetsQuery.data])

  const requestedAsset = selectedBookingForAlloc?.requested_asset_id
    ? assetById.get(selectedBookingForAlloc.requested_asset_id)
    : null
  const isRequestedAssetAvailable = Boolean(requestedAsset && requestedAsset.status === 'available')

  // ── Mutations ──────────────────────────────────────────────────────────────
  const allocateMutation = useMutation({
    mutationFn: async ({ booking_id, asset_id }: { booking_id: number; asset_id: number }) => {
      if (!token) throw new Error('Missing token')
      return api.allocateAsset(token, booking_id, asset_id)
    },
    onSuccess: async () => {
      setAllocationNotice('Asset allocated successfully!')
      setSelectedBookingForAlloc(null)
      setSelectedAssetForAlloc(null)
      await queryClient.invalidateQueries({ queryKey: ['adminBookings', token] })
      await queryClient.invalidateQueries({ queryKey: ['assets', token] })
      await queryClient.invalidateQueries({ queryKey: ['allocations', token] })
      setTimeout(() => setAllocationNotice(''), 4000)
    },
  })

  const returnMutation = useMutation({
    mutationFn: async (values: ReturnForm) => {
      if (!token) throw new Error('Missing token')
      return api.processReturn(token, values.booking_id, values.returned_at, values.damage_amount, values.damage_notes ?? null)
    },
    onSuccess: async () => {
      setReturnNotice('Return processed — asset moved back to available inventory.')
      returnForm.reset()
      setSelectedReturnBookingId(null)
      await queryClient.invalidateQueries({ queryKey: ['adminBookings', token] })
      await queryClient.invalidateQueries({ queryKey: ['assets', token] })
      await queryClient.invalidateQueries({ queryKey: ['allocations', token] })
      setTimeout(() => setReturnNotice(''), 4000)
    },
  })

  const isLoading = bookingsQuery.isLoading || assetsQuery.isLoading
  const isError = bookingsQuery.isError || assetsQuery.isError

  // ── Summary stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    booked: allBookings.filter((b) => b.status === 'booked').length,
    allocated: allBookings.filter((b) => b.status === 'allocated').length,
    readyForPickup: allBookings.filter((b) => b.status === 'ready_for_pickup').length,
    returned: allBookings.filter((b) => b.status === 'returned').length,
  }), [allBookings])

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="page-header">
          <div>
            <h1 className="page-title">Operations</h1>
            <p className="page-subtitle">Loading booking and asset data...</p>
          </div>
        </div>
        <div className="card">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-10 rounded-lg mb-3" />)}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <div className="page-header">
          <div><h1 className="page-title">Operations</h1></div>
        </div>
        <div className="card">
          <p className="error-text text-sm">Failed to load data. Please refresh.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations</h1>
          <p className="page-subtitle">Smart allocation, return processing, and booking oversight.</p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={async () => {
            await queryClient.invalidateQueries({ queryKey: ['adminBookings', token] })
            await queryClient.invalidateQueries({ queryKey: ['assets', token] })
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Awaiting Allocation', value: stats.booked, icon: Package2, color: '#818cf8' },
          { label: 'Allocated', value: stats.allocated, icon: PackageCheck, color: '#34d399' },
          { label: 'Ready for Return', value: stats.readyForPickup, icon: RotateCcw, color: '#fb923c' },
          { label: 'Returned', value: stats.returned, icon: CheckCircle2, color: '#6ee7b7' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="card"
            style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ffffff', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.25rem' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Active Allocations ─────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #27272a' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgb(16 185 129 / 0.1)', border: '1px solid rgb(16 185 129 / 0.2)' }}
            >
              <UserCheck className="w-4 h-4" style={{ color: '#34d399' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#e4e4e7' }}>Active Allocations</h2>
              <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>
                Assets currently allocated to users — who has what
              </p>
            </div>
          </div>
          <div className="badge badge-green" style={{ display: 'inline-flex' }}>
            <CheckCircle2 className="w-3 h-3" /> {activeAllocations.length} active
          </div>
        </div>

        {allocationsQuery.isLoading || usersQuery.isLoading ? (
          <div className="p-5 flex flex-col gap-3">
            {[1, 2].map((i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
          </div>
        ) : activeAllocations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgb(16 185 129 / 0.06)', border: '1px solid rgb(16 185 129 / 0.15)' }}
            >
              <PackageCheck className="w-5 h-5" style={{ color: '#34d399' }} />
            </div>
            <p style={{ color: '#71717a', fontSize: '0.875rem' }}>No assets are currently allocated.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full" style={{ minWidth: '700px' }}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Asset Code</th>
                  <th>Allocated To</th>
                  <th>Booking</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {activeAllocations.map(({ booking, asset, user }) => (
                  <tr key={booking.id}>
                    {/* Asset name */}
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgb(99 102 241 / 0.1)', border: '1px solid rgb(99 102 241 / 0.2)' }}
                        >
                          <Package2 className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
                        </div>
                        <span style={{ fontWeight: '600', color: '#e4e4e7', fontSize: '0.875rem' }}>
                          {asset?.name ?? `Asset #${booking.allocated_asset_id}`}
                        </span>
                      </div>
                    </td>

                    {/* Asset code — prominent */}
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 flex-shrink-0" style={{ color: '#818cf8' }} />
                        <code
                          style={{
                            fontSize: '0.8125rem',
                            fontFamily: 'monospace',
                            fontWeight: '700',
                            color: '#a5b4fc',
                            background: 'rgb(99 102 241 / 0.1)',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid rgb(99 102 241 / 0.2)',
                          }}
                        >
                          {asset?.asset_code ?? '—'}
                        </code>
                      </div>
                    </td>

                    {/* User */}
                    <td>
                      {user ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', fontSize: '0.7rem' }}
                          >
                            {user.full_name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#e4e4e7', fontSize: '0.8125rem' }}>{user.full_name}</div>
                            <div style={{ fontSize: '0.725rem', color: '#71717a' }}>{user.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#71717a', fontSize: '0.875rem' }}>User #{booking.user_id}</span>
                      )}
                    </td>

                    {/* Booking ID */}
                    <td>
                      <div className="flex items-center gap-1.5" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
                        <Link2 className="w-3 h-3 flex-shrink-0" style={{ color: '#818cf8' }} />
                        <strong style={{ color: '#e4e4e7' }}>#{booking.id}</strong>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
                      {booking.category_id ? categoryMap[booking.category_id] || `#${booking.category_id}` : '—'}
                    </td>

                    {/* Status */}
                    <td><StatusBadge status={booking.status} /></td>

                    {/* Due date */}
                    <td>
                      <div className="flex items-center gap-1.5" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        {new Date(booking.due_date).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECTION 1: Smart Asset Allocation ─────────────────────────────── */}

      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' }}
          >
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#e4e4e7' }}>Smart Asset Allocation</h2>
            <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>
              Step 1: Select a booking → Step 2: Pick an asset → Step 3: Confirm
            </p>
          </div>
        </div>

        {/* Success notice */}
        <AnimatePresence>
          {allocationNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-4"
              style={{ background: 'rgb(16 185 129 / 0.08)', border: '1px solid rgb(16 185 129 / 0.2)' }}
            >
              <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#34d399', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', color: '#6ee7b7' }}>{allocationNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step progress indicators */}
        <div className="flex items-center gap-2 mb-5">
          {['Select Booking', 'Select Asset', 'Confirm'].map((step, i) => {
            const isActive =
              (i === 0) ||
              (i === 1 && selectedBookingForAlloc !== null) ||
              (i === 2 && selectedBookingForAlloc !== null && selectedAssetForAlloc !== null)
            const isDone =
              (i === 0 && selectedBookingForAlloc !== null) ||
              (i === 1 && selectedAssetForAlloc !== null)

            return (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: isDone ? '#34d399' : isActive ? '#6366f1' : '#27272a',
                      color: isDone || isActive ? '#ffffff' : '#52525b',
                    }}
                  >
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: isActive ? '#e4e4e7' : '#52525b', fontWeight: isActive ? '500' : '400' }}>
                    {step}
                  </span>
                </div>
                {i < 2 && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#3f3f46' }} />}
              </div>
            )
          })}
        </div>

        {/* STEP 1: Booking cards */}
        <div className="mb-4">
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#a1a1aa', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Step 1 — Bookings Awaiting Allocation
          </h3>
          {bookedBookings.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#1c1c1f', border: '1px solid #27272a' }}>
              <Package2 className="w-4 h-4 flex-shrink-0" style={{ color: '#52525b' }} />
              <span style={{ fontSize: '0.875rem', color: '#71717a' }}>No bookings awaiting allocation right now.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bookedBookings.map((booking) => {
                const isSelected = selectedBookingForAlloc?.id === booking.id
                return (
                  <motion.div
                    key={booking.id}
                    whileHover={{ y: -1 }}
                    onClick={() => {
                      setSelectedBookingForAlloc(isSelected ? null : booking)
                      setSelectedAssetForAlloc(null)
                    }}
                    className="rounded-xl p-4 cursor-pointer transition-all"
                    style={{
                      background: isSelected ? 'rgb(99 102 241 / 0.1)' : '#1c1c1f',
                      border: `1px solid ${isSelected ? '#6366f1' : '#27272a'}`,
                      outline: isSelected ? '1px solid rgb(99 102 241 / 0.3)' : 'none',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: isSelected ? 'rgb(99 102 241 / 0.2)' : '#27272a' }}
                        >
                          <Package2 className="w-3.5 h-3.5" style={{ color: isSelected ? '#818cf8' : '#71717a' }} />
                        </div>
                        <span style={{ fontWeight: '700', color: '#e4e4e7', fontSize: '0.9375rem' }}>#{booking.id}</span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#6366f1' }}>
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5" style={{ fontSize: '0.8125rem', color: '#a1a1aa' }}>
                        <User className="w-3 h-3 flex-shrink-0" />
                        User #{booking.user_id}
                      </div>
                      <div className="flex items-center gap-1.5" style={{ fontSize: '0.8125rem', color: '#a1a1aa' }}>
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        Pickup: {new Date(booking.pickup_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5" style={{ fontSize: '0.8125rem', color: '#a1a1aa' }}>
                        <IndianRupee className="w-3 h-3 flex-shrink-0" />
                        Deposit: ₹{booking.deposit_amount}
                      </div>
                      {booking.category_id && (
                        <div className="mt-1">
                          <span className="badge badge-blue" style={{ display: 'inline-flex', fontSize: '0.7rem' }}>
                            {categoryMap[booking.category_id] || `Category #${booking.category_id}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* STEP 2: Asset Selection */}
        <AnimatePresence>
          {selectedBookingForAlloc && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: '0.5rem' }}>
                {/* Requested Asset Alert */}
                {requestedAsset && (
                  <div
                    className="flex items-start gap-3 rounded-xl px-4 py-3 mb-4"
                    style={{ background: 'rgb(251 146 60 / 0.06)', border: '1px solid rgb(251 146 60 / 0.2)' }}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#fb923c' }} />
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#fdba74' }}>User Requested: {requestedAsset.name}</p>
                      <p style={{ fontSize: '0.8125rem', color: '#a1a1aa', marginTop: '0.125rem' }}>
                        Code: {requestedAsset.asset_code} · Status: <strong style={{ color: isRequestedAssetAvailable ? '#34d399' : '#f87171' }}>{requestedAsset.status}</strong>
                      </p>
                      {isRequestedAssetAvailable && (
                        <button
                          className="btn btn-primary mt-2"
                          style={{ height: '2rem', padding: '0 0.75rem', fontSize: '0.8125rem' }}
                          type="button"
                          disabled={allocateMutation.isPending}
                          onClick={() => {
                            setSelectedAssetForAlloc(requestedAsset)
                            allocateMutation.mutate({ booking_id: selectedBookingForAlloc.id, asset_id: requestedAsset.id })
                          }}
                        >
                          {allocateMutation.isPending ? 'Allocating...' : 'Allocate Requested Asset'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#a1a1aa', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Step 2 — Available Assets {selectedBookingForAlloc.category_id ? `in "${categoryMap[selectedBookingForAlloc.category_id] || 'category'}"` : ''}
                </h3>

                {availableAssetsForSelectedBooking.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgb(239 68 68 / 0.06)', border: '1px solid rgb(239 68 68 / 0.2)' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#f87171' }} />
                    <span style={{ fontSize: '0.875rem', color: '#fca5a5' }}>No available assets in this category.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableAssetsForSelectedBooking.map((asset) => {
                      const isSelected = selectedAssetForAlloc?.id === asset.id
                      return (
                        <motion.div
                          key={asset.id}
                          whileHover={{ y: -1 }}
                          onClick={() => setSelectedAssetForAlloc(isSelected ? null : asset)}
                          className="rounded-xl p-4 cursor-pointer transition-all"
                          style={{
                            background: isSelected ? 'rgb(16 185 129 / 0.08)' : '#1c1c1f',
                            border: `1px solid ${isSelected ? '#10b981' : '#27272a'}`,
                            outline: isSelected ? '1px solid rgb(16 185 129 / 0.25)' : 'none',
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span style={{ fontWeight: '700', color: '#e4e4e7', fontSize: '0.9375rem' }}>{asset.name}</span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#10b981' }}>
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <code style={{ fontSize: '0.75rem', color: '#71717a', background: '#27272a', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', display: 'inline-block' }}>
                              {asset.asset_code}
                            </code>
                            <span style={{ fontSize: '0.8125rem', color: '#a1a1aa' }}>
                              {categoryMap[asset.category_id] || `Category #${asset.category_id}`}
                            </span>
                            <span className="badge badge-green" style={{ display: 'inline-flex', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                              <CheckCircle2 className="w-2.5 h-2.5" /> available
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 3: Confirm panel */}
        <AnimatePresence>
          {selectedBookingForAlloc && selectedAssetForAlloc && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-5 mt-4"
              style={{ background: 'linear-gradient(135deg, rgb(99 102 241 / 0.08) 0%, rgb(67 56 202 / 0.05) 100%)', border: '1px solid rgb(99 102 241 / 0.25)' }}
            >
              <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#c7d2fe', marginBottom: '0.75rem' }}>
                Step 3 — Confirm Allocation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl p-3" style={{ background: 'rgb(0 0 0 / 0.2)', border: '1px solid #3f3f46' }}>
                  <p style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '0.25rem' }}>Booking</p>
                  <p style={{ fontWeight: '700', color: '#e4e4e7' }}>#{selectedBookingForAlloc.id}</p>
                  <p style={{ fontSize: '0.8125rem', color: '#a1a1aa' }}>User #{selectedBookingForAlloc.user_id}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgb(0 0 0 / 0.2)', border: '1px solid #3f3f46' }}>
                  <p style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '0.25rem' }}>Assigning Asset</p>
                  <p style={{ fontWeight: '700', color: '#e4e4e7' }}>{selectedAssetForAlloc.name}</p>
                  <p style={{ fontSize: '0.8125rem', color: '#a1a1aa' }}>{selectedAssetForAlloc.asset_code}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={allocateMutation.isPending}
                  onClick={() => allocateMutation.mutate({
                    booking_id: selectedBookingForAlloc.id,
                    asset_id: selectedAssetForAlloc.id,
                  })}
                >
                  {allocateMutation.isPending ? 'Allocating...' : 'Confirm Allocation'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => { setSelectedBookingForAlloc(null); setSelectedAssetForAlloc(null) }}
                >
                  Cancel
                </button>
                {allocateMutation.error && (
                  <p className="error-text text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {allocateMutation.error.message}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── SECTION 2: Accept & Process Returns ──────────────────────────── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#e4e4e7' }}>Accept & Process Returns</h2>
            <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>
              Accept user return requests, record damage, and refund deposits.
            </p>
          </div>
        </div>

        {/* Success */}
        <AnimatePresence>
          {returnNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-4"
              style={{ background: 'rgb(16 185 129 / 0.08)', border: '1px solid rgb(16 185 129 / 0.2)' }}
            >
              <CheckCircle2 className="w-4 h-4" style={{ color: '#34d399', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', color: '#6ee7b7' }}>{returnNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {returnableBookings.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#1c1c1f', border: '1px solid #27272a' }}>
            <RotateCcw className="w-4 h-4 flex-shrink-0" style={{ color: '#52525b' }} />
            <span style={{ fontSize: '0.875rem', color: '#71717a' }}>No return requests pending acceptance.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {returnableBookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid #27272a' }}
              >
                {/* Booking row */}
                <div className="flex items-center justify-between gap-4 px-4 py-3.5" style={{ background: '#1c1c1f' }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgb(251 146 60 / 0.1)', border: '1px solid rgb(251 146 60 / 0.2)' }}
                    >
                      <RotateCcw className="w-4 h-4" style={{ color: '#fb923c' }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: '700', color: '#e4e4e7', fontSize: '0.9375rem' }}>Booking #{booking.id}</p>
                      <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>
                        User #{booking.user_id} · Due: {new Date(booking.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={booking.status} />
                    {selectedReturnBookingId !== booking.id ? (
                      <button
                        className="btn btn-primary"
                        style={{ height: '2rem', padding: '0 0.75rem', fontSize: '0.8125rem' }}
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
                        Process Return
                      </button>
                    ) : (
                      <button
                        className="btn btn-ghost"
                        style={{ height: '2rem', padding: '0 0.75rem', fontSize: '0.8125rem' }}
                        type="button"
                        onClick={() => setSelectedReturnBookingId(null)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline return form */}
                <AnimatePresence>
                  {selectedReturnBookingId === booking.id && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden', borderTop: '1px solid #27272a', background: '#18181b' }}
                      onSubmit={returnForm.handleSubmit((values) => returnMutation.mutate(values))}
                    >
                      <div className="p-4 flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="form-group">
                            <label className="form-label">
                              <Calendar className="w-3 h-3" style={{ color: '#818cf8' }} />
                              Return Date
                            </label>
                            <input
                              className="form-input"
                              type="date"
                              {...returnForm.register('returned_at')}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">
                              <IndianRupee className="w-3 h-3" style={{ color: '#818cf8' }} />
                              Damage Deduction (₹)
                            </label>
                            <input
                              className="form-input"
                              type="number"
                              step="0.01"
                              min={0}
                              {...returnForm.register('damage_amount', { valueAsNumber: true })}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Damage Notes (optional)</label>
                          <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. Minor scratch on lid"
                            {...returnForm.register('damage_notes')}
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={returnMutation.isPending}
                          >
                            {returnMutation.isPending ? 'Processing...' : 'Confirm Return & Refund'}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          {returnMutation.error && (
                            <p className="error-text text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {returnMutation.error.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 3: All Bookings Overview ─────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #27272a' }}>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgb(99 102 241 / 0.1)', border: '1px solid rgb(99 102 241 / 0.2)' }}
          >
            <LayoutList className="w-4 h-4" style={{ color: '#818cf8' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#e4e4e7' }}>All Bookings</h2>
            <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>{allBookings.length} total bookings across all statuses</p>
          </div>
        </div>

        {allBookings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <LayoutList className="w-10 h-10" style={{ color: '#3f3f46' }} />
            <p style={{ color: '#71717a', fontSize: '0.875rem' }}>No bookings found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full" style={{ minWidth: '750px' }}>
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Category</th>
                  <th>Pickup</th>
                  <th>Due</th>
                  <th>Deposit</th>
                  <th>Rent</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td><strong>#{booking.id}</strong></td>
                    <td><StatusBadge status={booking.status} /></td>
                    <td style={{ color: '#d4d4d8' }}>{booking.rental_plan?.name ?? `Plan #${booking.rental_plan_id}`}</td>
                    <td style={{ color: '#d4d4d8' }}>{booking.category_id ? categoryMap[booking.category_id] : '—'}</td>
                    <td>
                      <div className="flex items-center gap-1.5" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {new Date(booking.pickup_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        {new Date(booking.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ fontWeight: '600', color: '#e4e4e7' }}>₹{booking.deposit_amount}</td>
                    <td style={{ fontWeight: '600', color: '#e4e4e7' }}>₹{booking.rent_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
