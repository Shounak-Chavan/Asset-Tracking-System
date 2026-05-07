import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package2, RotateCcw, Wrench, ClipboardList, Inbox } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../../api'
import { useAuth } from '../../auth-context'
import { Input } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { Booking } from '../../types'

export function AdminOperationsPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [returnBookingId, setReturnBookingId] = useState<number | null>(null)
  const [returnedAt, setReturnedAt] = useState(new Date().toISOString().split('T')[0])
  const [damageAmount, setDamageAmount] = useState('0')
  const [damageNotes, setDamageNotes] = useState('')
  const [dryCleaning, setDryCleaning] = useState(false)

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

  const allocateMutation = useMutation({
    mutationFn: ({ bookingId, assetId }: { bookingId: number; assetId: number }) =>
      api.allocateAsset(token!, bookingId, assetId),
    onSuccess: async () => {
      setNotice('Asset allocated successfully!')
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      setTimeout(() => setNotice(''), 3000)
    },
    onError: (err: Error) => setError(err.message),
  })

  const rejectMutation = useMutation({
    mutationFn: (bookingId: number) => api.rejectBookingByAdmin(token!, bookingId),
    onSuccess: async () => {
      setNotice('Booking rejected.')
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      setTimeout(() => setNotice(''), 3000)
    },
    onError: (err: Error) => setError(err.message),
  })

  const returnMutation = useMutation({
    mutationFn: () =>
      api.processReturn(
        token!,
        returnBookingId!,
        returnedAt,
        Number(damageAmount),
        damageNotes || null,
        dryCleaning
      ),
    onSuccess: async () => {
      setNotice('Return processed!')
      setError('')
      setReturnBookingId(null)
      setDamageAmount('0')
      setDamageNotes('')
      setDryCleaning(false)
      await queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      setTimeout(() => setNotice(''), 3000)
    },
    onError: (err: Error) => setError(err.message),
  })

  const bookings = bookingsQuery.data ?? []
  const availableAssets = (assetsQuery.data ?? []).filter((a) => a.status === 'available' && a.is_active)

  const pending = bookings.filter((b) => b.status === 'pending')
  const toAllocate = bookings.filter((b) => b.status === 'booked')
  const returnRequests = bookings.filter((b) => b.status === 'ready_for_pickup')
  const active = bookings.filter((b) => ['allocated', 'picked_up', 'overdue'].includes(b.status))

  function EmptyState({ message }: { message: string }) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Inbox size={20} className="text-gray-300" />
        <p className="text-sm italic text-gray-400">{message}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Operations Center</h1>
        <p className="text-sm text-gray-500 mt-1">Allocate assets, process returns, and manage bookings.</p>
      </div>

      <AnimatePresence>
        {notice && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
            <Alert variant="success" message={notice} onDismiss={() => setNotice('')} />
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
            <Alert variant="error" message={error} onDismiss={() => setError('')} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Pending Approval — amber ── */}
        <div style={{ background: '#fffbf5', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #fde68a', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'box-shadow 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)')}
        >
          {/* Card header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Wrench size={17} color="#d97706" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pending Approval</span>
            </div>
            <span style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1, color: '#d97706' }}>{pending.length}</span>
          </div>
          {/* Divider */}
          <div style={{ height: '1px', background: '#fde68a' }} />
          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bookingsQuery.isLoading ? (
              [1,2].map(i => <div key={i} style={{ height: '56px', background: '#fef3c7', borderRadius: '10px', opacity: 0.6 }} />)
            ) : pending.length === 0 ? (
              <EmptyState message="No pending bookings" />
            ) : pending.map((b: Booking) => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 14px', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937', margin: 0 }}>Booking #{b.id}</p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>{b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>Pickup: {new Date(b.pickup_date).toLocaleDateString()} · Due: {new Date(b.due_date).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <StatusBadge status={b.status} />
                  <button
                    style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fef2f2')}
                    onClick={() => rejectMutation.mutate(b.id)}
                    disabled={rejectMutation.isPending}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Allocate Assets — blue ── */}
        <div style={{ background: '#f5f9ff', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #bfdbfe', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'box-shadow 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Package2 size={17} color="#2563eb" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Allocate Assets</span>
            </div>
            <span style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1, color: '#2563eb' }}>{toAllocate.length}</span>
          </div>
          <div style={{ height: '1px', background: '#bfdbfe' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bookingsQuery.isLoading ? (
              [1,2].map(i => <div key={i} style={{ height: '64px', background: '#dbeafe', borderRadius: '10px', opacity: 0.6 }} />)
            ) : toAllocate.length === 0 ? (
              <EmptyState message="No bookings awaiting allocation" />
            ) : toAllocate.map((b: Booking) => (
              <div key={b.id} style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937', margin: 0 }}>Booking #{b.id}</p>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>{b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                {b.requested_asset_id ? (
                  (() => {
                    const requestedAsset = availableAssets.find((a) => a.id === b.requested_asset_id)
                    return requestedAsset ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 12px' }}>
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af', margin: 0 }}>{requestedAsset.name}</p>
                          <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>{requestedAsset.asset_code} · Requested by user</p>
                        </div>
                        <button
                          style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: '12px' }}
                          onClick={() => allocateMutation.mutate({ bookingId: b.id, assetId: requestedAsset.id })}
                          disabled={allocateMutation.isPending}
                        >
                          Allocate
                        </button>
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#dc2626', margin: 0 }}>Requested asset (#{b.requested_asset_id}) is not available</p>
                    )
                  })()
                ) : (
                  <select
                    style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #bfdbfe', background: '#fff', padding: '0 8px', fontSize: '13px', color: '#1f2937', outline: 'none' }}
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) allocateMutation.mutate({ bookingId: b.id, assetId: Number(e.target.value) }) }}
                    disabled={allocateMutation.isPending}
                    aria-label="Select asset to allocate"
                  >
                    <option value="">Select asset to allocate</option>
                    {availableAssets.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.asset_code})</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Process Returns — emerald ── */}
        <div style={{ background: '#f4fdf8', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #a7f3d0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'box-shadow 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RotateCcw size={17} color="#059669" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Process Returns</span>
            </div>
            <span style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1, color: '#059669' }}>{returnRequests.length}</span>
          </div>
          <div style={{ height: '1px', background: '#a7f3d0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bookingsQuery.isLoading ? (
              [1].map(i => <div key={i} style={{ height: '56px', background: '#d1fae5', borderRadius: '10px', opacity: 0.6 }} />)
            ) : returnRequests.length === 0 ? (
              <EmptyState message="No return requests" />
            ) : returnRequests.map((b: Booking) => (
              <div key={b.id} style={{ background: '#fff', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937', margin: 0 }}>Booking #{b.id}</p>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>{b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}</p>
                  </div>
                  {returnBookingId !== b.id && (
                    <button
                      style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: '12px', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#047857')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#059669')}
                      onClick={() => setReturnBookingId(b.id)}
                    >
                      Process Return
                    </button>
                  )}
                </div>
                {returnBookingId === b.id && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #a7f3d0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Returned At</label>
                        <Input type="date" value={returnedAt} onChange={(e) => setReturnedAt(e.target.value)} className="h-9 text-sm" />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Damage (Rs.)</label>
                        <Input type="number" min="0" value={damageAmount} onChange={(e) => setDamageAmount(e.target.value)} className="h-9 text-sm" />
                      </div>
                    </div>
                    <Input placeholder="Damage notes (optional)" value={damageNotes} onChange={(e) => setDamageNotes(e.target.value)} className="h-9 text-sm" />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer', userSelect: 'none' }}>
                      <input type="checkbox" checked={dryCleaning} onChange={(e) => setDryCleaning(e.target.checked)} />
                      Send for dry cleaning
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#047857')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#059669')}
                        onClick={() => returnMutation.mutate()}
                        disabled={returnMutation.isPending}
                      >
                        {returnMutation.isPending ? 'Processing...' : 'Confirm Return'}
                      </button>
                      <button
                        style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        onClick={() => setReturnBookingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Active Bookings — indigo ── */}
        <div style={{ background: '#f7f5ff', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #c7d2fe', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'box-shadow 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClipboardList size={17} color="#4f46e5" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#312e81', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Bookings</span>
            </div>
            <span style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1, color: '#4f46e5' }}>{active.length}</span>
          </div>
          <div style={{ height: '1px', background: '#c7d2fe' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bookingsQuery.isLoading ? (
              [1,2,3].map(i => <div key={i} style={{ height: '56px', background: '#e0e7ff', borderRadius: '10px', opacity: 0.6 }} />)
            ) : active.length === 0 ? (
              <EmptyState message="No active bookings" />
            ) : active.map((b: Booking) => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #c7d2fe', borderRadius: '10px', padding: '10px 14px', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937', margin: 0 }}>Booking #{b.id}</p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>{b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>Pickup: {new Date(b.pickup_date).toLocaleDateString()} · Due: {new Date(b.due_date).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}