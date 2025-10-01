import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'default' | 'success' | 'warning' | 'info'
}

const variantMap: Record<Required<BadgeProps>['tone'], string> = {
  default: 'bg-white/10 text-white',
  success: 'bg-emerald-500/20 text-emerald-200',
  warning: 'bg-amber-500/20 text-amber-200',
  info: 'bg-sky-500/20 text-sky-200',
}

export const Badge = ({ tone = 'default', className, ...props }: BadgeProps) => (
  <span
    className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', variantMap[tone], className)}
    {...props}
  />
)
