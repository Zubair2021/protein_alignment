import { createSequenceRecord } from '@/lib/sequence'
import { type AlignmentRecord, type AlignmentSequence, type Feature, type SequenceRecord, type SequenceType } from '@/types'

const toSequenceType = (raw: string): SequenceType => {
  if (/protein/i.test(raw)) return 'Protein'
  if (/rna/i.test(raw)) return 'RNA'
  return 'DNA'
}

export const parseFasta = (content: string, source = 'FASTA'): SequenceRecord[] => {
  const sequences: SequenceRecord[] = []
  const entries = content.trim().split(/^>(.+)$/m).filter(Boolean)
  for (let i = 0; i < entries.length; i += 2) {
    const header = entries[i].trim()
    const residues = entries[i + 1]?.replace(/[^A-Za-z*-]/g, '') ?? ''
    const [name] = header.split(/\s+/)
    const type = toSequenceType(header)
    sequences.push(
      createSequenceRecord({
        name: name || `Sequence ${sequences.length + 1}`,
        residues,
        type,
        source,
      }),
    )
  }
  return sequences
}

const parseFeatureLine = (line: string, length: number): Feature | null => {
  const [rangePart, ...rest] = line.split(/\s+/)
  const notes = rest.join(' ')
  const match = rangePart.match(/(complement\()?([0-9]+)\.\.([0-9]+)\)?/)
  if (!match) return null
  const [, complement, startRaw, endRaw] = match
  const start = Math.max(0, Number.parseInt(startRaw, 10) - 1)
  const end = Math.min(length, Number.parseInt(endRaw, 10))
  return {
    id: crypto.randomUUID(),
    name: notes || 'feature',
    type: 'feature',
    start,
    end,
    strand: complement ? '-' : '+',
    notes,
  }
}

export const parseGenBank = (content: string): SequenceRecord[] => {
  const entries = content.split(/\n\/\/\s*/)
  const sequences: SequenceRecord[] = []
  for (const entry of entries) {
    if (!entry.trim()) continue
    const locus = entry.match(/^LOCUS\s+(\S+)/m)?.[1] ?? `GenBank_${sequences.length + 1}`
    const definition = entry.match(/^DEFINITION\s+([^\n]+)/m)?.[1] ?? locus
    const origin = entry.split(/^ORIGIN/m)[1] ?? ''
    const residues = origin.replace(/[^a-zA-Z]/g, '')
    const featuresBlock = entry.split(/^FEATURES/m)[1]?.split(/^ORIGIN/m)[0] ?? ''
    const featureLines = featuresBlock.split(/\n(?=\s{5}\w)/)
    const features: Feature[] = []
    for (const line of featureLines) {
      const clean = line.replace(/\s{5,}/, '').trim()
      if (!clean) continue
      const feature = parseFeatureLine(clean, residues.length)
      if (feature) features.push(feature)
    }
    sequences.push(
      createSequenceRecord({
        name: definition.trim(),
        residues,
        type: 'DNA',
        features,
        source: 'GenBank',
      }),
    )
  }
  return sequences
}

export const parseEmbl = (content: string): SequenceRecord[] => {
  const entries = content.split(/\n\/\/\s*/)
  const sequences: SequenceRecord[] = []
  for (const entry of entries) {
    if (!entry.trim()) continue
    const id = entry.match(/^ID\s+(\S+)/m)?.[1] ?? `EMBL_${sequences.length + 1}`
    const description = entry.match(/^DE\s+([^\n]+)/m)?.[1] ?? id
    const sequence = entry.split(/^SQ\s+/m)[1]?.split(/\n\//)[0] ?? ''
    const residues = sequence.replace(/[^a-zA-Z]/g, '')
    sequences.push(
      createSequenceRecord({
        name: description.trim(),
        residues,
        type: 'DNA',
        source: 'EMBL',
      }),
    )
  }
  return sequences
}

export const parseGff3 = (content: string): Feature[] => {
  const lines = content.split(/\n+/)
  const features: Feature[] = []
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue
    const [, , type, startRaw, endRaw, , strandRaw, , attributes] = line.split('\t')
    const attrMap = Object.fromEntries(
      (attributes ?? '')
        .split(';')
        .filter(Boolean)
        .map((pair) => {
          const [key, value] = pair.split('=')
          return [key, decodeURIComponent(value ?? '')]
        }),
    )
    features.push({
      id: crypto.randomUUID(),
      name: attrMap.Name ?? attrMap.ID ?? `${type}_${features.length + 1}`,
      type,
      start: Number.parseInt(startRaw, 10) - 1,
      end: Number.parseInt(endRaw, 10),
      strand: strandRaw === '-' ? '-' : '+',
      color: attrMap.color,
      notes: attrMap.Note,
    })
  }
  return features
}

export const parseAlignment = (content: string, format: AlignmentRecord['format']): AlignmentRecord => {
  const id = crypto.randomUUID()
  const now = Date.now()
  if (format === 'FASTA') {
    const sequences = parseFasta(content, 'Alignment FASTA').map((sequence) => ({
      id: sequence.id,
      name: sequence.name,
      residues: sequence.residues,
    }))
    return {
      id,
      name: 'Imported FASTA alignment',
      format,
      type: sequences.length > 2 ? 'multiple' : 'pairwise',
      sequences,
      createdAt: now,
      updatedAt: now,
    }
  }

  if (format === 'CLUSTAL') {
    const lines = content.split(/\n+/).filter((line) => line.trim() && !line.startsWith('CLUSTAL'))
    const map = new Map<string, string>()
    for (const line of lines) {
      const [name, residues] = line.trim().split(/\s+/)
      if (!residues) continue
      map.set(name, (map.get(name) ?? '') + residues)
    }
    const sequences: AlignmentSequence[] = Array.from(map.entries()).map(([name, residues]) => ({
      id: crypto.randomUUID(),
      name,
      residues,
    }))
    return {
      id,
      name: 'Imported CLUSTAL alignment',
      format,
      type: 'multiple',
      sequences,
      createdAt: now,
      updatedAt: now,
    }
  }

  if (format === 'MAF' || format === 'Stockholm') {
    const sequences: AlignmentSequence[] = []
    const lines = content.split(/\n+/)
    for (const line of lines) {
      if (line.startsWith('s ') || line.startsWith('#=GS') || line.startsWith('>')) {
        const parts = line.trim().split(/\s+/)
        const name = parts[1] ?? `Sequence_${sequences.length + 1}`
        const residues = parts[parts.length - 1] ?? ''
        sequences.push({ id: crypto.randomUUID(), name, residues })
      }
    }
    return {
      id,
      name: `Imported ${format} alignment`,
      format,
      type: 'multiple',
      sequences,
      createdAt: now,
      updatedAt: now,
    }
  }

  throw new Error(`Unsupported alignment format: ${format}`)
}

export const exportFasta = (sequence: SequenceRecord) => {
  const lines = sequence.residues.match(/.{1,80}/g) ?? []
  return `>${sequence.name}\n${lines.join('\n')}\n`
}

export const exportMultiFasta = (sequences: SequenceRecord[]) => sequences.map(exportFasta).join('\n')

export const exportAlignmentFasta = (alignment: AlignmentRecord) =>
  alignment.sequences.map((sequence) => `>${sequence.name}\n${sequence.residues}\n`).join('\n')

export const exportAlignmentClustal = (alignment: AlignmentRecord) => {
  const blockSize = 60
  const lines = ['CLUSTAL W (HelixCanvas) alignment']
  const length = alignment.sequences[0]?.residues.length ?? 0
  for (let offset = 0; offset < length; offset += blockSize) {
    lines.push('')
    for (const sequence of alignment.sequences) {
      lines.push(`${sequence.name.padEnd(15)} ${sequence.residues.slice(offset, offset + blockSize)}`)
    }
  }
  return `${lines.join('\n')}\n`
}

export const parseCsvAnnotations = (content: string, sequenceId: string) => {
  const rows = content.trim().split(/\n+/)
  const [headerLine, ...dataLines] = rows
  if (!headerLine) return []
  const headers = headerLine.split(',').map((item) => item.trim().toLowerCase())
  return dataLines.map((line) => {
    const values = line.split(',').map((item) => item.trim())
    const record: Record<string, string> = {}
    values.forEach((value, index) => {
      record[headers[index] ?? `field_${index}`] = value
    })
    const start = Number.parseInt(record.start ?? record.begin ?? '1', 10) - 1
    const end = Number.parseInt(record.end ?? '1', 10)
    return {
      id: crypto.randomUUID(),
      sequenceId,
      name: record.name ?? `annotation_${crypto.randomUUID().slice(0, 6)}`,
      type: record.type ?? 'custom',
      start: Number.isNaN(start) ? 0 : start,
      end: Number.isNaN(end) ? start + 1 : end,
      strand: (record.strand === '-' ? '-' : '+') as '+' | '-',
      color: record.color ?? '#6e40aa',
      notes: record.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  })
}

export const exportGenBank = (sequence: SequenceRecord) => {
  const header = `LOCUS       ${sequence.name.replace(/\s+/g, '_')} ${sequence.length} bp    ${sequence.type}    ${new Date(sequence.updatedAt).toISOString().split('T')[0]}`
  const featureLines = sequence.features
    .map((feature) => {
      const location = `${feature.strand === '-' ? 'complement(' : ''}${feature.start + 1}..${feature.end}${feature.strand === '-' ? ')' : ''}`
      return [
        `     ${feature.type.padEnd(16)}${location}`,
        `                     /label="${feature.name}"`,
      ].join('\n')
    })
    .join('\n')
  const annotationLines = sequence.annotations
    .map((annotation) =>
      [`     misc_feature    ${annotation.start + 1}..${annotation.end}`, `                     /label="${annotation.name}"`].join('\n'),
    )
    .join('\n')
  const originLines = (sequence.residues.match(/.{1,60}/g) ?? [])
    .map((chunk, index) => {
      const blocks = chunk.match(/.{1,10}/g)?.join(' ') ?? chunk
      return ` ${String(index * 60 + 1).padStart(9, ' ')} ${blocks}`
    })
    .join('\n')
  return [
    header,
    'FEATURES             Location/Qualifiers',
    featureLines,
    annotationLines,
    'ORIGIN',
    originLines,
    '//',
  ]
    .filter(Boolean)
    .join('\n')
}
