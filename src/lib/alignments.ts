import { type AlignmentRecord, type AlignmentSequence } from '@/types'

export const calculateConsensus = (sequences: AlignmentSequence[]) => {
  if (!sequences.length) return ''
  const length = sequences[0].residues.length
  const consensus: string[] = []
  for (let col = 0; col < length; col++) {
    const counts: Record<string, number> = {}
    for (const seq of sequences) {
      const char = seq.residues[col] ?? '-'
      counts[char] = (counts[char] ?? 0) + 1
    }
    const [best] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ['-']
    consensus.push(best)
  }
  return consensus.join('')
}

export const addConsensusToAlignment = (alignment: AlignmentRecord): AlignmentRecord => ({
  ...alignment,
  consensus: alignment.consensus ?? calculateConsensus(alignment.sequences),
})

export const mutateAlignmentResidue = (
  alignment: AlignmentRecord,
  sequenceId: string,
  column: number,
  value: string,
) => {
  const updated = alignment.sequences.map((sequence) => {
    if (sequence.id !== sequenceId) return sequence
    const residues = sequence.residues.split('')
    residues[column] = value
    return { ...sequence, residues: residues.join('') }
  })
  return addConsensusToAlignment({ ...alignment, sequences: updated, updatedAt: Date.now() })
}

export const alignmentColumnStats = (sequences: AlignmentSequence[], column: number) => {
  const counts: Record<string, number> = {}
  for (const seq of sequences) {
    const residue = seq.residues[column] ?? '-'
    counts[residue] = (counts[residue] ?? 0) + 1
  }
  const total = sequences.length || 1
  const entries = Object.entries(counts)
  const mismatches = entries.filter(([residue]) => residue !== '-').length
  const gaps = counts['-'] ?? 0
  const maxCount = entries.reduce((acc, [, value]) => Math.max(acc, value), 0)
  const identity = total ? maxCount / total : 0
  return {
    counts,
    gaps,
    mismatches,
    identity,
  }
}
