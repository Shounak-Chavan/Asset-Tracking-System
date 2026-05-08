import * as React from 'react'
import { cn } from '../../lib/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', style, ...props }, ref) => {
    const primaryStyle: React.CSSProperties = variant === 'primary'
      ? { background: 'linear-gradient(135deg, #1a3a6b 0%, #1d4ed8 100%)', ...style }
      : style ?? {}

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          variant === 'primary' && 'text-white shadow-sm hover:shadow-lg hover:-translate-y-px focus-visible:ring-blue-500',
          variant === 'secondary' && 'bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow focus-visible:ring-gray-400',
          variant === 'ghost' && 'bg-transparent text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 focus-visible:ring-gray-300',
          variant === 'danger' && 'bg-red-50 text-red-600 border border-red-100 shadow-sm hover:bg-red-100 hover:border-red-200 focus-visible:ring-red-500',
          variant === 'outline' && 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-gray-300',
          size === 'sm' && 'text-xs px-3 py-1.5',
          size === 'md' && 'text-sm px-4 py-2',
          size === 'lg' && 'text-base px-6 py-3',
          className
        )}
        style={primaryStyle}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
