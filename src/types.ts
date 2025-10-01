export type SequenceType = 'DNA' | 'RNA' | 'Protein'

export interface Annotation {
  id: string
  sequenceId: string
  name: string
  type: string
  start: number
  end: number
  strand: '+' | '-'
  color: string
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface Feature {
  id: string
  name: string
  type: string
  start: number
  end: number
  strand: '+' | '-'
  color?: string
  notes?: string
}

export interface SequenceRecord {
  id: string
  name: string
  type: SequenceType
  residues: string
  length: number
  circular: boolean
  features: Feature[]
  annotations: Annotation[]
  source?: string
  createdAt: number
  updatedAt: number
}

export interface AlignmentSequence {
  id: string
  name: string
  residues: string
  metadata?: Record<string, string>
}

export type AlignmentFormat = 'FASTA' | 'CLUSTAL' | 'MAF' | 'Stockholm'

export interface AlignmentRecord {
  id: string
  name: string
  format: AlignmentFormat
  type: 'pairwise' | 'multiple'
  sequences: AlignmentSequence[]
  consensus?: string
  createdAt: number
  updatedAt: number
}

export interface Bookmark {
  id: string
  sequenceId: string
  name: string
  position: number
  color: string
}

export interface WorkspaceStateSnapshot {
  activeSequenceId?: string
  activeAlignmentId?: string
  activeTab: WorkspaceTab
  visibleAnnotations: Record<string, boolean>
  theme: 'light' | 'dark'
}

export interface WorkspaceSnapshot extends WorkspaceStateSnapshot {
  id: string
  name: string
  savedAt: number
}

export type WorkspaceTab =
  | 'overview'
  | 'linear-viewer'
  | 'plasmid'
  | 'alignment'
  | 'analysis'

export interface SearchMatch {
  id: string
  label: string
  sequenceId: string
  start: number
  end: number
}

export type ParsedFileResult = {
  sequences: SequenceRecord[]
  alignments: AlignmentRecord[]
}
