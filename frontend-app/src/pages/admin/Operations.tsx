import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package2, RotateCcw, Wrench, ClipboardList, Inbox, MapPin, Shirt, CheckCircle2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth-context'
import { Input } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { Booking, DryCleaningRequest } from '../../types'

export function AdminOperationsPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [returnBookingId, setReturnBookingId] = useState<number | null>(null)
  const [returnedAt, setReturnedAt] = useState(new Date().toISOString().split('T')[0])
  const [damageAmount, setDamageAmount] = useState('0')
  const [damageNotes, setDamageNotes] = useState('')
  const [dryCleaning, setDryCleaning] = useState(false)
  const [markReceivedDCId, setMarkReceivedDCId] = useState<number | null>(null)
  const [dcNotes, setDcNotes] = useState('')
  const [allocatingBookingId, setAllocatingBookingId] = useState<number | null>(null)
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null)

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

  const dryCleaningQuery = useQuery({
    queryKey: ['dry-cleaning-requests', token],
    queryFn: () => api.listDryCleaningRequests(token!, 'sent'),
    enabled: Boolean(token),
    refetchInterval: 30000,
  })

  const dryCleaningInProgressQuery = useQuery({
    queryKey: ['dry-cleaning-in-progress', token],
    queryFn: () => api.listDryCleaningRequests(token!, 'in_progress'),
    enabled: Boolean(token),
    refetchInterval: 30000,
  })

  const allocateMutation = useMutation({
    mutationFn: ({ bookingId, assetId }: { bookingId: number; assetId: number }) =>
      api.allocateAsset(token!, bookingId, assetId),
    onSuccess: async () => {
      setNotice('Asset allocated successfully!')
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-assets'] })
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
      await queryClient.invalidateQueries({ queryKey: ['admin-assets'] })
      setTimeout(() => setNotice(''), 3000)
    },
    onError: (err: Error) => setError(err.message),
  })

  const markDCReceivedMutation = useMutation({
    mutationFn: (requestId: number) =>
      api.markCleaningDone(token!, requestId, { cleaner_notes: dcNotes || undefined }),
    onSuccess: async () => {
      setNotice('Dry cleaning marked as received! Asset is now available.')
      setError('')
      setMarkReceivedDCId(null)
      setDcNotes('')
      await queryClient.invalidateQueries({ queryKey: ['dry-cleaning-in-progress'] })
      await queryClient.invalidateQueries({ queryKey: ['dry-cleaning-requests'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-assets'] })
      setTimeout(() => setNotice(''), 3000)
    },
    onError: (err: Error) => setError(err.message),
  })

  const markPickedUpMutation = useMutation({
    mutationFn: (bookingId: number) => api.markPickedUp(token!, bookingId),
    onSuccess: async () => {
      setNotice('Booking marked as picked up!')
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      setTimeout(() => setNotice(''), 3000)
    },
    onError: (err: Error) => setError(err.message),
  })

  const refreshStatusesMutation = useMutation({
    mutationFn: () => api.refreshBookingStatuses(token!),
    onSuccess: (data) => {
      setNotice(`Statuses refreshed — ${data.picked_up_count} picked up, ${data.overdue_count} overdue.`)
      setError('')
      void queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      setTimeout(() => setNotice(''), 4000)
    },
    onError: (err: Error) => setError(err.message),
  })

  const bookings = bookingsQuery.data ?? []
  const availableAssets = (assetsQuery.data ?? []).filter((a) => a.status === 'available' && a.is_active)

  const pending = bookings.filter((b) => b.status === 'pending')
  const toAllocate = bookings.filter((b) => b.status === 'booked')
  const returnRequests = bookings.filter((b) => b.status === 'return_requested')
  const active = bookings.filter((b) => ['allocated', 'rent_paid', 'picked_up', 'overdue'].includes(b.status))

  function EmptyState({ message }: { message: string }) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Inbox size={20} style={{ color: '#6B5548' }} />
        <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#9E8070', margin: 0 }}>{message}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ borderLeft: '4px solid var(--color-accent-gold)', paddingLeft: '16px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Operations Center</h1>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: 0 }}>Allocate assets, process returns, and manage bookings.</p>
          </div>
          <button
            onClick={() => refreshStatusesMutation.mutate()}
            disabled={refreshStatusesMutation.isPending}
            style={{
              padding: '8px 16px', fontSize: '13px', fontWeight: 600,
              borderRadius: '8px', background: 'transparent', color: 'var(--color-accent-gold)',
              border: '1.5px solid var(--color-accent-gold)', cursor: 'pointer', transition: 'all 0.15s',
              opacity: refreshStatusesMutation.isPending ? 0.6 : 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent-gold)'; e.currentTarget.style.color = 'var(--color-bg-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-accent-gold)' }}
          >
            {refreshStatusesMutation.isPending ? 'Refreshing...' : '↻ Refresh Statuses'}
          </button>
        </div>
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

        {/* ── Pending Approval ── */}
        <div style={{ background: '#2D1020', borderRadius: '16px', border: '1px solid rgba(201,169,110,0.15)', borderLeft: '4px solid #C9A96E', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'box-shadow 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-gold)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(201,169,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Wrench size={17} color="#C9A96E" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#C9A96E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pending Approval</span>
            </div>
            <span style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1, color: '#C9A96E' }}>{pending.length}</span>
          </div>
          <div style={{ height: '1px', background: 'rgba(201,169,110,0.2)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bookingsQuery.isLoading ? (
              [1,2].map(i => <div key={i} style={{ height: '56px', background: '#3A1528', borderRadius: '10px', opacity: 0.6 }} />)
            ) : pending.length === 0 ? (
              <EmptyState message="No pending bookings" />
            ) : pending.map((b: Booking) => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#3A1528', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '10px', padding: '10px 14px', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5ECD7', margin: 0 }}>Booking #{b.id}</p>
                  <p style={{ fontSize: '11px', color: '#9E8070', margin: '2px 0 0' }}>{b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}</p>
                  <p style={{ fontSize: '11px', color: '#6B5548', margin: '2px 0 0' }}>Pickup: {new Date(b.pickup_date).toLocaleDateString()} · Due: {new Date(b.due_date).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <StatusBadge status={b.status} />
                  <button
                    style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: 'rgba(224,112,112,0.1)', color: '#E07070', border: '1px solid rgba(224,112,112,0.3)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(224,112,112,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(224,112,112,0.1)')}
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

        {/* ── Allocate Assets ── */}
        <div style={{ background: '#2D1020', borderRadius: '16px', border: '1px solid rgba(201,169,110,0.15)', borderLeft: '4px solid #4A90D9', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'box-shadow 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-gold)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(74,144,217,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Package2 size={17} color="#4A90D9" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#4A90D9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Allocate Assets</span>
            </div>
            <span style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1, color: '#4A90D9' }}>{toAllocate.length}</span>
          </div>
          <div style={{ height: '1px', background: 'rgba(74,144,217,0.2)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bookingsQuery.isLoading ? (
              [1,2].map(i => <div key={i} style={{ height: '64px', background: '#3A1528', borderRadius: '10px', opacity: 0.6 }} />)
            ) : toAllocate.length === 0 ? (
              <EmptyState message="No bookings awaiting allocation" />
            ) : toAllocate.map((b: Booking) => (
              <div key={b.id} style={{ background: '#3A1528', border: '1px solid rgba(74,144,217,0.25)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5ECD7', margin: 0 }}>Booking #{b.id}</p>
                    <p style={{ fontSize: '11px', color: '#9E8070', margin: '2px 0 0' }}>{b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}</p>
                    <p style={{ fontSize: '11px', color: '#C9A96E', margin: '4px 0 0', fontWeight: 500 }}>👤 {b.user?.full_name ?? 'Unknown'}</p>
                    <p style={{ fontSize: '10px', color: '#9E8070', margin: '2px 0 0' }}>{b.user?.email}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                {b.requested_asset_id ? (
                  (() => {
                    const requestedAsset = availableAssets.find((a) => a.id === b.requested_asset_id)
                    return requestedAsset ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.25)', borderRadius: '8px', padding: '8px 12px' }}>
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: '#90B8E0', margin: 0 }}>{requestedAsset.name}</p>
                          <p style={{ fontSize: '11px', color: '#9E8070', margin: '2px 0 0' }}>{requestedAsset.asset_code} · Requested by user</p>
                        </div>
                        <button
                          style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: '#4A90D9', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: '12px' }}
                          onClick={() => allocateMutation.mutate({ bookingId: b.id, assetId: requestedAsset.id })}
                          disabled={allocateMutation.isPending}
                        >
                          Allocate
                        </button>
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#E07070', margin: 0 }}>⚠ Requested asset (#{b.requested_asset_id}) is not available</p>
                    )
                  })()
                ) : allocatingBookingId === b.id ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={selectedAssetId || ''}
                      onChange={(e) => setSelectedAssetId(e.target.value ? Number(e.target.value) : null)}
                      style={{
                        flex: 1, padding: '8px 10px', fontSize: '12px', borderRadius: '8px',
                        background: '#3A1528', border: '1px solid rgba(74,144,217,0.4)', color: '#F5ECD7',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select asset to allocate...</option>
                      {availableAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} ({asset.asset_code})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (selectedAssetId) {
                          allocateMutation.mutate({ bookingId: b.id, assetId: selectedAssetId })
                          setAllocatingBookingId(null)
                          setSelectedAssetId(null)
                        }
                      }}
                      disabled={!selectedAssetId || allocateMutation.isPending}
                      style={{
                        padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px',
                        background: selectedAssetId ? '#4A90D9' : '#555',
                        color: '#fff', border: 'none', cursor: selectedAssetId ? 'pointer' : 'not-allowed',
                        flexShrink: 0
                      }}
                    >
                      Allocate
                    </button>
                    <button
                      onClick={() => {
                        setAllocatingBookingId(null)
                        setSelectedAssetId(null)
                      }}
                      style={{
                        padding: '6px 12px', fontSize: '12px', borderRadius: '8px',
                        background: 'transparent', color: '#9E8070', border: '1px solid #555',
                        cursor: 'pointer', flexShrink: 0
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAllocatingBookingId(b.id)}
                    style={{
                      padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px',
                      background: '#4A90D9', color: '#fff', border: 'none', cursor: 'pointer'
                    }}
                  >
                    Select Asset to Allocate
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Process Returns ── */}
        <div style={{ background: '#2D1020', borderRadius: '16px', border: '1px solid rgba(201,169,110,0.15)', borderLeft: '4px solid #4CAF50', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'box-shadow 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-gold)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(76,175,80,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RotateCcw size={17} color="#4CAF50" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#7EC8A0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Process Returns</span>
            </div>
            <span style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1, color: '#7EC8A0' }}>{returnRequests.length}</span>
          </div>
          <div style={{ height: '1px', background: 'rgba(76,175,80,0.2)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bookingsQuery.isLoading ? (
              [1].map(i => <div key={i} style={{ height: '56px', background: '#3A1528', borderRadius: '10px', opacity: 0.6 }} />)
            ) : returnRequests.length === 0 ? (
              <EmptyState message="No return requests" />
            ) : returnRequests.map((b: Booking) => (
              <div key={b.id} style={{ background: '#3A1528', border: '1px solid rgba(76,175,80,0.25)', borderRadius: '10px', padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5ECD7', margin: 0 }}>Booking #{b.id}</p>
                    <p style={{ fontSize: '11px', color: '#9E8070', margin: '2px 0 0' }}>{b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}</p>
                  </div>
                  {returnBookingId !== b.id && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, marginLeft: '12px' }}>
                      <button
                        style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#43A047')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#4CAF50')}
                        onClick={() => setReturnBookingId(b.id)}
                      >
                        Process Return
                      </button>
                      <button
                        onClick={() => navigate(`/admin/tracking/${b.id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                          borderRadius: '8px', background: 'transparent', color: 'var(--color-accent-gold)',
                          border: '1px solid var(--color-border-strong)', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.1)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <MapPin size={12} />
                        Track
                      </button>
                    </div>
                  )}
                </div>
                {returnBookingId === b.id && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(76,175,80,0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#C9A96E', display: 'block', marginBottom: '4px' }}>Returned At</label>
                        <Input type="date" value={returnedAt} onChange={(e) => setReturnedAt(e.target.value)} className="h-9 text-sm" />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#C9A96E', display: 'block', marginBottom: '4px' }}>Damage (Rs.)</label>
                        <Input type="number" min="0" value={damageAmount} onChange={(e) => setDamageAmount(e.target.value)} className="h-9 text-sm" />
                      </div>
                    </div>
                    <Input placeholder="Damage notes (optional)" value={damageNotes} onChange={(e) => setDamageNotes(e.target.value)} className="h-9 text-sm" />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#F5ECD7', cursor: 'pointer', userSelect: 'none' }}>
                      <input type="checkbox" checked={dryCleaning} onChange={(e) => setDryCleaning(e.target.checked)} />
                      Send for dry cleaning
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#43A047')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#4CAF50')}
                        onClick={() => returnMutation.mutate()}
                        disabled={returnMutation.isPending}
                      >
                        {returnMutation.isPending ? 'Processing...' : 'Confirm Return'}
                      </button>
                      <button
                        style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: 'transparent', color: '#9E8070', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,169,110,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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

        {/* ── Active Bookings ── */}
        <div style={{ background: '#2D1020', borderRadius: '16px', border: '1px solid rgba(201,169,110,0.15)', borderLeft: '4px solid #9B7FD4', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'box-shadow 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-gold)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(155,127,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClipboardList size={17} color="#9B7FD4" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#C8A0D8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Bookings</span>
            </div>
            <span style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1, color: '#C8A0D8' }}>{active.length}</span>
          </div>
          <div style={{ height: '1px', background: 'rgba(155,127,212,0.2)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bookingsQuery.isLoading ? (
              [1,2,3].map(i => <div key={i} style={{ height: '56px', background: '#3A1528', borderRadius: '10px', opacity: 0.6 }} />)
            ) : active.length === 0 ? (
              <EmptyState message="No active bookings" />
            ) : active.map((b: Booking) => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#3A1528', border: '1px solid rgba(155,127,212,0.2)', borderRadius: '10px', padding: '10px 14px', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5ECD7', margin: 0 }}>Booking #{b.id}</p>
                  <p style={{ fontSize: '11px', color: '#9E8070', margin: '2px 0 0' }}>{b.rental_plan?.name ?? `Plan #${b.rental_plan_id}`}</p>
                  <p style={{ fontSize: '11px', color: '#6B5548', margin: '2px 0 0' }}>Pickup: {new Date(b.pickup_date).toLocaleDateString()} · Due: {new Date(b.due_date).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <StatusBadge status={b.status} />
                  {b.status === 'rent_paid' && (
                    <button
                      onClick={() => markPickedUpMutation.mutate(b.id)}
                      disabled={markPickedUpMutation.isPending}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', fontSize: '12px', fontWeight: 600,
                        borderRadius: '8px', background: '#4CAF50', color: '#fff',
                        border: 'none', cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!markPickedUpMutation.isPending) e.currentTarget.style.background = '#43A047' }}
                      onMouseLeave={e => { if (!markPickedUpMutation.isPending) e.currentTarget.style.background = '#4CAF50' }}
                      title="Mark this booking as picked up by user"
                    >
                      Picked Up
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/admin/tracking/${b.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '5px 12px', fontSize: '12px', fontWeight: 600,
                      borderRadius: '8px', background: 'transparent', color: 'var(--color-accent-gold)',
                      border: '1px solid var(--color-border-strong)', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <MapPin size={12} />
                    Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mark Dry Cleaning Received ── */}
        <div style={{ background: '#2D1020', borderRadius: '16px', border: '1px solid rgba(201,169,110,0.15)', borderLeft: '4px solid #FF9800', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'box-shadow 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-gold)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,152,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={17} color="#FF9800" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFB74D', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dry Cleaning Received</span>
            </div>
            <span style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1, color: '#FFB74D' }}>{(dryCleaningInProgressQuery.data ?? []).length}</span>
          </div>
          <div style={{ height: '1px', background: 'rgba(255,152,0,0.2)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dryCleaningInProgressQuery.isLoading ? (
              [1].map(i => <div key={i} style={{ height: '56px', background: '#3A1528', borderRadius: '10px', opacity: 0.6 }} />)
            ) : (dryCleaningInProgressQuery.data ?? []).length === 0 ? (
              <EmptyState message="No cleaning in progress" />
            ) : (dryCleaningInProgressQuery.data ?? []).map((dc: DryCleaningRequest) => (
              <div key={dc.id} style={{ background: '#3A1528', border: '1px solid rgba(255,152,0,0.25)', borderRadius: '10px', padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5ECD7', margin: 0 }}>{dc.asset?.name ?? 'Asset'}</p>
                    <p style={{ fontSize: '11px', color: '#9E8070', margin: '2px 0 0' }}>Booking #{dc.booking_id}</p>
                  </div>
                  {markReceivedDCId !== dc.id && (
                    <button
                      style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: '#FF9800', color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F57C00')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#FF9800')}
                      onClick={() => setMarkReceivedDCId(dc.id)}
                    >
                      Mark Received
                    </button>
                  )}
                </div>
                {markReceivedDCId === dc.id && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,152,0,0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Input placeholder="Cleaner notes (optional)" value={dcNotes} onChange={(e) => setDcNotes(e.target.value)} className="h-9 text-sm" />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: '#FF9800', color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F57C00')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#FF9800')}
                        onClick={() => markDCReceivedMutation.mutate(dc.id)}
                        disabled={markDCReceivedMutation.isPending}
                      >
                        {markDCReceivedMutation.isPending ? 'Marking...' : 'Confirm Received'}
                      </button>
                      <button
                        style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', background: 'transparent', color: '#9E8070', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,169,110,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => setMarkReceivedDCId(null)}
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

      </div>
    </div>
  )
}