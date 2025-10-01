import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

export type SwitchProps = React.InputHTMLAttributes<HTMLInputElement>

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(({ className, ...props }, ref) => {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={cn(
        'relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 transition-colors has-[input:checked]:bg-primary-500',
        className,
      )}
    >
      <input
        id={id}
        ref={ref}
        type="checkbox"
        className="peer sr-only"
        {...props}
      />
      <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
    </label>
  )
})

Switch.displayName = 'Switch'
