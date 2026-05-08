import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Package2, AlertCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth-context'
import { AssetBookingModal } from '../components/AssetBookingModal'
import type { Asset } from '../types'
import { getCatalogAvailabilityLabel } from '../lib/assetStatus'

// ─── Asset Card ────────────────────────────────────────────────────────────

function AssetCard({
  asset,
  availableAsset,
  available,
  total,
  categoryName,
  minDailyRate,
  onRent,
}: {
  asset: Asset
  availableAsset: Asset | null
  available: number
  total: number
  categoryName: string
  minDailyRate: number | null
  onRent: (asset: Asset | null, isAvailable: boolean) => void
}) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)
  const isAvailable = available > 0
  const isElectronics = categoryName === 'Electronics'

  const containerStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio: '3 / 4',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: isElectronics ? '#f8fafc' : '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const imgTagStyle: React.CSSProperties = isElectronics
    ? {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'center',
        display: 'block',
        padding: '16px',
        boxSizing: 'border-box',
        minHeight: '60%',
      }
    : {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'top',
        display: 'block',
      }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        opacity: isAvailable ? 1 : 0.72,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/assets/${asset.id}`)}
    >
      {/* ── Image ── */}
      <div style={containerStyle}>
        {imgError ? (
          <div style={{
            width: '100%', height: '100%', background: '#f1f5f9',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            <i className="ti ti-photo" style={{ fontSize: '32px', color: '#94a3b8' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>No image</span>
          </div>
        ) : (
          <img
            src={asset.image_url?.trim() || ''}
            alt={asset.name}
            style={{
              ...imgTagStyle,
              transform: hovered && !isElectronics ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 0.3s ease',
            }}
            onError={() => setImgError(true)}
          />
        )}

        {/* Unavailable overlay */}
        {!isAvailable && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
        )}

        {/* Qty badge — top-right */}
        {total > 1 && (
          <div style={{
            position: 'absolute', top: '8px', right: '8px',
            background: 'rgba(255,255,255,0.92)', color: '#374151',
            fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '2px',
          }}>
            {available}/{total}
          </div>
        )}

        {/* RENT NOW — slides up on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); onRent(availableAsset, isAvailable) }}
          disabled={!isAvailable}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: isAvailable ? 'linear-gradient(135deg, #00c9a7 0%, #0d9488 100%)' : '#9ca3af',
            color: '#fff',
            border: 'none',
            padding: '12px',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.8px',
            cursor: isAvailable ? 'pointer' : 'not-allowed',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(100%)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            textTransform: 'uppercase',
          }}
        >
          {isAvailable ? 'RENT NOW' : 'OUT OF STOCK'}
        </button>
      </div>

      {/* ── Card Body ── */}
      <div style={{ padding: '8px 10px 12px' }}>
        {/* Category */}
        <p style={{
          fontSize: '11px', fontWeight: 700, color: '#535766',
          textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0,
        }}>
          {categoryName}
        </p>

        {/* Name */}
        <p style={{
          fontSize: '13px', color: '#3e4152', margin: '2px 0 0 0',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {asset.name}
        </p>

        {/* Price row */}
        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          {minDailyRate != null && (
            <>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#3e4152' }}>₹{minDailyRate}</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>/day</span>
            </>
          )}
        </div>

        {/* Availability */}
        {(() => {
          const { label, color } = getCatalogAvailabilityLabel(isAvailable, asset.is_in_dry_cleaning, asset.status)
          return (
            <p style={{ fontSize: '11px', fontWeight: 500, margin: '4px 0 0 0', color }}>
              ● {label}
            </p>
          )
        })()}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

function AssetsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | number>('all')
  const [sortBy, setSortBy] = useState<'featured' | 'name'>('featured')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [loginPromptAsset, setLoginPromptAsset] = useState<Asset | null>(null)

  const assetsQuery = useQuery({
    queryKey: ['assets-public'],
    queryFn: async () => {
      try { return await api.listAssets(token) } catch { return [] }
    },
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories-public'],
    queryFn: async () => {
      try { return await api.listCategories(token) } catch { return [] }
    },
  })

  const rentalPlansQuery = useQuery({
    queryKey: ['rental-plans-public'],
    queryFn: async () => {
      try { return await api.listRentalPlans('') } catch { return [] }
    },
  })

  const assets = assetsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const rentalPlans = rentalPlansQuery.data ?? []

  const minDailyRate = useMemo(() => {
    const active = rentalPlans.filter((p) => p.is_active)
    if (active.length === 0) return null
    return Math.min(...active.map((p) => p.daily_rate))
  }, [rentalPlans])

  const getCategoryName = (id: number) =>
    categories.find((c) => c.id === id)?.name ?? 'Uncategorized'

  const grouped = useMemo(() => {
    const map = new Map<string, { asset: Asset; availableAsset: Asset | null; available: number; total: number }>()
    for (const a of assets) {
      if (!a.is_active) continue
      const key = `${a.name.trim().toLowerCase()}__${a.category_id}`
      const existing = map.get(key)
      const isAvailable = a.status === 'available' && !a.is_in_dry_cleaning
      if (existing) {
        existing.total += 1
        if (isAvailable) {
          existing.available += 1
          if (!existing.availableAsset) existing.availableAsset = a
        }
      } else {
        map.set(key, {
          asset: a,
          availableAsset: isAvailable ? a : null,
          total: 1,
          available: isAvailable ? 1 : 0,
        })
      }
    }
    return Array.from(map.values())
  }, [assets])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const items = grouped.filter(({ asset }) => {
      const matchesSearch =
        term === '' ||
        asset.name.toLowerCase().includes(term) ||
        asset.asset_code.toLowerCase().includes(term) ||
        getCategoryName(asset.category_id).toLowerCase().includes(term)
      const matchesCategory = selectedCategory === 'all' || asset.category_id === selectedCategory
      return matchesSearch && matchesCategory
    })
    if (sortBy === 'name') return [...items].sort((a, b) => a.asset.name.localeCompare(b.asset.name))
    return items
  }, [grouped, search, selectedCategory, sortBy, categories])

  const handleRentNow = (asset: Asset | null, isAvailable: boolean) => {
    if (!isAvailable || !asset) return
    if (!token) { setLoginPromptAsset(asset); return }
    setSelectedAsset(asset)
  }

  return (
    <div style={{ background: 'linear-gradient(180deg, #f5f5f6 0%, #f0f4f8 100%)', minHeight: '100vh' }}>

      {/* ── Category Tab Bar ── */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e9e9eb',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        position: 'sticky',
        top: '64px',
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          gap: '0',
        }}>
          {(['all', ...categories] as const).map((item) => {
            const isAll = item === 'all'
            const id = isAll ? 'all' : (item as { id: number }).id
            const label = isAll ? 'All' : (item as { name: string }).name
            const active = selectedCategory === id
            return (
              <button
                key={String(id)}
                onClick={() => setSelectedCategory(id as 'all' | number)}
                style={{
                  padding: '14px 20px',
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  border: 'none',
                  borderBottom: active ? '3px solid #00c9a7' : '2px solid transparent',
                  background: 'transparent',
                  color: active ? '#00c9a7' : '#535766',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#3e4152' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#535766' }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 0',
          borderBottom: '1px solid #e9e9eb',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '14px', color: '#535766' }}>
            All Assets ({filtered.length})
          </span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                color: '#9ca3af', width: '13px', height: '13px', pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '8px 10px 8px 30px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#3e4152',
                  outline: 'none',
                  width: '180px',
                  boxSizing: 'border-box',
                  background: '#fff',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00c9a7'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.1)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
              />
            </div>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'featured' | 'name')}
              style={{
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '13px',
                color: '#3e4152',
                outline: 'none',
                cursor: 'pointer',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'border-color 0.2s ease',
              }}
            >
              <option value="featured">Recommended</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px 48px' }}>
        {assetsQuery.isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'start' }} className="assets-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ aspectRatio: '2 / 3', background: '#f3f4f6' }} />
                <div style={{ padding: '8px 10px 12px' }}>
                  <div style={{ height: '10px', background: '#f3f4f6', borderRadius: '2px', marginBottom: '6px', width: '50%' }} />
                  <div style={{ height: '13px', background: '#f3f4f6', borderRadius: '2px', width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : assetsQuery.isError ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '64px 24px', background: '#fef2f2', borderRadius: '4px', textAlign: 'center',
          }}>
            <AlertCircle style={{ width: '32px', height: '32px', color: '#ef4444', marginBottom: '12px' }} />
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#b91c1c', margin: '0 0 4px 0' }}>Failed to load assets</p>
            <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>Please check your connection and try again.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 24px', background: '#fff', borderRadius: '4px', textAlign: 'center',
          }}>
            <Package2 style={{ width: '36px', height: '36px', color: '#9ca3af', marginBottom: '12px' }} />
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#374151', margin: '0 0 4px 0' }}>No assets found</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 20px 0' }}>Try a different search or category.</p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory('all') }}
              style={{ padding: '8px 20px', background: '#3e4152', color: '#fff', border: 'none', borderRadius: '2px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'start' }} className="assets-grid">
            {filtered.map(({ asset, availableAsset, available, total }) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                availableAsset={availableAsset}
                available={available}
                total={total}
                categoryName={getCategoryName(asset.category_id)}
                minDailyRate={minDailyRate}
                onRent={handleRentNow}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Login Prompt Modal ── */}
      {loginPromptAsset && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }}
          onClick={() => setLoginPromptAsset(null)}
        >
          <div
            style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '16px', padding: '32px', maxWidth: '380px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.8) inset', position: 'relative', border: '1px solid rgba(255,255,255,0.7)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLoginPromptAsset(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
            >
              <X size={18} />
            </button>
            <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Package2 size={22} color="#3e4152" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#3e4152', margin: '0 0 8px 0' }}>Sign in to rent</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0', lineHeight: '1.6' }}>
              Please sign in to rent <strong style={{ color: '#3e4152' }}>{loginPromptAsset.name}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{ flex: 1, padding: '10px 0', background: '#3e4152', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign in
              </button>
              <button
                onClick={() => setLoginPromptAsset(null)}
                style={{ flex: 1, padding: '10px 0', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Booking Modal ── */}
      {token && (
        <AssetBookingModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          token={token}
          onBookingSuccess={() => { setSelectedAsset(null); void assetsQuery.refetch() }}
        />
      )}
    </div>
  )
}

export { AssetsPage }
export default AssetsPage
