import { type FormEvent, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSequenceStore } from '@/features/sequences/state/useSequenceStore'
import { Badge } from '@/components/ui/badge'

export const SearchPanel = () => {
  const sequence = useSequenceStore((state) => state.sequences.find((item) => item.id === state.activeSequenceId))
  const setActiveSequence = useSequenceStore((state) => state.setActiveSequence)
  const setMatches = useSequenceStore((state) => state.setSearchMatches)
  const matches = useSequenceStore((state) => state.searchMatches)

  const [query, setQuery] = useState('')
  const [regex, setRegex] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!sequence || !query) {
      setMatches([])
      return
    }
    const results: typeof matches = []
    const target = sequence.residues
    if (regex) {
      try {
        const re = new RegExp(query, 'gi')
        let match: RegExpExecArray | null
        while ((match = re.exec(target))) {
          results.push({
            id: crypto.randomUUID(),
            label: match[0],
            sequenceId: sequence.id,
            start: match.index,
            end: match.index + match[0].length,
          })
        }
      } catch (error) {
        console.error(error)
      }
    } else {
      let index = target.toUpperCase().indexOf(query.toUpperCase())
      while (index !== -1) {
        results.push({
          id: crypto.randomUUID(),
          label: query,
          sequenceId: sequence.id,
          start: index,
          end: index + query.length,
        })
        index = target.toUpperCase().indexOf(query.toUpperCase(), index + 1)
      }
    }
    setMatches(results)
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <form onSubmit={handleSubmit} className="grid gap-2 rounded-lg border border-white/5 bg-white/5 p-3">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Search</label>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Query or regex" />
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>Regex</span>
          <Switch checked={regex} onChange={(event) => setRegex(event.target.checked)} />
        </div>
        <Button type="submit" className="justify-center">Find Matches</Button>
      </form>
      <ScrollArea className="flex-1 space-y-2">
        {matches.map((match) => (
          <button
            key={match.id}
            onClick={() => {
              setActiveSequence(match.sequenceId)
            }}
            className="w-full rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-left text-xs text-white/70 transition hover:border-primary-400/60"
          >
            <div className="flex items-center justify-between">
              <Badge tone="success">{match.label}</Badge>
              <span>{match.start + 1}-{match.end}</span>
            </div>
            <p className="mt-1 text-white/50">Sequence: {match.sequenceId.slice(0, 6)}</p>
          </button>
        ))}
        {!matches.length && <p className="text-xs text-white/50">No matches yet.</p>}
      </ScrollArea>
    </div>
  )
}
