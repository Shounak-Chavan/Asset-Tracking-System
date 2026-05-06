import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '../../lib/cn'

type AlertVariant = 'success' | 'error' | 'info' | 'warning'

interface AlertProps {
  variant: AlertVariant
  message: string
  onDismiss?: () => void
  className?: string
}

const config: Record<AlertVariant, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: <AlertCircle className="w-4 h-4 shrink-0" />,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: <Info className="w-4 h-4 shrink-0" />,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: <AlertCircle className="w-4 h-4 shrink-0" />,
  },
}

export function Alert({ variant, message, onDismiss, className }: AlertProps) {
  const { bg, border, text, icon } = config[variant]
  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 p-4 rounded-2xl border text-sm font-medium',
        bg, border, text, className
      )}
    >
      {icon}
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="ml-auto p-0.5 rounded hover:opacity-70 transition-opacity shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
