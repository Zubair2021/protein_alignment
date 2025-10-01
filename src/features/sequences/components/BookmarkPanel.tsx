import { type FormEvent, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSequenceStore } from '@/features/sequences/state/useSequenceStore'
import { toColor } from '@/lib/utils'
import type { Bookmark } from '@/types'

export const BookmarkPanel = () => {
  const activeSequenceId = useSequenceStore((state) => state.activeSequenceId)
  const sequences = useSequenceStore((state) => state.sequences)
  const bookmarks = useSequenceStore((state) => state.bookmarks)
  const addBookmark = useSequenceStore((state) => state.addBookmark)
  const removeBookmark = useSequenceStore((state) => state.removeBookmark)

  const sequence = useMemo(
    () => sequences.find((item) => item.id === activeSequenceId),
    [sequences, activeSequenceId],
  )

  const sequenceBookmarks = useMemo(
    () => bookmarks.filter((bookmark) => bookmark.sequenceId === activeSequenceId),
    [bookmarks, activeSequenceId],
  )

  const [name, setName] = useState('')
  const [position, setPosition] = useState(1)

  if (!sequence || !activeSequenceId) {
    return <p className='text-xs text-white/60'>Bookmarks appear once a sequence is selected.</p>
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      sequenceId: activeSequenceId,
      name: name || `Locus ${position}`,
      position: Math.max(1, Math.min(sequence.length, position)),
      color: toColor(sequenceBookmarks.length),
    }
    addBookmark(bookmark)
    setName('')
  }

  return (
    <div className='flex flex-col gap-3'>
      <form onSubmit={handleSubmit} className='grid gap-2 rounded-lg border border-white/5 bg-white/5 p-3 text-xs'>
        <div className='grid grid-cols-2 gap-2'>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder='Name' />
          <Input
            type='number'
            min={1}
            max={sequence.length}
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
            placeholder='Position'
          />
        </div>
        <Button type='submit' className='justify-center'>Add Bookmark</Button>
      </form>
      <ScrollArea className='max-h-40 space-y-2'>
        {sequenceBookmarks.map((bookmark) => (
          <div key={bookmark.id} className='flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs text-white/70'>
            <span>
              <span className='mr-2 inline-flex h-2 w-2 rounded-full' style={{ backgroundColor: bookmark.color }} />
              {bookmark.name}
            </span>
            <div className='flex items-center gap-2'>
              <span>{bookmark.position}</span>
              <Button variant='ghost' className='h-7 px-2 text-[10px]' onClick={() => removeBookmark(bookmark.id)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        {!sequenceBookmarks.length && <p className='text-xs text-white/50'>No bookmarks yet.</p>}
      </ScrollArea>
    </div>
  )
}
