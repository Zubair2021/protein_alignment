import * as Comlink from 'comlink'

export interface AnalysisWorkerApi {
  gc(content: string, window: number): Promise<Array<{ position: number; gcPercent: number }>>
  translate(sequence: string, frame: number): Promise<string>
  orfs(sequence: string, minLength: number): Promise<Array<{ frame: number; start: number; end: number; length: number; protein: string }>>
  pairwiseIdentity(a: string, b: string): Promise<{ matches: number; identity: number; length: number }>
  dotPlot(reference: string, query: string, window: number): Promise<Array<{ x: number; y: number; score: number }>>
}

let analysisWorkerInstance: AnalysisWorkerApi | null = null

export const getAnalysisWorker = async () => {
  if (!analysisWorkerInstance) {
    const worker = new Worker(new URL('../workers/analysis.worker.ts', import.meta.url), {
      type: 'module',
    })
    analysisWorkerInstance = Comlink.wrap<AnalysisWorkerApi>(worker)
  }
  return analysisWorkerInstance
}
