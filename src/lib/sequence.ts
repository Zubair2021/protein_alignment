import { type Annotation, type Feature, type SequenceRecord, type SequenceType } from '@/types'

const CODON_TABLE: Record<string, string> = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
  CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
  GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
  CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
  CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
  CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R',
  GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
}

export interface GcWindowPoint {
  position: number
  gcPercent: number
}

export interface Orf {
  frame: number
  start: number
  end: number
  length: number
  protein: string
}

export const createSequenceRecord = (
  params: Partial<SequenceRecord> & { residues: string; name: string; type: SequenceType },
): SequenceRecord => {
  const now = Date.now()
  const residues = params.residues.replace(/\s+/g, '').toUpperCase()
  return {
    id: params.id ?? crypto.randomUUID(),
    name: params.name,
    type: params.type,
    residues,
    length: residues.length,
    circular: params.circular ?? false,
    features: params.features ?? [],
    annotations: params.annotations ?? [],
    source: params.source,
    createdAt: params.createdAt ?? now,
    updatedAt: params.updatedAt ?? now,
  }
}

export const calculateGcContent = (sequence: string, window = 200): GcWindowPoint[] => {
  if (!sequence.length) return []
  const normalized = sequence.replace(/[^acgtACGT]/g, '').toUpperCase()
  if (!normalized.length) return []
  const results: GcWindowPoint[] = []
  const step = Math.max(1, Math.floor(window / 4))
  for (let i = 0; i < normalized.length; i += step) {
    const segment = normalized.slice(i, i + window)
    if (!segment.length) break
    const gc = (segment.match(/[GC]/g)?.length ?? 0) / segment.length
    results.push({ position: i, gcPercent: Number((gc * 100).toFixed(2)) })
  }
  return results
}

export const translateDNA = (dna: string, frame = 0) => {
  const normalized = dna.replace(/[^ACGT]/gi, '').toUpperCase()
  let protein = ''
  for (let i = frame; i < normalized.length - 2; i += 3) {
    const codon = normalized.slice(i, i + 3)
    protein += CODON_TABLE[codon] ?? 'X'
  }
  return protein
}

export const findOrfs = (dna: string, minLength = 30): Orf[] => {
  const orfs: Orf[] = []
  const normalized = dna.replace(/[^ACGT]/gi, '').toUpperCase()
  for (let frame = 0; frame < 3; frame++) {
    let i = frame
    while (i < normalized.length - 2) {
      if (normalized.slice(i, i + 3) === 'ATG') {
        const start = i
        i += 3
        while (i < normalized.length - 2) {
          const codon = normalized.slice(i, i + 3)
          if (codon === 'TAA' || codon === 'TAG' || codon === 'TGA') {
            const end = i + 3
            const length = end - start
            if (length >= minLength) {
              orfs.push({
                frame,
                start,
                end,
                length,
                protein: translateDNA(normalized.slice(start, end)),
              })
            }
            break
          }
          i += 3
        }
      }
      i += 3
    }
  }
  return orfs
}

export const sanitizeFeatures = (features: Feature[], length: number) =>
  features
    .map((feature) => ({
      ...feature,
      start: Math.max(0, feature.start),
      end: Math.min(length, feature.end),
    }))
    .filter((feature) => feature.end > feature.start)

export const createAnnotation = (input: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>): Annotation => {
  const now = Date.now()
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
}
