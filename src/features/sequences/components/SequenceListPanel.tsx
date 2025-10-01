import { useMemo } from 'react'
import { formatBp } from '@/lib/utils'
import { useSequenceStore } from '@/features/sequences/state/useSequenceStore'
import { useWorkspaceStore } from '@/features/workspace/useWorkspaceStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PlusCircle, Trash2 } from 'lucide-react'

interface SequenceListPanelProps {
  onImport: () => void
}

export const SequenceListPanel = ({ onImport }: SequenceListPanelProps) => {
  const sequences = useSequenceStore((state) => state.sequences)
  const activeSequenceId = useSequenceStore((state) => state.activeSequenceId)
  const setActiveSequence = useSequenceStore((state) => state.setActiveSequence)
  const removeSequence = useSequenceStore((state) => state.removeSequence)
  const recentFiles = useWorkspaceStore((state) => state.recentFiles)

  const totalResidues = useMemo(() => sequences.reduce((acc, sequence) => acc + sequence.length, 0), [sequences])

  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.4em] text-white/50">Sequences</h2>
          <Button variant="ghost" onClick={onImport} icon={<PlusCircle className="h-4 w-4" />}>
            Add
          </Button>
        </div>
        <p className="text-sm text-white/70">{sequences.length} loaded · {formatBp(totalResidues)} bp</p>
      </div>
      <ScrollArea className="flex-1 space-y-2">
        {sequences.map((sequence) => {
          const active = sequence.id === activeSequenceId
          return (
            <button
              key={sequence.id}
              onClick={() => setActiveSequence(sequence.id)}
              className={`group flex w-full flex-col gap-1 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-left transition hover:border-primary-400/60 ${active ? 'border-primary-400/70 bg-primary-500/10 shadow-inner shadow-primary-500/20' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/90">{sequence.name}</span>
                <Badge tone="info">{sequence.type}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>{formatBp(sequence.length)} bp</span>
                <span>{sequence.features.length} features</span>
              </div>
              <Button
                variant="ghost"
                className="mt-1 hidden w-full text-xs text-red-200 hover:text-red-100 group-hover:flex"
                onClick={(event) => {
                  event.stopPropagation()
                  void removeSequence(sequence.id)
                }}
                icon={<Trash2 className="h-3 w-3" />}
              >
                Remove
              </Button>
            </button>
          )
        })}
        {!sequences.length ? (
          <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-sm text-white/60">
            <p>Drop FASTA, GenBank, EMBL, or alignment files to begin.</p>
          </div>
        ) : null}
      </ScrollArea>
      <div className="rounded-lg border border-white/5 bg-white/5 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Recent</h3>
        <ul className="mt-2 space-y-1 text-xs text-white/60">
          {recentFiles.map((file) => (
            <li key={file.name} className="truncate">{file.name}</li>
          ))}
          {!recentFiles.length && <li className="text-white/40">No files yet</li>}
        </ul>
      </div>
    </div>
  )
}
