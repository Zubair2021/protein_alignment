import { useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useSequenceStore } from '@/features/sequences/state/useSequenceStore'
import { alignmentColumnStats, mutateAlignmentResidue } from '@/lib/alignments'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const CELL_WIDTH = 18
const CELL_HEIGHT = 28

export const AlignmentViewer = () => {
  const alignment = useSequenceStore((state) => state.alignments.find((item) => item.id === state.activeAlignmentId))
  const updateAlignment = useSequenceStore((state) => state.updateAlignment)

  const [editing, setEditing] = useState<{ sequenceId: string; column: number } | null>(null)
  const [draft, setDraft] = useState('')

  const containerRef = useRef<HTMLDivElement | null>(null)

  const alignmentLength = alignment?.sequences[0]?.residues.length ?? 0
  const consensus = alignment?.consensus ?? ''.padEnd(alignmentLength, '-')

  const rowVirtualizer = useVirtualizer({
    count: alignment?.sequences.length ?? 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => CELL_HEIGHT,
    overscan: 6,
  })

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: alignmentLength,
    getScrollElement: () => containerRef.current,
    estimateSize: () => CELL_WIDTH,
    overscan: 12,
  })

  const gridWidth = columnVirtualizer.getTotalSize()
  const gridHeight = rowVirtualizer.getTotalSize()
  const visibleRows = rowVirtualizer.getVirtualItems()
  const visibleColumns = columnVirtualizer.getVirtualItems()

  const editingPosition = useMemo(() => {
    if (!editing || !alignment) return null
    const rowIndex = alignment.sequences.findIndex((sequence) => sequence.id === editing.sequenceId)
    if (rowIndex === -1) return null
    return {
      top: rowIndex * CELL_HEIGHT,
      left: editing.column * CELL_WIDTH,
    }
  }, [editing, alignment])

  const startEditing = (sequenceId: string, column: number, initial: string) => {
    setEditing({ sequenceId, column })
    setDraft(initial.toUpperCase())
  }

  const commitEdit = () => {
    if (editing && alignment) {
      const value = (draft || '.').toUpperCase()[0]
      const next = mutateAlignmentResidue(alignment, editing.sequenceId, editing.column, value)
      void updateAlignment(alignment.id, next)
    }
    setEditing(null)
    setDraft('')
  }

  const cancelEdit = () => {
    setEditing(null)
    setDraft('')
  }

  if (!alignment) {
    return <p className='text-sm text-white/60'>Load an alignment to begin curation.</p>
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 text-sm text-white/70'>
          <Badge tone='info'>{alignment.format}</Badge>
          <span>{alignment.sequences.length} sequences</span>
          <span>{alignmentLength} columns</span>
        </div>
        <Button variant='ghost' className='text-xs' onClick={() => setEditing(null)}>
          Clear Selection
        </Button>
      </div>
      <div className='relative rounded-lg border border-white/5 bg-black/40'>
        <div className='sticky top-0 z-10 bg-black/70 text-xs text-white/70'>
          <div className='flex border-b border-white/10'>
            <div className='w-36 px-3 py-2'>Sequence</div>
            <div className='flex-1 overflow-hidden'>
              <div className='relative' style={{ height: CELL_HEIGHT }}>
                <div style={{ width: gridWidth, height: CELL_HEIGHT }}>
                  {visibleColumns.map((column) => (
                    <div
                      key={column.key}
                      className='absolute top-0 border-r border-white/10 px-1 text-xs text-white/60'
                      style={{ transform: `translateX(${column.start}px)`, width: column.size }}
                    >
                      {column.index + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className='flex border-b border-white/10 bg-black/60 text-xs text-white/60'>
            <div className='w-36 px-3 py-2 font-semibold text-white/80'>Consensus</div>
            <div className='relative flex-1' style={{ height: CELL_HEIGHT }}>
              <div style={{ width: gridWidth, height: CELL_HEIGHT }}>
                {visibleColumns.map((column) => (
                  <div
                    key={`consensus-${column.key}`}
                    className='absolute top-0 flex h-full items-center justify-center border-r border-white/10 text-xs'
                    style={{ transform: `translateX(${column.start}px)`, width: column.size }}
                  >
                    {consensus[column.index] ?? '-'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div
          ref={containerRef}
          className='max-h-[420px] overflow-auto font-mono text-sm text-white'
          style={{ position: 'relative' }}
        >
          <div style={{ height: gridHeight, width: gridWidth }}>
            {visibleRows.map((row) => {
              const sequence = alignment.sequences[row.index]
              return (
                <div
                  key={row.key}
                  className='absolute flex border-b border-white/5'
                  style={{ transform: `translateY(${row.start}px)`, height: row.size, width: '100%' }}
                >
                  <div className='flex w-36 items-center border-r border-white/10 px-3 text-xs text-white/70'>
                    {sequence.name}
                  </div>
                  <div className='relative flex-1'>
                    {visibleColumns.map((column) => {
                      const residue = sequence.residues[column.index] ?? '-'
                      const stats = alignmentColumnStats(alignment.sequences, column.index)
                      const consensusResidue = consensus[column.index] ?? '-'
                      const isEditing = editing?.sequenceId === sequence.id && editing.column === column.index
                      const isGap = residue === '-'
                      const isMatch = residue === consensusResidue
                      const mismatchRatio = 1 - (stats.identity || 0)
                      const tone = isGap ? 'text-white/30' : isMatch ? 'text-emerald-200' : 'text-amber-200'
                      const backgroundColor = isEditing
                        ? undefined
                        : mismatchRatio > 0.5
                          ? 'rgba(248, 113, 113, 0.25)'
                          : mismatchRatio > 0.2
                            ? 'rgba(251, 191, 36, 0.18)'
                            : 'transparent'
                      return (
                        <button
                          key={`${row.key}-${column.key}`}
                          className={`absolute top-0 flex h-full items-center justify-center border-r border-white/10 text-xs transition ${tone} ${
                            isEditing ? 'bg-primary-500/40 text-white' : 'hover:bg-white/10'
                          }`}
                          style={{
                            transform: `translateX(${column.start}px)`,
                            width: column.size,
                            background: backgroundColor,
                          }}
                          onDoubleClick={() => startEditing(sequence.id, column.index, residue)}
                        >
                          {residue}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {editing && editingPosition ? (
          <div
            className='pointer-events-auto absolute rounded border border-primary-400 bg-black/80 p-2 shadow-lg'
            style={{ left: editingPosition.left + 144, top: editingPosition.top + 60 }}
          >
            <input
              autoFocus
              maxLength={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value.toUpperCase())}
              onBlur={commitEdit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitEdit()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  cancelEdit()
                }
              }}
              className='h-9 w-9 rounded border border-white/20 bg-black/60 text-center text-lg uppercase text-white focus:outline-none focus:ring-2 focus:ring-primary-400'
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
