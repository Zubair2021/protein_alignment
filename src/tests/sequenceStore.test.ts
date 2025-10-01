import { describe, expect, it } from 'vitest'
import { useSequenceStore } from '@/features/sequences/state/useSequenceStore'
import { createSequenceRecord } from '@/lib/sequence'

describe('sequence store', () => {
  it('adds sequences and updates active id', async () => {
    const record = createSequenceRecord({ name: 'Test', residues: 'ATGC', type: 'DNA' })
    await useSequenceStore.getState().addSequences([record])
    const state = useSequenceStore.getState()
    expect(state.sequences.find((seq) => seq.id === record.id)).toBeDefined()
    expect(state.activeSequenceId).toBe(record.id)
  })
})
