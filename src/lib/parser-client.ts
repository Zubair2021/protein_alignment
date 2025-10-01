import * as Comlink from 'comlink'
import { type Feature, type ParsedFileResult } from '@/types'
import { parseCsvAnnotations } from '@/lib/parsers'

interface ParserWorkerApi {
  parseFile(name: string, text: string): Promise<ParsedFileResult>
  parseAnnotationsCsv(sequenceId: string, text: string): Promise<ReturnType<typeof parseCsvAnnotations>>
  parseGff(text: string): Promise<Feature[]>
  parseAlignment(text: string, format: 'FASTA' | 'CLUSTAL' | 'MAF' | 'Stockholm'): Promise<ParsedFileResult['alignments'][number]>
}

let workerApi: ParserWorkerApi | null = null

export const getParserWorker = async () => {
  if (!workerApi) {
    const worker = new Worker(new URL('../workers/parser.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerApi = Comlink.wrap<ParserWorkerApi>(worker)
  }
  return workerApi
}
