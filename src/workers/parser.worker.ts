import * as Comlink from 'comlink'
import { parseAlignment, parseCsvAnnotations, parseEmbl, parseFasta, parseGenBank, parseGff3 } from '@/lib/parsers'
import { type ParsedFileResult } from '@/types'

const parserApi = {
  async parseFile(name: string, text: string): Promise<ParsedFileResult> {
    const lower = name.toLowerCase()
    if (lower.endsWith('.fa') || lower.endsWith('.fasta') || lower.endsWith('.faa')) {
      const sequences = parseFasta(text, name)
      return { sequences, alignments: [] }
    }
    if (lower.endsWith('.gb') || lower.endsWith('.gbk') || lower.endsWith('.genbank')) {
      const sequences = parseGenBank(text)
      return { sequences, alignments: [] }
    }
    if (lower.endsWith('.embl')) {
      const sequences = parseEmbl(text)
      return { sequences, alignments: [] }
    }
    if (lower.endsWith('.gff') || lower.endsWith('.gff3')) {
      return { sequences: [], alignments: [] }
    }
    if (lower.endsWith('.clustal') || lower.endsWith('.aln')) {
      return { sequences: [], alignments: [parseAlignment(text, 'CLUSTAL')] }
    }
    if (lower.endsWith('.maf')) {
      return { sequences: [], alignments: [parseAlignment(text, 'MAF')] }
    }
    if (lower.endsWith('.sto') || lower.endsWith('.stockholm')) {
      return { sequences: [], alignments: [parseAlignment(text, 'Stockholm')] }
    }
    if (lower.endsWith('.csv')) {
      // CSV annotations handled client-side where sequenceId context exists
      return { sequences: [], alignments: [] }
    }
    if (lower.endsWith('.json')) {
      return JSON.parse(text) as ParsedFileResult
    }
    // default fallback to FASTA
    return { sequences: parseFasta(text, name), alignments: [] }
  },
  parseAnnotationsCsv(sequenceId: string, text: string) {
    return parseCsvAnnotations(text, sequenceId)
  },
  parseGff(text: string) {
    return parseGff3(text)
  },
  parseAlignment(text: string, format: 'FASTA' | 'CLUSTAL' | 'MAF' | 'Stockholm') {
    return parseAlignment(text, format)
  },
}

Comlink.expose(parserApi)
