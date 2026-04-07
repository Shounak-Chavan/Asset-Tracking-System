import { motion } from 'framer-motion'
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Coins,
  Receipt,
  RefreshCw,
} from 'lucide-react'
import type { PaymentBreakdown } from '../types'

interface PaymentBreakdownComponentProps {
  breakdown: PaymentBreakdown
}

export function PaymentBreakdownComponent({ breakdown }: PaymentBreakdownComponentProps) {
  const { breakdown: bd } = breakdown

  const planTotal = bd.planned_rent + bd.planned_deposit
  const paidTotal = bd.actual_payments.deposit_paid + bd.actual_payments.rent_paid
  const hasCharges = bd.charges.late_fine > 0 || bd.charges.damage_charges > 0
  const hasRefund = bd.totals.net_deposit_refund > 0

  return (
    <motion.div
      className="bg-surface-800/60 border border-surface-700/50 rounded-2xl p-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Payment Summary</p>
          <p className="text-xs text-surface-500">Booking #{breakdown.booking_id}</p>
        </div>
        <span className={`badge ml-auto ${
          breakdown.status === 'returned' ? 'badge-green' :
          breakdown.status === 'cancelled' ? 'badge-red' : 'badge-blue'
        }`}>
          {breakdown.status}
        </span>
      </div>

      {/* Planned vs Paid Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Planned */}
        <div className="bg-surface-900/60 border border-surface-700/40 rounded-xl p-3">
          <p className="text-xs font-semibold text-surface-400 mb-2 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" /> Planned
          </p>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-surface-400">Rent</span>
              <span className="text-surface-200 font-semibold">₹{bd.planned_rent.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-surface-400">Deposit</span>
              <span className="text-surface-200 font-semibold">₹{bd.planned_deposit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold border-t border-surface-700/50 pt-1.5 mt-0.5">
              <span className="text-surface-300">Total</span>
              <span className="text-blue-300">₹{planTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Paid */}
        <div className="bg-surface-900/60 border border-emerald-500/20 rounded-xl p-3">
          <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
          </p>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-surface-400">Deposit</span>
              <span className="text-emerald-300 font-semibold">₹{bd.actual_payments.deposit_paid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-surface-400">Rent</span>
              <span className="text-emerald-300 font-semibold">₹{bd.actual_payments.rent_paid.toFixed(2)}</span>
            </div>
            {bd.actual_payments.deposit_refunded > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-surface-400">Refunded</span>
                <span className="text-rose-400 font-semibold">-₹{bd.actual_payments.deposit_refunded.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold border-t border-surface-700/50 pt-1.5 mt-0.5">
              <span className="text-surface-300">Total</span>
              <span className="text-emerald-300">₹{paidTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charges */}
      {hasCharges && (
        <div className="bg-rose-500/8 border border-rose-500/20 rounded-xl p-3 mb-4">
          <p className="text-xs font-semibold text-rose-400 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Additional Charges
          </p>
          <div className="flex flex-col gap-1.5">
            {bd.charges.late_fine > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-surface-400">Late Fine</span>
                <span className="text-rose-400 font-bold">₹{bd.charges.late_fine.toFixed(2)}</span>
              </div>
            )}
            {bd.charges.damage_charges > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-surface-400">Damage Charges</span>
                <span className="text-rose-400 font-bold">₹{bd.charges.damage_charges.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Totals Summary */}
      <div className="bg-surface-900/60 border border-surface-700/40 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex justify-between text-xs">
          <span className="text-surface-400 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" /> Total Paid
          </span>
          <span className="text-white font-bold">₹{bd.totals.total_paid.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-surface-400 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" /> Total Due
          </span>
          <span className={`font-bold ${bd.totals.total_due > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            ₹{bd.totals.total_due.toFixed(2)}
          </span>
        </div>

        <div className={`flex justify-between items-center pt-2 mt-1 border-t border-surface-700/50 ${hasRefund ? 'text-emerald-400' : 'text-surface-400'}`}>
          <span className="text-xs font-semibold flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            {hasRefund ? 'Deposit Refund Due' : 'Final Status'}
          </span>
          <span className="text-sm font-black">
            {hasRefund ? `₹${bd.totals.net_deposit_refund.toFixed(2)}` : 'No refund'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
