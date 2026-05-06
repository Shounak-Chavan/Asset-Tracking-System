import * as React from 'react'
import { cn } from '../../lib/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          variant === 'primary' && 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow disabled:hover:shadow-sm focus-visible:ring-blue-500',
          variant === 'secondary' && 'bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-gray-400',
          variant === 'ghost' && 'bg-transparent text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 focus-visible:ring-gray-300',
          variant === 'danger' && 'bg-red-50 text-red-600 border border-red-100 shadow-sm hover:bg-red-100 hover:border-red-200 focus-visible:ring-red-500',
          variant === 'outline' && 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-300',
          size === 'sm' && 'text-xs px-3 py-1.5',
          size === 'md' && 'text-sm px-4 py-2',
          size === 'lg' && 'text-base px-6 py-3',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
