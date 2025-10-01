import { createContext, useContext, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

interface TabsProps {
  value: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export const Tabs = ({ value, onValueChange, children, className }: TabsProps) => {
  const contextValue = useMemo<TabsContextValue>(
    () => ({
      value,
      setValue: (next) => {
        if (next === value) return
        onValueChange?.(next)
      },
    }),
    [value, onValueChange],
  )

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

export const TabsList = ({ children, className }: TabsListProps) => (
  <div className={cn('flex items-center gap-1 rounded-lg bg-white/5 p-1 text-sm text-white/70', className)}>
    {children}
  </div>
)

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

export const TabsTrigger = ({ value, children, className }: TabsTriggerProps) => {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within <Tabs>')
  const isActive = context.value === value
  return (
    <button
      type='button'
      onClick={() => context.setValue(value)}
      className={cn(
        'relative flex-1 rounded-md px-3 py-1.5 font-medium transition-colors',
        isActive ? 'bg-primary-500 text-white shadow' : 'hover:bg-white/10',
        className,
      )}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export const TabsContent = ({ value, children, className }: TabsContentProps) => {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within <Tabs>')
  if (context.value !== value) return null
  return <div className={cn('rounded-lg border border-white/5 bg-white/5 p-4', className)}>{children}</div>
}
