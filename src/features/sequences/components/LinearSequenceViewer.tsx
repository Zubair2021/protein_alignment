import React, { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSequenceStore } from '@/features/sequences/state/useSequenceStore'
import { formatBp } from '@/lib/utils'

const LINE_LENGTH = 60

const highlightResidues = (
  line: string,
  lineIndex: number,
  matches: ReturnType<typeof useSequenceStore.getState>['searchMatches'],
) => {
  if (!matches.length) return line
  const offset = lineIndex * LINE_LENGTH
  const fragments: React.ReactNode[] = []
  let cursor = 0
  for (const match of matches) {
    if (match.start >= offset + LINE_LENGTH || match.end <= offset) continue
    const relativeStart = Math.max(0, match.start - offset)
    const relativeEnd = Math.min(LINE_LENGTH, match.end - offset)
    if (relativeStart > cursor) {
      fragments.push(line.slice(cursor, relativeStart))
    }
    fragments.push(
      <span key={`${match.id}-${relativeStart}`} className='rounded bg-primary-500/40 px-0.5'>
        {line.slice(relativeStart, relativeEnd)}
      </span>,
    )
    cursor = relativeEnd
  }
  if (cursor < line.length) {
    fragments.push(line.slice(cursor))
  }
  return fragments
}

interface LinearSequenceViewerProps {
  sequenceId: string
}

export const LinearSequenceViewer = ({ sequenceId }: LinearSequenceViewerProps) => {
  const sequence = useSequenceStore((state) => state.sequences.find((item) => item.id === sequenceId))
  const matches = useSequenceStore((state) => state.searchMatches.filter((match) => match.sequenceId === sequenceId))

  const parentRef = useRef<HTMLDivElement | null>(null)

  const lines = useMemo(() => {
    if (!sequence) return []
    const chunks: string[] = []
    for (let i = 0; i < sequence.residues.length; i += LINE_LENGTH) {
      chunks.push(sequence.residues.slice(i, i + LINE_LENGTH))
    }
    return chunks
  }, [sequence])

  const rowVirtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 8,
  })

  if (!sequence) {
    return <p className='text-sm text-white/60'>Select a sequence to view residues.</p>
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 text-sm text-white/70'>
          <Badge tone='info'>{sequence.type}</Badge>
          <span>{formatBp(sequence.length)} bp</span>
          <span>{sequence.features.length} features</span>
          {matches.length ? <span>{matches.length} matches highlighted</span> : null}
        </div>
        <Button variant='ghost' onClick={() => navigator.clipboard.writeText(sequence.residues)} className='text-xs'>
          Copy Sequence
        </Button>
      </div>
      <div ref={parentRef} className='max-h-[420px] overflow-y-auto rounded-lg border border-white/5 bg-black/20 font-mono text-sm text-primary-50'>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const line = lines[virtualRow.index]
            const start = virtualRow.index * LINE_LENGTH
            const end = start + line.length
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className='flex items-baseline gap-6 px-4 py-1.5'
              >
                <span className='w-24 text-xs text-white/40'>{start + 1}-{end}</span>
                <span className='tracking-[0.18em]'>{highlightResidues(line, virtualRow.index, matches)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
