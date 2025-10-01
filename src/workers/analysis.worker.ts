import * as Comlink from 'comlink'
import { calculateGcContent, findOrfs, translateDNA } from '@/lib/sequence'

const wasmModulePromise = (async () => {
  const response = await fetch('/wasm/pairwise_score.wasm')
  const bytes = await response.arrayBuffer()
  const module = await WebAssembly.instantiate(bytes)
  const exports = module.instance.exports as {
    memory: WebAssembly.Memory
    countMatches: (aPtr: number, bPtr: number, length: number) => number
    identityPercentage: (matches: number, length: number) => number
  }
  const memory = exports.memory
  const view = new Uint8Array(memory.buffer)
  const ensureCapacity = (size: number) => {
    const neededPages = Math.ceil(size / 65536)
    const currentPages = memory.buffer.byteLength / 65536
    if (neededPages > currentPages) {
      memory.grow(neededPages - currentPages)
    }
  }
  const encodeSequence = (sequence: string, offset: number) => {
    const bytesSequence = new TextEncoder().encode(sequence)
    ensureCapacity(offset + bytesSequence.length)
    view.set(bytesSequence, offset)
    return bytesSequence.length
  }
  const scorePair = (a: string, b: string) => {
    const length = Math.min(a.length, b.length)
    const aOffset = 0
    const bOffset = length + 32
    encodeSequence(a.slice(0, length), aOffset)
    encodeSequence(b.slice(0, length), bOffset)
    const matches = exports.countMatches(aOffset, bOffset, length)
    const identity = exports.identityPercentage(matches, length) as number
    return { matches, identity, length }
  }
  return { scorePair }
})()

const calculatePairwiseIdentity = async (a: string, b: string) => {
  const wasm = await wasmModulePromise
  return wasm.scorePair(a, b)
}

const computeDotPlot = (reference: string, query: string, window = 10) => {
  const ref = reference.toUpperCase()
  const qry = query.toUpperCase()
  const results: Array<{ x: number; y: number; score: number }> = []
  for (let i = 0; i < ref.length - window; i += window) {
    const segment = ref.slice(i, i + window)
    for (let j = 0; j < qry.length - window; j += window) {
      const matches = segment
        .split('')
        .reduce((acc, char, idx) => (char === qry[j + idx] ? acc + 1 : acc), 0)
      results.push({ x: i, y: j, score: matches / window })
    }
  }
  return results
}

const analysisApi = {
  gc(content: string, window: number) {
    return calculateGcContent(content, window)
  },
  translate(sequence: string, frame: number) {
    return translateDNA(sequence, frame)
  },
  orfs(sequence: string, minLength: number) {
    return findOrfs(sequence, minLength)
  },
  pairwiseIdentity(a: string, b: string) {
    return calculatePairwiseIdentity(a, b)
  },
  dotPlot(reference: string, query: string, window: number) {
    return computeDotPlot(reference, query, window)
  },
}

Comlink.expose(analysisApi)
