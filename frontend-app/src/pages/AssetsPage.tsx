import { useQuery } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Package2, Tag, AlertCircle } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth-context'
import { getAssetImage } from '../imageStore'
import { AssetBookingModal } from '../components/AssetBookingModal'
import type { Allocation, Asset, Booking, User } from '../types'

const assetImages: Record<string, string> = {
  default0: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80',
  default1: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
  default2: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80',
  default3: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
  default4: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  default5: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
}
const fallbackImage = assetImages['default0']

function getAssetFallback(index: number): string {
  return assetImages[`default${index % 6}`] ?? fallbackImage
}

function AssetCardSkeleton() {
  return (
    <div className="asset-card">
      <div className="skeleton w-full h-48" />
      <div className="p-4 flex flex-col gap-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-9 w-full rounded-xl mt-3" />
      </div>
    </div>
  )
}

interface AssetCardProps {
  asset: Asset
  imageIndex: number
  onBook: () => void
  showCode?: boolean
  allocatedUser?: User
  booking?: Booking
  categoryName?: string
  onDeactivate?: () => void
  deactivating?: boolean
}

function AssetCard({ asset, imageIndex, onBook, showCode, allocatedUser, booking, categoryName, onDeactivate, deactivating }: AssetCardProps) {
  const customImage = getAssetImage(asset.asset_code)
  const img = customImage ?? getAssetFallback(imageIndex)

  const isAvailable = asset.status === 'available'
  const isAllocated = asset.status === 'allocated'

  const statusBadge = () => {
    if (isAvailable) return <span className="badge badge-green">Available</span>
    if (isAllocated) return <span className="badge badge-purple">Allocated</span>
    return <span className="badge badge-gray capitalize">{asset.status}</span>
  }

  return (
    <motion.article
      className="asset-card"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
    >
      <div className="relative overflow-hidden">
        <img
          src={img}
          alt={`${asset.name} preview`}
          className="w-full h-48 object-cover transition-transform duration-500 hover:scale-105"
          onError={(e) => { e.currentTarget.src = fallbackImage }}
          loading="lazy"
        />
        <div className="absolute top-3 right-3">
          {statusBadge()}
        </div>
        {categoryName && (
          <div className="absolute bottom-3 left-3">
            <span className="badge badge-blue text-[10px]">
              <Tag className="w-2.5 h-2.5" />{categoryName}
            </span>
          </div>
        )}
      </div>

      <div className="asset-body flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-white text-sm leading-tight mb-0.5">{asset.name}</h3>
          <p className="text-xs text-surface-400 line-clamp-2">
            {asset.description ?? 'No description available.'}
          </p>
        </div>

        {showCode && (
          <p className="text-xs text-surface-500 font-mono">{asset.asset_code}</p>
        )}

        {allocatedUser && (
          <div className="bg-surface-800/60 rounded-xl p-2.5 text-xs text-surface-400 flex flex-col gap-1">
            <span><span className="text-surface-300 font-medium">Allocated to:</span> {allocatedUser.full_name}</span>
            {allocatedUser.phone && <span><span className="text-surface-300 font-medium">Mobile:</span> {allocatedUser.phone}</span>}
            {booking && <span><span className="text-surface-300 font-medium">Booking:</span> #{booking.id}</span>}
          </div>
        )}

        {onBook && !showCode && (
          <button
            className="btn-primary btn w-full btn-sm"
            type="button"
            onClick={onBook}
          >
            Book Now
          </button>
        )}

        {onDeactivate && (
          <button
            className="btn-danger btn w-full btn-sm"
            type="button"
            onClick={onDeactivate}
            disabled={deactivating}
          >
            {deactivating ? 'Updating...' : 'Deactivate'}
          </button>
        )}
      </div>
    </motion.article>
  )
}

export function AssetsPage() {
  const { token, user } = useAuth()
  const queryClient = useQueryClient()
  const [nameFilter, setNameFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [activeAdminTab, setActiveAdminTab] = useState<'allocated' | 'unallocated' | null>(null)
  const [selectedAdminCategoryId, setSelectedAdminCategoryId] = useState<number | null>(null)
  const [selectedAssetForBooking, setSelectedAssetForBooking] = useState<Asset | null>(null)

  const categoriesQuery = useQuery({
    queryKey: ['categories', token],
    queryFn: async () => {
      if (!token) return []
      return api.listCategories(token)
    },
    enabled: Boolean(token),
  })

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) return ''
    return categoriesQuery.data?.find((category) => category.id === selectedCategoryId)?.name ?? ''
  }, [selectedCategoryId, categoriesQuery.data])

  const isUserMode = user?.role !== 'admin'

  const assetsQuery = useQuery({
    queryKey: ['assets', token, nameFilter, categoryFilter, selectedCategoryName, isUserMode],
    queryFn: async () => {
      if (!token) return []
      if (isUserMode) return api.listAssets(token)
      return api.listAssetsFiltered(token, {
        name: nameFilter || undefined,
        category_name: categoryFilter || undefined,
      })
    },
    enabled: Boolean(token) && (!isUserMode || Boolean(selectedCategoryName)),
  })

  const allocationsQuery = useQuery({
    queryKey: ['allocations', token],
    queryFn: async () => {
      if (!token || isUserMode) return []
      return api.listAllocations(token)
    },
    enabled: Boolean(token) && !isUserMode,
  })

  const adminBookingsQuery = useQuery({
    queryKey: ['adminBookings', token],
    queryFn: async () => {
      if (!token || isUserMode) return []
      return api.listAdminBookings(token)
    },
    enabled: Boolean(token) && !isUserMode,
  })

  const usersQuery = useQuery({
    queryKey: ['users', token],
    queryFn: async () => {
      if (!token || isUserMode) return []
      return api.listUsers(token)
    },
    enabled: Boolean(token) && !isUserMode,
  })

  const deactivateMutation = useMutation({
    mutationFn: async (assetId: number) => {
      if (!token) throw new Error('Missing token')
      return api.deleteAsset(token, assetId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })

  const displayAssets = useMemo(() => {
    const source = assetsQuery.data ?? []
    if (!isUserMode) {
      return source
    }
    const inCategory = source.filter((asset) => asset.category_id === selectedCategoryId)
    const representativeByName = new Map<string, Asset>()

    inCategory.forEach((asset) => {
      const key = asset.name.trim().toLowerCase()
      const existing = representativeByName.get(key)

      if (!existing) {
        representativeByName.set(key, asset)
        return
      }

      // Prefer an available asset so users can actually create bookings.
      if (existing.status !== 'available' && asset.status === 'available') {
        representativeByName.set(key, asset)
      }
    })

    return Array.from(representativeByName.values())
  }, [assetsQuery.data, isUserMode, selectedCategoryId])

  const categoryNameById = useMemo(() => {
    const map: Record<number, string> = {}
    ;(categoriesQuery.data ?? []).forEach((category) => {
      map[category.id] = category.name
    })
    return map
  }, [categoriesQuery.data])

  const latestAllocationByAssetId = useMemo(() => {
    const map = new Map<number, Allocation>()
    ;(allocationsQuery.data ?? []).forEach((allocation) => {
      if (!map.has(allocation.asset_id)) {
        map.set(allocation.asset_id, allocation)
      }
    })
    return map
  }, [allocationsQuery.data])

  const bookingById = useMemo(() => {
    const map = new Map<number, Booking>()
    ;(adminBookingsQuery.data ?? []).forEach((booking) => {
      map.set(booking.id, booking)
    })
    return map
  }, [adminBookingsQuery.data])

  const userById = useMemo(() => {
    const map = new Map<number, User>()
    ;(usersQuery.data ?? []).forEach((u) => {
      map.set(u.id, u)
    })
    return map
  }, [usersQuery.data])

  const adminFilteredAssets = useMemo(() => {
    if (isUserMode) return []
    if (activeAdminTab === 'allocated') {
      return displayAssets.filter((asset) => asset.status === 'allocated')
    }
    if (activeAdminTab === 'unallocated') {
      return displayAssets.filter((asset) => asset.status !== 'allocated')
    }
    return []
  }, [displayAssets, isUserMode, activeAdminTab])

  const adminCategoryOptions = useMemo(() => {
    const uniqueCategoryIds = Array.from(new Set(adminFilteredAssets.map((asset) => asset.category_id)))
    return uniqueCategoryIds
      .map((id) => ({ id, name: categoryNameById[id] ?? `Category #${id}` }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [adminFilteredAssets, categoryNameById])

  const adminDisplayedAssets = useMemo(() => {
    if (!selectedAdminCategoryId) return adminFilteredAssets
    return adminFilteredAssets.filter((asset) => asset.category_id === selectedAdminCategoryId)
  }, [adminFilteredAssets, selectedAdminCategoryId])

  if (!token) return <Navigate to="/login" replace />

  const isLoading = categoriesQuery.isLoading || assetsQuery.isLoading ||
    (!isUserMode && (allocationsQuery.isLoading || adminBookingsQuery.isLoading || usersQuery.isLoading))

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isUserMode ? 'Browse Assets' : 'Assets Gallery'}
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            {isUserMode
              ? 'Select a category to browse available asset types'
              : 'Admin view: manage and monitor all assets'}
          </p>
        </div>
        {!isUserMode && (
          <div className="badge badge-purple">
            <Package2 className="w-3 h-3" /> Admin View
          </div>
        )}
      </div>

      {/* ── USER MODE ── */}
      {isUserMode && (
        <>
          {/* Category Filter Strip */}
          <div className="card">
            <p className="text-sm font-medium text-surface-300 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-400" />
              Select a Category
            </p>
            {categoriesQuery.isLoading ? (
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-9 w-24 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {categoriesQuery.data?.map((category) => (
                  <motion.button
                    key={category.id}
                    type="button"
                    className={`chip ${selectedCategoryId === category.id ? 'chip-active' : ''}`}
                    onClick={() => setSelectedCategoryId(category.id)}
                    whileTap={{ scale: 0.96 }}
                  >
                    {category.name}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {!selectedCategoryId ? (
            <div className="empty-state py-20">
              <div className="empty-state-icon">
                <Package2 className="w-8 h-8" />
              </div>
              <p className="empty-state-title">Select a category above</p>
              <p className="empty-state-desc">Choose a category to browse available assets</p>
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => <AssetCardSkeleton key={i} />)}
                </div>
              ) : displayAssets.length === 0 ? (
                <div className="empty-state py-16">
                  <div className="empty-state-icon"><AlertCircle className="w-8 h-8" /></div>
                  <p className="empty-state-title">No assets in this category</p>
                  <p className="empty-state-desc">Try selecting a different category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {displayAssets.map((asset, i) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        imageIndex={i}
                        onBook={() => setSelectedAssetForBooking(asset)}
                        categoryName={categoryNameById[asset.category_id]}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── ADMIN MODE ── */}
      {!isUserMode && (
        <>
          {/* Filter bar */}
          <div className="card rounded-2xl border shadow-lg p-6 flex flex-wrap gap-6 items-end">
            <div className="flex-1 min-w-48 form-group">
              <label className="form-label">Search by Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  className="form-input pl-9"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Filter by name..."
                />
              </div>
            </div>
            <div className="flex-1 min-w-48 form-group">
              <label className="form-label">Search by Category</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  className="form-input pl-9"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  placeholder="Filter by category..."
                />
              </div>
            </div>

            <div className="w-full border-t border-zinc-800 pt-6">
              <p className="text-sm font-semibold text-zinc-300 mb-3">Asset Section</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { key: 'allocated', label: 'Allocated' },
                  { key: 'unallocated', label: 'Unallocated' },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveAdminTab(tab.key)
                      setSelectedAdminCategoryId(null)
                    }}
                    className={`w-full min-h-12 px-6 py-3 rounded-xl text-lg font-semibold border transition-all duration-200 ${
                      activeAdminTab === tab.key
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <AssetCardSkeleton key={i} />)}
            </div>
          ) : (
            activeAdminTab === null ? (
              <div className="empty-state py-12 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur">
                <div className="empty-state-icon"><Package2 className="w-6 h-6" /></div>
                <p className="empty-state-title">Select a view to continue</p>
                <p className="empty-state-desc">Choose Allocated or Unallocated to see assets.</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeAdminTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-zinc-800 shadow-lg p-6 space-y-4 bg-zinc-900"
                >
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <h2 className="text-lg font-medium text-zinc-200">
                        {activeAdminTab === 'allocated' ? 'Allocated Assets' : 'Unallocated Assets'}
                      </h2>
                      <p className="text-xs text-zinc-500">Showing {adminDisplayedAssets.length} assets</p>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-zinc-800 pt-4">
                    <p className="text-sm font-semibold text-zinc-300">Categories</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <button
                        type="button"
                        className={`w-full min-h-11 px-4 py-2 rounded-xl text-base font-medium border transition-all ${
                          selectedAdminCategoryId === null
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                        }`}
                        onClick={() => setSelectedAdminCategoryId(null)}
                      >
                        All Categories
                      </button>

                      {adminCategoryOptions.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          className={`w-full min-h-11 px-4 py-2 rounded-xl text-base font-medium border transition-all ${
                            selectedAdminCategoryId === category.id
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                          }`}
                          onClick={() => setSelectedAdminCategoryId(category.id)}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {adminDisplayedAssets.length === 0 ? (
                    <div className="empty-state py-10">
                      <div className="empty-state-icon"><Package2 className="w-6 h-6" /></div>
                      <p className="empty-state-title">No assets found</p>
                      <p className="empty-state-desc">Try choosing a different category or filter.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {adminDisplayedAssets.map((asset, i) => {
                        const allocation = latestAllocationByAssetId.get(asset.id)
                        const booking = allocation ? bookingById.get(allocation.booking_id) : undefined
                        const allocatedUser = booking ? userById.get(booking.user_id) : undefined
                        const isAllocated = asset.status === 'allocated'

                        return (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            imageIndex={i}
                            onBook={() => {}}
                            showCode
                            allocatedUser={isAllocated ? allocatedUser : undefined}
                            booking={isAllocated ? booking : undefined}
                            categoryName={categoryNameById[asset.category_id]}
                            onDeactivate={
                              !isAllocated
                                ? () => {
                                    if (window.confirm(`Deactivate ${asset.name} (${asset.asset_code})?`)) {
                                      deactivateMutation.mutate(asset.id)
                                    }
                                  }
                                : undefined
                            }
                            deactivating={deactivateMutation.isPending}
                          />
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )
          )}

          {deactivateMutation.error && (
            <p className="error-text flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {deactivateMutation.error.message}
            </p>
          )}
        </>
      )}

      <AssetBookingModal
        asset={selectedAssetForBooking}
        categoryId={selectedAssetForBooking?.category_id ?? selectedCategoryId}
        onClose={() => setSelectedAssetForBooking(null)}
        token={token}
        onBookingSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['bookings'] })
        }}
      />
    </div>
  )
}
