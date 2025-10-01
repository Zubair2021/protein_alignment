import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { type AlignmentRecord, type SequenceRecord, type WorkspaceSnapshot } from '@/types'

interface HelixCanvasDB extends DBSchema {
  sequences: {
    key: string
    value: SequenceRecord
  }
  alignments: {
    key: string
    value: AlignmentRecord
  }
  workspaces: {
    key: string
    value: WorkspaceSnapshot
  }
}

const DB_NAME = 'helixcanvas'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<HelixCanvasDB>> | null = null

export const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB<HelixCanvasDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('sequences')) {
          database.createObjectStore('sequences')
        }
        if (!database.objectStoreNames.contains('alignments')) {
          database.createObjectStore('alignments')
        }
        if (!database.objectStoreNames.contains('workspaces')) {
          database.createObjectStore('workspaces')
        }
      },
    })
  }
  return dbPromise
}

export const persistSequence = async (sequence: SequenceRecord) => {
  const db = await getDb()
  await db.put('sequences', sequence, sequence.id)
}

export const deleteSequence = async (id: string) => {
  const db = await getDb()
  await db.delete('sequences', id)
}

export const listSequences = async () => {
  const db = await getDb()
  return db.getAll('sequences')
}

export const persistAlignment = async (alignment: AlignmentRecord) => {
  const db = await getDb()
  await db.put('alignments', alignment, alignment.id)
}

export const listAlignments = async () => {
  const db = await getDb()
  return db.getAll('alignments')
}

export const persistWorkspace = async (snapshot: WorkspaceSnapshot) => {
  const db = await getDb()
  await db.put('workspaces', snapshot, snapshot.id)
}

export const loadWorkspace = async (id: string) => {
  const db = await getDb()
  return db.get('workspaces', id)
}

export const deleteAlignment = async (id: string) => {
  const db = await getDb()
  await db.delete('alignments', id)
}
