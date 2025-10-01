import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  type AlignmentRecord,
  type Bookmark,
  type SearchMatch,
  type SequenceRecord,
} from '@/types'
import {
  deleteSequence,
  listAlignments,
  listSequences,
  persistAlignment,
  persistSequence,
  deleteAlignment,
} from '@/lib/idb'
import { addConsensusToAlignment } from '@/lib/alignments'

interface SequenceState {
  sequences: SequenceRecord[]
  alignments: AlignmentRecord[]
  bookmarks: Bookmark[]
  searchMatches: SearchMatch[]
  activeSequenceId?: string
  activeAlignmentId?: string
  annotationHistory: Record<string, { past: SequenceRecord['annotations'][]; future: SequenceRecord['annotations'][] }>
  initialized: boolean
  hydrate: () => Promise<void>
  setActiveSequence: (id?: string) => void
  setActiveAlignment: (id?: string) => void
  addSequences: (records: SequenceRecord[]) => Promise<void>
  removeSequence: (id: string) => Promise<void>
  updateSequence: (id: string, update: Partial<SequenceRecord>) => Promise<void>
  addAlignment: (alignment: AlignmentRecord) => Promise<void>
  updateAlignment: (id: string, update: Partial<AlignmentRecord>) => Promise<void>
  removeAlignment: (id: string) => Promise<void>
  addAnnotations: (sequenceId: string, annotations: SequenceRecord['annotations']) => Promise<void>
  updateAnnotation: (sequenceId: string, annotationId: string, update: Partial<SequenceRecord['annotations'][number]>) => Promise<void>
  removeAnnotation: (sequenceId: string, annotationId: string) => Promise<void>
  setSearchMatches: (matches: SearchMatch[]) => void
  addBookmark: (bookmark: Bookmark) => void
  removeBookmark: (id: string) => void
  undoAnnotations: (sequenceId: string) => void
  redoAnnotations: (sequenceId: string) => void
}

export const useSequenceStore = create<SequenceState>()(
  devtools((set, get) => ({
    sequences: [],
    alignments: [],
    bookmarks: [],
    searchMatches: [],
    annotationHistory: {},
    initialized: false,
    async hydrate() {
      const [sequences, alignments] = await Promise.all([listSequences(), listAlignments()])
      set({
        sequences,
        alignments: alignments.map(addConsensusToAlignment),
        initialized: true,
        activeSequenceId: sequences[0]?.id,
        activeAlignmentId: alignments[0]?.id,
      })
    },
    setActiveSequence(id) {
      set({ activeSequenceId: id })
    },
    setActiveAlignment(id) {
      set({ activeAlignmentId: id })
    },
    async addSequences(records) {
      const state = get()
      const merged = [...state.sequences]
      for (const record of records) {
        const index = merged.findIndex((item) => item.id === record.id)
        if (index >= 0) {
          merged[index] = record
        } else {
          merged.push(record)
        }
      }
      set({
        sequences: merged,
        activeSequenceId: merged.at(-1)?.id ?? state.activeSequenceId,
      })
      await Promise.all(records.map((record) => persistSequence(record)))
    },
    async removeSequence(id) {
      await deleteSequence(id)
      const state = get()
      const sequences = state.sequences.filter((sequence) => sequence.id !== id)
      const history = { ...state.annotationHistory }
      delete history[id]
      set({
        sequences,
        annotationHistory: history,
        activeSequenceId: sequences[0]?.id,
      })
    },
    async updateSequence(id, update) {
      const state = get()
      const sequences = state.sequences.map((sequence) =>
        sequence.id === id ? { ...sequence, ...update, updatedAt: Date.now() } : sequence,
      )
      const updated = sequences.find((sequence) => sequence.id === id)
      set({ sequences })
      if (updated) await persistSequence(updated)
    },
    async addAlignment(alignment) {
      const next = [...get().alignments, addConsensusToAlignment(alignment)]
      set({ alignments: next, activeAlignmentId: alignment.id })
      await persistAlignment(alignment)
    },
    async updateAlignment(id, update) {
      const state = get()
      const alignments = state.alignments.map((alignment) =>
        alignment.id === id
          ? addConsensusToAlignment({ ...alignment, ...update, updatedAt: Date.now() })
          : alignment,
      )
      const updated = alignments.find((alignment) => alignment.id === id)
      set({ alignments })
      if (updated) await persistAlignment(updated)
    },
    async removeAlignment(id) {
      const alignments = get().alignments.filter((alignment) => alignment.id !== id)
      set({
        alignments,
        activeAlignmentId: alignments[0]?.id,
      })
      await deleteAlignment(id)
    },
    async addAnnotations(sequenceId, annotations) {
      const state = get()
      const sequences = state.sequences.map((sequence) => {
        if (sequence.id !== sequenceId) return sequence
        return {
          ...sequence,
          annotations: [...sequence.annotations, ...annotations],
          updatedAt: Date.now(),
        }
      })
      const historyEntry = state.annotationHistory[sequenceId] ?? { past: [], future: [] }
      historyEntry.past = [...historyEntry.past, state.sequences.find((seq) => seq.id === sequenceId)?.annotations ?? []]
      historyEntry.future = []
      set({
        sequences,
        annotationHistory: { ...state.annotationHistory, [sequenceId]: historyEntry },
      })
      const updatedSequence = sequences.find((sequence) => sequence.id === sequenceId)
      if (updatedSequence) await persistSequence(updatedSequence)
    },
    async updateAnnotation(sequenceId, annotationId, update) {
      const state = get()
      const sequences = state.sequences.map((sequence) => {
        if (sequence.id !== sequenceId) return sequence
        const index = sequence.annotations.findIndex((annotation) => annotation.id === annotationId)
        if (index === -1) return sequence
        const updatedAnnotations = [...sequence.annotations]
        updatedAnnotations[index] = {
          ...updatedAnnotations[index],
          ...update,
          updatedAt: Date.now(),
        }
        return { ...sequence, annotations: updatedAnnotations, updatedAt: Date.now() }
      })
      const updatedSequence = sequences.find((sequence) => sequence.id === sequenceId)
      const historyEntry = state.annotationHistory[sequenceId] ?? { past: [], future: [] }
      historyEntry.past = [...historyEntry.past, state.sequences.find((seq) => seq.id === sequenceId)?.annotations ?? []]
      historyEntry.future = []
      set({
        sequences,
        annotationHistory: { ...state.annotationHistory, [sequenceId]: historyEntry },
      })
      if (updatedSequence) await persistSequence(updatedSequence)
    },
    async removeAnnotation(sequenceId, annotationId) {
      const state = get()
      const sequences = state.sequences.map((sequence) => {
        if (sequence.id !== sequenceId) return sequence
        return {
          ...sequence,
          annotations: sequence.annotations.filter((annotation) => annotation.id !== annotationId),
          updatedAt: Date.now(),
        }
      })
      const updatedSequence = sequences.find((sequence) => sequence.id === sequenceId)
      const historyEntry = state.annotationHistory[sequenceId] ?? { past: [], future: [] }
      historyEntry.past = [...historyEntry.past, state.sequences.find((seq) => seq.id === sequenceId)?.annotations ?? []]
      historyEntry.future = []
      set({
        sequences,
        annotationHistory: { ...state.annotationHistory, [sequenceId]: historyEntry },
      })
      if (updatedSequence) await persistSequence(updatedSequence)
    },
    setSearchMatches(matches) {
      set({ searchMatches: matches })
    },
    addBookmark(bookmark) {
      set((state) => ({ bookmarks: [...state.bookmarks, bookmark] }))
    },
    removeBookmark(id) {
      set((state) => ({ bookmarks: state.bookmarks.filter((bookmark) => bookmark.id !== id) }))
    },
    undoAnnotations(sequenceId) {
      const state = get()
      const history = state.annotationHistory[sequenceId]
      if (!history?.past.length) return
      const previous = history.past.pop()!
      const currentAnnotations = state.sequences.find((sequence) => sequence.id === sequenceId)?.annotations ?? []
      history.future = [...history.future, currentAnnotations]
      const sequences = state.sequences.map((sequence) =>
        sequence.id === sequenceId ? { ...sequence, annotations: previous, updatedAt: Date.now() } : sequence,
      )
      set({
        sequences,
        annotationHistory: { ...state.annotationHistory, [sequenceId]: history },
      })
    },
    redoAnnotations(sequenceId) {
      const state = get()
      const history = state.annotationHistory[sequenceId]
      if (!history?.future.length) return
      const next = history.future.pop()!
      const currentAnnotations = state.sequences.find((sequence) => sequence.id === sequenceId)?.annotations ?? []
      history.past = [...history.past, currentAnnotations]
      const sequences = state.sequences.map((sequence) =>
        sequence.id === sequenceId ? { ...sequence, annotations: next, updatedAt: Date.now() } : sequence,
      )
      set({
        sequences,
        annotationHistory: { ...state.annotationHistory, [sequenceId]: history },
      })
    },
  })),
)
