import { cn } from '../../lib/cn'
import { bookingStatusColor, formatStatus } from '../../lib/status'

interface StatusBadgeProps {
  status: string
  colorMap?: Record<string, string>
  className?: string
}

export function StatusBadge({ status, colorMap = bookingStatusColor, className }: StatusBadgeProps) {
  const colors = colorMap[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border capitalize',
        colors,
        className
      )}
    >
      {formatStatus(status)}
    </span>
  )
}
