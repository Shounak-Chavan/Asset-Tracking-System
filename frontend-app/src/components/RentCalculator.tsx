import { motion } from 'framer-motion'
import { Calculator, Clock, ShieldCheck, AlertTriangle } from 'lucide-react'

interface RentCalculatorProps {
  planName: string
  dailyRate: number
  durationDays: number
  depositAmount: number
  damageLineFee: number
}

export function RentCalculator({
  planName,
  dailyRate,
  durationDays,
  depositAmount,
  damageLineFee,
}: RentCalculatorProps) {
  const rentAmount = dailyRate * durationDays
  const totalDue = rentAmount + depositAmount

  const rows = [
    { label: 'Daily Rate', value: `₹${dailyRate.toFixed(2)}`, sub: 'per day', color: 'text-surface-200' },
    { label: 'Duration', value: `${durationDays} days`, sub: 'rental period', color: 'text-surface-200' },
  ]

  return (
    <motion.div
      className="bg-surface-800/60 border border-surface-700/50 rounded-2xl p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary-600/20 flex items-center justify-center">
          <Calculator className="w-3.5 h-3.5 text-primary-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white">Cost Breakdown</p>
          <p className="text-[10px] text-surface-500">{planName}</p>
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2 mb-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-surface-700/50">
            <span className="text-xs text-surface-400">{row.label}</span>
            <div className="text-right">
              <span className={`text-xs font-semibold ${row.color}`}>{row.value}</span>
              <span className="text-[10px] text-surface-500 ml-1">{row.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-xl bg-primary-600/10 border border-primary-600/20 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-xs font-semibold text-primary-300">Rent Total</span>
          </div>
          <span className="text-sm font-bold text-primary-300">₹{rentAmount.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface-700/40 border border-surface-600/30 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300">Security Deposit</span>
          </div>
          <span className="text-sm font-bold text-emerald-300">₹{depositAmount.toFixed(2)}</span>
        </div>

        {damageLineFee > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-amber-600/10 border border-amber-600/20 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">Damage Fee (if applicable)</span>
            </div>
            <span className="text-sm font-bold text-amber-300">₹{damageLineFee.toFixed(2)}</span>
          </div>
        )}

        {/* Grand Total */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-surface-700/50">
          <span className="text-xs font-bold text-white">Total (Deposit + Rent)</span>
          <span className="text-base font-black text-white">₹{totalDue.toFixed(2)}</span>
        </div>
      </div>
    </motion.div>
  )
}
