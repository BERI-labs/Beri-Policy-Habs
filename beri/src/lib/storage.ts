/**
 * IndexedDB storage layer for BERI
 */

import { openDB, type IDBPDatabase } from 'idb'
import type { Chunk } from '@/types'
import { DB_NAME, DB_VERSION, CHUNKS_STORE } from './constants'
import chunksData from '@/data/chunks.json'

let db: IDBPDatabase | null = null

// Version key to track when embeddings need regeneration
const EMBEDDINGS_VERSION_KEY = 'beri-embeddings-version'
const CURRENT_EMBEDDINGS_VERSION = '3' // Increment when chunks change

/**
 * Initialise IndexedDB storage
 */
export async function initStorage(): Promise<void> {
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(CHUNKS_STORE)) {
        database.createObjectStore(CHUNKS_STORE, { keyPath: 'id' })
      }
    },
  })
}

/**
 * Check if embeddings need to be regenerated
 */
export function needsEmbeddingRegeneration(): boolean {
  const storedVersion = localStorage.getItem(EMBEDDINGS_VERSION_KEY)
  return storedVersion !== CURRENT_EMBEDDINGS_VERSION
}

/**
 * Mark embeddings as regenerated
 */
function markEmbeddingsRegenerated(): void {
  localStorage.setItem(EMBEDDINGS_VERSION_KEY, CURRENT_EMBEDDINGS_VERSION)
}

/**
 * Load chunks from bundled JSON into IndexedDB with real embeddings
 * @param generateEmbedding - Function to generate embeddings using the model
 * @param onProgress - Progress callback
 */
export async function loadChunksFromJSON(
  generateEmbedding: (text: string) => Promise<number[]>,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (!db) {
    throw new Error('Storage not initialised')
  }

  const rawChunks = chunksData as Array<{
    id: string
    content: string
    metadata: { source: string; section: string; chunkIndex: number }
  }>

  // Clear existing chunks
  const clearTx = db.transaction(CHUNKS_STORE, 'readwrite')
  await clearTx.objectStore(CHUNKS_STORE).clear()
  await clearTx.done

  // Generate real embeddings for each chunk
  const total = rawChunks.length
  for (let i = 0; i < rawChunks.length; i++) {
    const raw = rawChunks[i]
    onProgress?.(i + 1, total)

    // Generate embedding using the actual model
    const embedding = await generateEmbedding(raw.content)

    const chunk: Chunk = {
      id: raw.id,
      content: raw.content,
      embedding,
      metadata: raw.metadata,
    }

    // Add to store
    const addTx = db.transaction(CHUNKS_STORE, 'readwrite')
    await addTx.objectStore(CHUNKS_STORE).add(chunk)
    await addTx.done
  }

  // Mark as regenerated
  markEmbeddingsRegenerated()
}

/**
 * Get all chunks from storage
 */
export async function getAllChunks(): Promise<Chunk[]> {
  if (!db) {
    throw new Error('Storage not initialised')
  }

  return db.getAll(CHUNKS_STORE)
}

/**
 * Check if chunks are already loaded with valid embeddings
 */
export async function hasChunks(): Promise<boolean> {
  if (!db) {
    throw new Error('Storage not initialised')
  }

  // If embeddings version changed, we need to regenerate
  if (needsEmbeddingRegeneration()) {
    return false
  }

  const count = await db.count(CHUNKS_STORE)
  return count > 0
}
