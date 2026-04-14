import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Calendar,
  Package2,
  CreditCard,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Tag,
  Clock,
} from 'lucide-react'
import { api } from '../api'
import { getAssetImage } from '../imageStore'
import type { Asset } from '../types'
import { RentCalculator } from './RentCalculator'

const assetImages: Record<number, string> = {
  0: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80',
  1: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
  2: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80',
  3: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
}
const fallbackImage = assetImages[0]

function getAssetFallback(assetId: number): string {
  return assetImages[assetId % 4] ?? fallbackImage
}

interface AssetBookingModalProps {
  asset: Asset | null
  categoryId?: number | null
  onClose: () => void
  token: string | null
  onBookingSuccess?: () => void
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function AssetBookingModal({ asset, categoryId, onClose, token, onBookingSuccess }: AssetBookingModalProps) {
  const queryClient = useQueryClient()
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [pickupDate, setPickupDate] = useState('')
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const plansQuery = useQuery({
    queryKey: ['plans', token],
    queryFn: async () => {
      if (!token) return []
      const plans = await api.listRentalPlans(token)
      return plans.map((plan) => ({
        ...plan,
        daily_rate: Number(plan.daily_rate),
        deposit_amount: Number(plan.deposit_amount),
        daily_fine_rate: Number(plan.daily_fine_rate),
        damage_fee: Number(plan.damage_fee),
      }))
    },
    enabled: Boolean(token),
  })

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!token || !asset || !selectedPlanId || !pickupDate || !aadhaarNumber || !panNumber) {
        throw new Error('Aadhaar and PAN are required to create booking')
      }

      if (!/^\d{12}$/.test(aadhaarNumber)) {
        throw new Error('Aadhaar must be exactly 12 digits')
      }

      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber)) {
        throw new Error('PAN format must be like ABCDE1234F')
      }

      return api.createBooking(token, {
        rental_plan_id: selectedPlanId,
        pickup_date: pickupDate,
        category_id: categoryId,
        requested_asset_id: asset.id,
        aadhaar_number: aadhaarNumber,
        pan_number: panNumber,
      })
    },
    onSuccess: () => {
      setNotice('Booking created successfully! Admin will allocate the asset.')
      setSelectedPlanId(null)
      setPickupDate('')
      setAadhaarNumber('')
      setPanNumber('')
      setError('')
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setTimeout(() => {
        onBookingSuccess?.()
        onClose()
      }, 1800)
    },
    onError: (error: unknown) => {
      setError(getErrorMessage(error, 'Failed to create booking'))
    },
  })

  if (!asset) return null

  const previewImage = getAssetImage(asset.asset_code) ?? getAssetFallback(asset.id)

  const selectedPlan = plansQuery.data?.find((p) => p.id === selectedPlanId)
  const isFormValid = Boolean(
    selectedPlanId &&
      pickupDate &&
      /^\d{12}$/.test(aadhaarNumber) &&
      /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber),
  )
  const today = new Date().toISOString().split('T')[0]
  const isPending = createBookingMutation.isPending
  const isBooked = Boolean(notice)

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center">
                <Package2 className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Book Asset</h2>
                <p className="text-xs text-surface-400">{asset.name}</p>
              </div>
            </div>
            <button className="modal-close" onClick={onClose} type="button">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="modal-body">
            {/* Asset Preview */}
            <div className="relative rounded-2xl overflow-hidden h-40">
              <img
                src={previewImage}
                alt={asset.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = fallbackImage }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div>
                  <h3 className="text-white font-semibold text-sm">{asset.name}</h3>
                  <p className="text-surface-300 text-xs mt-0.5">{asset.asset_code}</p>
                </div>
                <span className={`badge ${asset.status === 'available' ? 'badge-green' : 'badge-gray'}`}>
                  {asset.status}
                </span>
              </div>
            </div>

            {/* Asset Description */}
            {asset.description && (
              <p className="text-sm text-surface-400 bg-surface-800/40 rounded-xl px-3 py-2.5">
                {asset.description}
              </p>
            )}

            {/* Notices */}
            <AnimatePresence>
              {notice && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-emerald-300">{notice}</p>
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <p className="text-sm text-rose-300">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!isBooked && (
              <>
                {/* Rental Plan Selector */}
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-primary-400" />
                    Select Rental Plan *
                  </label>
                  {plansQuery.isLoading ? (
                    <div className="skeleton h-10 rounded-xl" />
                  ) : (
                    <>
                      <select
                        className="form-select"
                        value={selectedPlanId ?? ''}
                        onChange={(e) => setSelectedPlanId(Number(e.target.value) || null)}
                        disabled={isPending || (plansQuery.data?.length ?? 0) === 0}
                      >
                        <option value="">-- Choose a rental plan --</option>
                        {plansQuery.data?.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} · {plan.duration_days} days · ₹{plan.daily_rate}/day · Deposit ₹{plan.deposit_amount}
                          </option>
                        ))}
                      </select>
                      {(plansQuery.data?.length ?? 0) === 0 && (
                        <p className="text-xs text-amber-300 mt-1">
                          No active rental plans found. Please contact admin.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Pickup Date */}
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary-400" />
                    Pickup Date *
                  </label>
                  <input
                    className="form-input"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    min={today}
                    disabled={isPending}
                  />
                </div>

                {/* Document Verification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Aadhaar Number *</label>
                    <input
                      className="form-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="12-digit Aadhaar"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      disabled={isPending}
                    />
                    {aadhaarNumber && !/^\d{12}$/.test(aadhaarNumber) && (
                      <p className="text-xs text-rose-400">Enter exactly 12 digits.</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">PAN Number *</label>
                    <input
                      className="form-input uppercase"
                      type="text"
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                      disabled={isPending}
                    />
                    {panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber) && (
                      <p className="text-xs text-rose-400">Format must be ABCDE1234F.</p>
                    )}
                  </div>
                </div>

                {/* Rent Calculator */}
                <AnimatePresence>
                  {selectedPlan && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <RentCalculator
                        planName={selectedPlan.name}
                        dailyRate={selectedPlan.daily_rate}
                        durationDays={selectedPlan.duration_days}
                        depositAmount={selectedPlan.deposit_amount}
                        damageLineFee={selectedPlan.damage_fee}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Payment notes */}
                {selectedPlan && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2 text-xs text-surface-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>Deposit is paid upfront and refunded after return (minus fines/damage)</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-surface-400">
                      <CreditCard className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Rent is paid after the asset is allocated to you by admin</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!isBooked && (
            <div className="modal-footer">
              <button className="btn-secondary btn" onClick={onClose} disabled={isPending} type="button">
                Cancel
              </button>
              <motion.button
                className="btn-primary btn"
                onClick={() => createBookingMutation.mutate()}
                disabled={!isFormValid || isPending}
                type="button"
                whileTap={{ scale: 0.96 }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Booking
                  </>
                )}
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
