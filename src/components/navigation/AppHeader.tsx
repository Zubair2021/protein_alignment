import { useWorkspaceStore } from '@/features/workspace/useWorkspaceStore'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useSequenceStore } from '@/features/sequences/state/useSequenceStore'
import { Download, Upload, MoonStar, Sun } from 'lucide-react'

interface AppHeaderProps {
  onImportClick: () => void
  onExportClick: () => void
  className?: string
}

export const AppHeader = ({ onImportClick, onExportClick, className }: AppHeaderProps) => {
  const theme = useWorkspaceStore((state) => state.theme)
  const setTheme = useWorkspaceStore((state) => state.setTheme)
  const workspaceName = useWorkspaceStore((state) => state.workspaceName)
  const setWorkspaceName = useWorkspaceStore((state) => state.setWorkspaceName)
  const sequences = useSequenceStore((state) => state.sequences)

  return (
    <header className={cn('flex flex-col gap-4 border-b border-white/5 bg-[#0c1533]/80 px-6 py-4 backdrop-blur-lg', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 shadow-lg shadow-primary-500/40">
            <span className="text-lg font-bold">HC</span>
          </div>
          <div>
            <Input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="w-64 border-white/10 bg-transparent text-lg font-semibold"
            />
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Genomic Visualization Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onImportClick} icon={<Upload className="h-4 w-4" />}>
            Import Data
          </Button>
          <Button variant="ghost" onClick={onExportClick} icon={<Download className="h-4 w-4" />} disabled={!sequences.length}>
            Export
          </Button>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Sun className="h-4 w-4 text-amber-300" />
            <Switch
              checked={theme === 'dark'}
              onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')}
            />
            <MoonStar className="h-4 w-4 text-primary-200" />
          </div>
        </div>
      </div>
    </header>
  )
}
