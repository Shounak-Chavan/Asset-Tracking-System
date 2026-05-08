import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Tag, AlertCircle, Check, ShieldCheck,
  Clock, IndianRupee, CalendarDays,
} from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth-context'
import { AssetBookingModal } from '../components/AssetBookingModal'
import type { RentalPlan, BlockedDateRange } from '../types'
import { getUserFacingStatus } from '../lib/assetStatus'

// ── Date helpers (used for next-available display only) ──────────────────────
function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function fromISODate(value: string): Date {
  const [y, m, day] = value.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, day ?? 1)
}

/** Returns a formatted string for the first free day after all active bookings */
function getNextAvailableDate(blocked: BlockedDateRange[]): string | null {
  if (!blocked.length) return null
  const today = toDateOnly(new Date())
  const sorted = [...blocked].sort(
    (a, b) => new Date(String(a.to_date)).getTime() - new Date(String(b.to_date)).getTime()
  )
  const latest = sorted[sorted.length - 1]
  const end = toDateOnly(fromISODate(String(latest.to_date)))
  if (end < today) return null
  const next = new Date(end)
  next.setDate(next.getDate() + 1)
  return next.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Category badge colors ─────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Electronics: { bg: '#eff6ff', color: '#2563eb' },
  Cloth:       { bg: '#fdf4ff', color: '#9333ea' },
  Jwellary:    { bg: '#fefce8', color: '#ca8a04' },
  Jewellery:   { bg: '#fefce8', color: '#ca8a04' },
  Furniture:   { bg: '#f0fdf4', color: '#16a34a' },
}
function getCategoryStyle(name: string) {
  return CATEGORY_COLORS[name] ?? { bg: '#f1f5f9', color: '#475569' }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = '16px', radius = '6px' }: { w?: string; h?: string; radius?: string }) {
  return <div style={{ width: w, height: h, borderRadius: radius, background: '#f1f5f9', flexShrink: 0 }} />
}

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, selected, onSelect }: { plan: RentalPlan; selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      style={{
        border: `2px solid ${selected ? '#00c9a7' : '#e5e7eb'}`,
        borderRadius: '10px', padding: '14px 16px', cursor: 'pointer',
        background: selected ? 'rgba(0,201,167,0.04)' : '#fff',
        transition: 'border-color 0.15s, background 0.15s', position: 'relative',
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          width: 20, height: 20, borderRadius: '50%',
          background: '#00c9a7', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={12} color="#fff" strokeWidth={3} />
        </div>
      )}
      <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{plan.name}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {[
          { icon: Clock,       label: `${plan.duration_days} days` },
          { icon: IndianRupee, label: `₹${plan.daily_rate}/day` },
          { icon: ShieldCheck, label: `₹${plan.deposit_amount} deposit` },
        ].map(({ icon: Icon, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
            <Icon size={12} color="#94a3b8" />{label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [mainImage, setMainImage] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<RentalPlan | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const assetQuery = useQuery({
    queryKey: ['asset-detail', id],
    queryFn: () => api.getAsset(token, Number(id)),
    enabled: Boolean(id),
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories-public'],
    queryFn: () => api.listCategories(null),
  })

  const plansQuery = useQuery({
    queryKey: ['rental-plans-public'],
    queryFn: () => api.listRentalPlans(''),
  })

  const blockedDatesQuery = useQuery({
    queryKey: ['blockedDates', id],
    queryFn: async () => {
      const res = await api.getBlockedDatesForAsset(token, Number(id))
      return res.blocked_ranges
    },
    enabled: Boolean(id),
  })

  const asset = assetQuery.data
  const categories = categoriesQuery.data ?? []
  const plans = (plansQuery.data ?? []).filter(p => p.is_active)
  const blocked = blockedDatesQuery.data ?? []

  const categoryName = asset
    ? (categories.find(c => c.id === asset.category_id)?.name ?? 'Uncategorized')
    : ''
  const catStyle = getCategoryStyle(categoryName)
  const isElectronics = categoryName === 'Electronics'

  // ── User-facing status (hides internal statuses) ──────────────────────────
  const userStatus = useMemo(() => {
    if (!asset) return null
    return getUserFacingStatus(asset.status, asset.is_in_dry_cleaning, asset.is_active, blocked)
  }, [asset, blocked])

  const nextAvailable = useMemo(() => getNextAvailableDate(blocked), [blocked])

  const displayImage = mainImage ?? asset?.image_url ?? null
  const activePlan = selectedPlan ?? (plans.length > 0 ? plans[0] : null)
  const totalRent = activePlan ? activePlan.daily_rate * activePlan.duration_days : null

  const handleRentNow = () => {
    if (!token) { setShowLoginPrompt(true); return }
    setShowBookingModal(true)
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (assetQuery.isError) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px' }}>
        <AlertCircle size={36} color="#ef4444" />
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#b91c1c', margin: 0 }}>Asset not found</p>
        <button onClick={() => navigate('/assets')} style={{ padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
          Back to Catalog
        </button>
      </div>
    )
  }

  // ── CTA state derived from user-facing status ─────────────────────────────
  const ctaLoading = assetQuery.isLoading || blockedDatesQuery.isLoading
  const canBook = !ctaLoading && (userStatus?.canBook ?? false)

  const ctaBg = canBook ? '#00c9a7' : '#94a3b8'
  const ctaLabel = ctaLoading
    ? 'Loading…'
    : !userStatus?.canBook
      ? userStatus?.label === 'Coming Soon' ? 'Coming Soon' : 'Unavailable'
      : userStatus.label === 'Fully Booked'
        ? 'Book for Future Dates'
        : 'Book Now'

  return (
    <>
      <style>{`
        .detail-grid { display: grid; grid-template-columns: 60% 40%; gap: 32px; align-items: start; }
        .thumb-row { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
        @media (max-width: 900px) {
          .detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 64px)', padding: '24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Back */}
          <button
            onClick={() => navigate('/assets')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 500, color: '#64748b',
              padding: '0 0 20px 0', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <ArrowLeft size={16} />
            Back to Catalog
          </button>

          {/* Content card */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div className="detail-grid">

              {/* ══ LEFT — Image ══ */}
              <div>
                <div style={{
                  width: '100%',
                  aspectRatio: isElectronics ? '4 / 3' : '3 / 4',
                  borderRadius: '16px', overflow: 'hidden',
                  background: isElectronics ? '#f1f5f9' : '#f8fafc',
                  position: 'relative',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}>
                  {assetQuery.isLoading ? (
                    <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />
                  ) : displayImage ? (
                    <img
                      src={displayImage}
                      alt={asset?.name}
                      style={{
                        width: '100%', height: '100%',
                        objectFit: isElectronics ? 'contain' : 'cover',
                        objectPosition: isElectronics ? 'center' : 'center top',
                        display: 'block', borderRadius: '16px',
                        padding: isElectronics ? '24px' : '0',
                        boxSizing: 'border-box',
                      }}
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <i className="ti ti-photo" style={{ fontSize: '48px', color: '#cbd5e1' }} />
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>No image available</span>
                    </div>
                  )}
                </div>

                {asset?.image_url && (
                  <div className="thumb-row">
                    {[asset.image_url].map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setMainImage(url)}
                        style={{
                          width: '80px', height: '100px', borderRadius: '8px', overflow: 'hidden',
                          border: `2px solid ${displayImage === url ? '#00c9a7' : 'transparent'}`,
                          cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s', background: '#f8fafc',
                        }}
                      >
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ══ RIGHT — Details ══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Header */}
                <div>
                  {assetQuery.isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <Skeleton w="80px" h="22px" radius="20px" />
                      <Skeleton w="70%" h="32px" />
                      <Skeleton w="40%" h="16px" />
                    </div>
                  ) : (
                    <>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: catStyle.bg, color: catStyle.color,
                        borderRadius: '20px', padding: '4px 12px',
                        fontSize: '12px', fontWeight: 600,
                      }}>
                        <Tag size={11} />{categoryName}
                      </span>

                      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '10px 0 4px 0', lineHeight: 1.2 }}>
                        {asset?.name}
                      </h1>

                      <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 10px 0', fontFamily: 'monospace' }}>
                        {asset?.asset_code}
                      </p>

                      {/* Availability badge — user-facing only */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {blockedDatesQuery.isLoading || !userStatus ? (
                          <Skeleton w="100px" h="24px" radius="6px" />
                        ) : (
                          <>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              background: userStatus.bg, color: userStatus.color,
                              borderRadius: '100px', padding: '4px 12px',
                              fontSize: '13px', fontWeight: 600, alignSelf: 'flex-start',
                            }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: userStatus.dotColor, display: 'inline-block', flexShrink: 0 }} />
                              {userStatus.label}
                            </span>
                            {userStatus.label === 'Fully Booked' && nextAvailable && (
                              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                Next available: <strong style={{ color: '#00c9a7' }}>{nextAvailable}</strong>
                                {' '}— you can still book for that date
                              </p>
                            )}
                            {userStatus.label === 'Available' && blocked.length > 0 && (
                              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                Some dates booked — pick an open date in the calendar
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Description */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0' }}>
                    About this item
                  </p>
                  {assetQuery.isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Skeleton w="100%" h="14px" />
                      <Skeleton w="90%" h="14px" />
                      <Skeleton w="75%" h="14px" />
                    </div>
                  ) : asset?.description?.trim() ? (
                    <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.8, margin: '8px 0 4px 0', whiteSpace: 'pre-line' }}>
                      {asset.description}
                    </p>
                  ) : (
                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px dashed #e2e8f0', marginTop: '8px' }}>
                      <p style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                        No description provided for this item.
                      </p>
                    </div>
                  )}
                </div>

                {/* Rental Plans */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px 0' }}>
                    Choose a Rental Plan
                  </p>
                  {plansQuery.isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Skeleton h="72px" radius="10px" />
                      <Skeleton h="72px" radius="10px" />
                    </div>
                  ) : plans.length === 0 ? (
                    <p style={{ fontSize: '14px', color: '#94a3b8' }}>No rental plans available.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {plans.map(plan => (
                        <PlanCard
                          key={plan.id}
                          plan={plan}
                          selected={activePlan?.id === plan.id}
                          onSelect={() => setSelectedPlan(plan)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Pricing summary */}
                {activePlan && (
                  <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px 0' }}>
                      Pricing Summary
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { label: 'Daily Rate',      value: `₹${activePlan.daily_rate}` },
                        { label: 'Duration',         value: `${activePlan.duration_days} days` },
                        { label: 'Total Rent',       value: `₹${totalRent?.toLocaleString('en-IN')}`, bold: true },
                        { label: 'Security Deposit', value: `₹${activePlan.deposit_amount.toLocaleString('en-IN')}` },
                      ].map(({ label, value, bold }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>{label}</span>
                          <span style={{ fontSize: bold ? '15px' : '13px', fontWeight: bold ? 700 : 500, color: bold ? '#0f172a' : '#374151' }}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── CTA / non-bookable state ── */}
                {canBook ? (
                  <>
                    <button
                      onClick={handleRentNow}
                      style={{
                        width: '100%', padding: '16px',
                        background: ctaBg,
                        color: '#fff', border: 'none', borderRadius: '10px',
                        fontSize: '16px', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'background 0.15s, transform 0.15s',
                        letterSpacing: '0.3px',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#0aab8e'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = ctaBg; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      <CalendarDays size={18} />
                      {ctaLabel}
                    </button>
                    {blocked.length > 0 && (
                      <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', margin: '-16px 0 0 0' }}>
                        {userStatus?.label === 'Fully Booked'
                          ? `Calendar opens at the first available date${nextAvailable ? ` (${nextAvailable})` : ''}`
                          : 'Blocked dates are shown in red in the booking calendar'}
                      </p>
                    )}
                  </>
                ) : (
                  /* Coming Soon / Unavailable — no booking option */
                  <div style={{
                    padding: '20px', textAlign: 'center',
                    background: userStatus?.label === 'Coming Soon' ? '#fffbeb' : '#f8fafc',
                    border: `1px solid ${userStatus?.label === 'Coming Soon' ? '#fde68a' : '#e2e8f0'}`,
                    borderRadius: '12px',
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                      {userStatus?.label === 'Coming Soon' ? '🕐' : '🚫'}
                    </div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: userStatus?.label === 'Coming Soon' ? '#92400e' : '#374151', margin: '0 0 6px 0' }}>
                      {userStatus?.label === 'Coming Soon' ? 'Back Soon' : 'Currently Unavailable'}
                    </p>
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 14px 0' }}>
                      {userStatus?.label === 'Coming Soon'
                        ? 'This item will be available for booking shortly.'
                        : 'This item is not available for booking at this time.'}
                    </p>
                    <button
                      onClick={() => navigate('/assets')}
                      style={{ background: 'none', border: 'none', color: '#00c9a7', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
                    >
                      ← Browse other items
                    </button>
                  </div>
                )}

              </div>{/* end right column */}
            </div>{/* end detail-grid */}
          </div>{/* end content card */}
        </div>{/* end max-width container */}
      </div>{/* end page bg */}

      {/* Login prompt */}
      {showLoginPrompt && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '12px', padding: '28px 32px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>Sign in to rent</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0', lineHeight: 1.6 }}>
              Please sign in to book <strong style={{ color: '#0f172a' }}>{asset?.name}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{ flex: 1, padding: '10px 0', background: '#00c9a7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign in
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                style={{ flex: 1, padding: '10px 0', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking modal */}
      {showBookingModal && asset && (
        <AssetBookingModal
          asset={asset}
          onClose={() => setShowBookingModal(false)}
          token={token}
          onBookingSuccess={() => {
            setShowBookingModal(false)
            void assetQuery.refetch()
            void blockedDatesQuery.refetch()
          }}
        />
      )}
    </>
  )
}
