import { type FormEvent, useState } from 'react'
import { useSequenceStore } from '@/features/sequences/state/useSequenceStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { createAnnotation } from '@/lib/sequence'

export const AnnotationInspector = () => {
  const activeSequenceId = useSequenceStore((state) => state.activeSequenceId)
  const sequence = useSequenceStore((state) => state.sequences.find((item) => item.id === state.activeSequenceId))
  const addAnnotations = useSequenceStore((state) => state.addAnnotations)
  const updateAnnotation = useSequenceStore((state) => state.updateAnnotation)
  const removeAnnotation = useSequenceStore((state) => state.removeAnnotation)
  const undo = useSequenceStore((state) => state.undoAnnotations)
  const redo = useSequenceStore((state) => state.redoAnnotations)

  const [draftName, setDraftName] = useState('')
  const [draftType, setDraftType] = useState('misc_feature')
  const [draftStart, setDraftStart] = useState(1)
  const [draftEnd, setDraftEnd] = useState(10)
  const [draftColor, setDraftColor] = useState('#6e40aa')
  const [draftNotes, setDraftNotes] = useState('')

  if (!sequence || !activeSequenceId) {
    return <p className="text-sm text-white/60">Select a sequence to manage annotations.</p>
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const annotation = createAnnotation({
      sequenceId: activeSequenceId,
      name: draftName || `annotation_${sequence.annotations.length + 1}`,
      type: draftType,
      start: Math.max(0, Math.min(sequence.length - 1, draftStart - 1)),
      end: Math.max(draftStart, Math.min(sequence.length, draftEnd)),
      strand: '+',
      color: draftColor,
      notes: draftNotes,
    })
    void addAnnotations(activeSequenceId, [annotation])
    setDraftName('')
    setDraftNotes('')
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.3em] text-white/50">Annotation Inspector</h3>
        <div className="flex items-center gap-2 text-xs">
          <Button variant="ghost" className="h-8 px-2" onClick={() => undo(activeSequenceId)}>
            Undo
          </Button>
          <Button variant="ghost" className="h-8 px-2" onClick={() => redo(activeSequenceId)}>
            Redo
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-2 rounded-lg border border-white/5 bg-white/5 p-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Name" />
          <Input value={draftType} onChange={(event) => setDraftType(event.target.value)} placeholder="Type" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={1}
            max={sequence.length}
            value={draftStart}
            onChange={(event) => setDraftStart(Number(event.target.value))}
            placeholder="Start"
          />
          <Input
            type="number"
            min={1}
            max={sequence.length}
            value={draftEnd}
            onChange={(event) => setDraftEnd(Number(event.target.value))}
            placeholder="End"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-white/60">Color</label>
          <input type="color" value={draftColor} onChange={(event) => setDraftColor(event.target.value)} className="h-8 w-12 rounded" />
        </div>
        <Textarea value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} placeholder="Notes" rows={3} />
        <Button type="submit" className="justify-center">Create Annotation</Button>
      </form>
      <ScrollArea className="flex-1 space-y-2">
        {sequence.annotations.map((annotation) => (
          <div key={annotation.id} className="rounded-lg border border-white/5 bg-white/5 p-3 text-xs text-white/80">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{annotation.name}</p>
                <Badge className="mt-1" tone="info">{annotation.type}</Badge>
              </div>
              <input
                type="color"
                value={annotation.color}
                onChange={(event) => void updateAnnotation(sequence.id, annotation.id, { color: event.target.value })}
                className="h-8 w-12 rounded"
              />
            </div>
            <p className="mt-2 text-white/60">{annotation.start + 1} – {annotation.end} ({annotation.strand})</p>
            {annotation.notes ? <p className="mt-1 text-white/50">{annotation.notes}</p> : null}
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => void updateAnnotation(sequence.id, annotation.id, { notes: prompt('Notes', annotation.notes ?? '') ?? annotation.notes })}
              >
                Edit Notes
              </Button>
              <Button
                variant="ghost"
                className="h-7 px-2 text-xs text-red-200 hover:text-red-100"
                onClick={() => void removeAnnotation(sequence.id, annotation.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {!sequence.annotations.length ? (
          <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-white/60">
            <p>No annotations yet for this sequence.</p>
          </div>
        ) : null}
      </ScrollArea>
    </div>
  )
}
