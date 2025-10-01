import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-md border border-transparent font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-3 py-2 text-sm'

const variants: Record<string, string> = {
  default: 'bg-primary-500 hover:bg-primary-400 text-white shadow-md shadow-primary-500/20',
  outline:
    'bg-transparent border border-white/20 text-white hover:bg-white/10 hover:border-white/30',
  ghost: 'bg-transparent hover:bg-white/10 text-white/80',
  subtle: 'bg-white/10 text-white hover:bg-white/15',
  destructive: 'bg-red-600 hover:bg-red-500 text-white',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  icon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', icon, children, ...props }, ref) => (
    <button ref={ref} className={cn(baseStyles, variants[variant], className)} {...props}>
      {icon ? <span className="h-4 w-4">{icon}</span> : null}
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
