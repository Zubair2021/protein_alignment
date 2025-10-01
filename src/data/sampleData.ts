import { createSequenceRecord } from '@/lib/sequence'
import { type AlignmentRecord } from '@/types'

export const demoSequences = [
  createSequenceRecord({
    name: 'Helix Plasmid 01',
    residues:
      'ATGACCATGATTACGAATTCCCGGGGATCCAAAACCCGGGTTTATGATGACCTGATCGATCGTAGCTAGCTAGCTAGGCTAGCTAGGATCCGATCGATCGGATCCAATTCGCGGCCGCTTAA',
    type: 'DNA',
    circular: true,
    features: [
      { id: crypto.randomUUID(), name: 'Ori', type: 'origin', start: 10, end: 120, strand: '+', color: '#2f80ed' },
      { id: crypto.randomUUID(), name: 'Reporter', type: 'CDS', start: 150, end: 360, strand: '+', color: '#f2994a' },
    ],
  }),
  createSequenceRecord({
    name: 'SARS-CoV-2 Spike Fragment',
    residues:
      'ATGTTTGTTTTTCTTGTTTTAATTTTTCTTGTTTTATTGTTTTCTTGTTTTTGTTTTTTGTTCTAAACGAACAAACTAAAAAATCTGTGTGGCTGTCACTCGGCTGCATGTGTGTT',
    type: 'RNA',
    circular: false,
  }),
  createSequenceRecord({
    name: 'Protein Kinase Demo',
    residues:
      'MAGAASPCANGCGPEYVNSTTQLLRRAVAILWHEMWHEMDSDLTKKKLEELEKERKLEEQLEKKKKQQEE',
    type: 'Protein',
  }),
]

export const demoAlignment: AlignmentRecord = {
  id: crypto.randomUUID(),
  name: 'Demo FASTA Alignment',
  format: 'FASTA',
  type: 'multiple',
  sequences: [
    { id: crypto.randomUUID(), name: 'SeqA', residues: 'ATGACCATGATTACGAATTCCCGGGGATCCAAAACCCGGGTTTAA' },
    { id: crypto.randomUUID(), name: 'SeqB', residues: 'ATGACCATGATTACGAATTCCCAGGGATCCAAAACCCAGGTTTAA' },
    { id: crypto.randomUUID(), name: 'SeqC', residues: 'ATGACCATGATTACGAATTCCCGGGGATCCAAAACCCGGGTTTAA' },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
