import { describe, expect, it } from 'vitest'
import { parseFasta, parseGenBank, exportFasta } from '@/lib/parsers'

const fasta = `>demo\nATGCATGC`
const genbank = `LOCUS       TESTSEQ                 8 bp    DNA     linear   01-JAN-2024\nFEATURES             Location/Qualifiers\n     CDS             1..6\n                     /label=demo\nORIGIN\n        1 atgcatgc\n//`

describe('parsers', () => {
  it('parses fasta', () => {
    const sequences = parseFasta(fasta)
    expect(sequences).toHaveLength(1)
    expect(sequences[0].residues).toBe('ATGCATGC')
  })

  it('parses genbank', () => {
    const sequences = parseGenBank(genbank)
    expect(sequences).toHaveLength(1)
    expect(sequences[0].residues).toBe('ATGCATGC')
  })

  it('exports fasta', () => {
    const sequences = parseFasta(fasta)
    const output = exportFasta(sequences[0])
    expect(output).toContain('>demo')
  })
})
