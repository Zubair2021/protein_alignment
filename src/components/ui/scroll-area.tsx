import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement>

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20', className)} {...props} />
))

ScrollArea.displayName = 'ScrollArea'
