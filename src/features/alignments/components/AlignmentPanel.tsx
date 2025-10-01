import { useSequenceStore } from '@/features/sequences/state/useSequenceStore'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'

export const AlignmentPanel = () => {
  const alignments = useSequenceStore((state) => state.alignments)
  const activeAlignmentId = useSequenceStore((state) => state.activeAlignmentId)
  const setActiveAlignment = useSequenceStore((state) => state.setActiveAlignment)
  const removeAlignment = useSequenceStore((state) => state.removeAlignment)

  if (!alignments.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-sm text-white/60">
        <p>Load CLUSTAL, FASTA, MAF, or Stockholm alignments to enable editing.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="space-y-2">
      {alignments.map((alignment) => {
        const active = alignment.id === activeAlignmentId
        return (
          <button
            key={alignment.id}
            onClick={() => setActiveAlignment(alignment.id)}
            className={`group flex w-full flex-col gap-1 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-left transition hover:border-primary-400/60 ${active ? 'border-primary-400/70 bg-primary-500/20 shadow-inner shadow-primary-500/10' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white/90">{alignment.name}</span>
              <Badge tone="default">{alignment.format}</Badge>
            </div>
            <p className="text-xs text-white/60">
              {alignment.sequences.length} sequences · {alignment.sequences[0]?.residues.length ?? 0} columns
            </p>
            <Button
              variant="ghost"
              className="mt-1 hidden w-full text-xs text-red-200 hover:text-red-100 group-hover:flex"
              onClick={(event) => {
                event.stopPropagation()
                void removeAlignment(alignment.id)
              }}
              icon={<Trash2 className="h-3 w-3" />}
            >
              Remove
            </Button>
          </button>
        )
      })}
    </ScrollArea>
  )
}
