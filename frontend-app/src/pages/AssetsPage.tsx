import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Package2, SlidersHorizontal, AlertCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth-context'
import { AssetBookingModal } from '../components/AssetBookingModal'
import type { Asset } from '../types'

const fallbackImage =
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80'

export function AssetsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | number>('all')
  const [sortBy, setSortBy] = useState<'featured' | 'name'>('featured')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [loginPromptAsset, setLoginPromptAsset] = useState<Asset | null>(null)

  // Fetch assets publicly — no token required
  const assetsQuery = useQuery({
    queryKey: ['assets-public'],
    queryFn: async () => {
      try {
        return await api.listAssets(token)
      } catch {
        return []
      }
    },
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories-public'],
    queryFn: async () => {
      try {
        return await api.listCategories(token)
      } catch {
        return []
      }
    },
  })

  const assets = assetsQuery.data ?? []
  const categories = categoriesQuery.data ?? []

  const getCategoryName = (id: number) =>
    categories.find((c) => c.id === id)?.name ?? 'Uncategorized'

  // Group assets by name+category so duplicates (quantity > 1) show as one card
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
    if (!token) {
      setLoginPromptAsset(asset)
      return
    }
    setSelectedAsset(asset)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('all')
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 48px',
      }} className="sm-assets-pad">

        {/* ── Header ── */}
        <div style={{ marginBottom: '8px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
            margin: '0 0 6px 0',
          }}>
            Browse the rental catalog
          </h1>
          <p style={{ fontSize: '15px', color: '#6b7280', margin: 0 }}>
            Explore shared equipment, check availability, and book what you need.
          </p>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          margin: '24px 0 32px 0',
        }}>
          {[
            { label: 'Items', value: grouped.length },
            { label: 'Visible', value: filtered.length },
            { label: 'Categories', value: categories.length },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '16px 20px',
            }}>
              <p style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#6b7280',
                margin: '0 0 4px 0',
              }}>
                {stat.label}
              </p>
              <p style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#111827',
                margin: 0,
              }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Search + Sort + Filters ── */}
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '28px',
        }}>
          {/* Search + Sort row */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                width: '16px',
                height: '16px',
                pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Search assets, codes, or categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '10px 14px',
              background: '#f9fafb',
            }}>
              <SlidersHorizontal style={{ width: '15px', height: '15px', color: '#6b7280' }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'featured' | 'name')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#374151',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="featured">Featured</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                border: selectedCategory === 'all' ? 'none' : '1px solid #e5e7eb',
                background: selectedCategory === 'all' ? '#2563eb' : '#f3f4f6',
                color: selectedCategory === 'all' ? '#fff' : '#374151',
                transition: 'background 0.15s',
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 16px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: selectedCategory === cat.id ? 'none' : '1px solid #e5e7eb',
                  background: selectedCategory === cat.id ? '#2563eb' : '#f3f4f6',
                  color: selectedCategory === cat.id ? '#fff' : '#374151',
                  transition: 'background 0.15s',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── Asset Grid ── */}
        {assetsQuery.isLoading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }} className="assets-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#fff',
              }}>
                <div style={{ height: '180px', background: '#f3f4f6' }} />
                <div style={{ padding: '16px' }}>
                  <div style={{ height: '16px', background: '#f3f4f6', borderRadius: '4px', marginBottom: '8px', width: '70%' }} />
                  <div style={{ height: '12px', background: '#f3f4f6', borderRadius: '4px', width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : assetsQuery.isError ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            border: '1px solid #fee2e2',
            borderRadius: '12px',
            background: '#fef2f2',
            textAlign: 'center',
          }}>
            <AlertCircle style={{ width: '32px', height: '32px', color: '#ef4444', marginBottom: '12px' }} />
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#b91c1c', margin: '0 0 4px 0' }}>Failed to load assets</p>
            <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>Please check your connection and try again.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px',
            border: '1px dashed #e5e7eb',
            borderRadius: '12px',
            background: '#fafafa',
            textAlign: 'center',
          }}>
            <Package2 style={{ width: '36px', height: '36px', color: '#9ca3af', marginBottom: '12px' }} />
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#374151', margin: '0 0 4px 0' }}>No assets found</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 20px 0' }}>
              Try a different search term or category filter.
            </p>
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 20px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }} className="assets-grid">
            {filtered.map(({ asset, availableAsset, available, total }) => {
              const isAvailable = available > 0
              const categoryName = getCategoryName(asset.category_id)
              return (
                <div
                  key={asset.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', height: '180px', background: '#f3f4f6', overflow: 'hidden' }}>
                    <img
                      src={asset.image_url?.trim() || fallbackImage}
                      alt={asset.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.src = fallbackImage }}
                    />
                    {/* Qty badge — only shown when total > 1 */}
                    {total > 1 && (
                      <div style={{
                        position: 'absolute', top: '10px', left: '10px',
                        background: 'rgba(0,0,0,0.55)', color: '#fff',
                        fontSize: '11px', fontWeight: 600,
                        padding: '3px 8px', borderRadius: '999px',
                        backdropFilter: 'blur(4px)',
                      }}>
                        {available}/{total} available
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Name + status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0, lineHeight: '1.4' }}>
                        {asset.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: isAvailable ? '#22c55e' : '#ef4444', flexShrink: 0,
                        }} />
                        <span style={{ fontSize: '11px', color: isAvailable ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                          {isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>

                    {/* Category badge */}
                    <div>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 500,
                      }}>
                        {categoryName}
                      </span>
                    </div>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Rent Now button */}
                    <button
                      onClick={() => handleRentNow(availableAsset, isAvailable)}
                      disabled={!isAvailable}
                      style={{
                        width: '100%',
                        padding: '9px 0',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        border: 'none',
                        background: isAvailable ? '#2563eb' : '#e5e7eb',
                        color: isAvailable ? '#fff' : '#9ca3af',
                        transition: 'background 0.15s',
                        marginTop: '4px',
                      }}
                      onMouseEnter={(e) => {
                        if (isAvailable) e.currentTarget.style.background = '#1d4ed8'
                      }}
                      onMouseLeave={(e) => {
                        if (isAvailable) e.currentTarget.style.background = '#2563eb'
                      }}
                    >
                      {isAvailable ? 'Rent Now' : 'Not Available'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Login Prompt Modal ── */}
      {loginPromptAsset && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '24px',
          }}
          onClick={() => setLoginPromptAsset(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '28px 32px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLoginPromptAsset(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Package2 size={22} color="#2563eb" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>
              Sign in to rent
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0', lineHeight: '1.6' }}>
              Please sign in to rent <strong style={{ color: '#111827' }}>{loginPromptAsset.name}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign in
              </button>
              <button
                onClick={() => setLoginPromptAsset(null)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
          </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Booking Modal (logged in only) ── */}
      {token && (
        <AssetBookingModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          token={token}
          onBookingSuccess={() => {
            setSelectedAsset(null)
            void assetsQuery.refetch()
          }}
        />
      )}
    </div>
  )
}
