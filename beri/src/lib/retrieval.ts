/**
 * Retrieval layer for semantic search
 */

import type { ScoredChunk, MessageSource } from '@/types'
import { embed } from './embeddings'
import { getAllChunks } from './storage'
import { TOP_K_CHUNKS, SIMILARITY_THRESHOLD } from './constants'

/**
 * Calculate cosine similarity between two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns Similarity score between -1 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
  if (magnitude === 0) return 0

  return dotProduct / magnitude
}

/**
 * Retrieve the most relevant chunks for a query
 * @param query - The user's question
 * @param precomputedEmbedding - Optional pre-computed embedding to avoid re-embedding
 * @returns Top-K most relevant chunks with scores
 */
export async function retrieveContext(query: string, precomputedEmbedding?: number[]): Promise<ScoredChunk[]> {
  // Use pre-computed embedding if provided, otherwise generate one
  const queryEmbedding = precomputedEmbedding || await embed(query)

  // Get all chunks from storage
  const chunks = await getAllChunks()

  if (chunks.length === 0) {
    console.warn('No chunks in storage!')
    return []
  }

  // Score all chunks
  const scoredChunks: ScoredChunk[] = chunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }))

  // Sort by score (highest first)
  const sortedChunks = scoredChunks.sort((a, b) => b.score - a.score)

  // Log top scores for debugging
  console.log('Top chunk scores:', sortedChunks.slice(0, 5).map(c => ({
    source: c.metadata.source,
    section: c.metadata.section,
    score: c.score.toFixed(3)
  })))

  // Filter by threshold and take top K
  const relevantChunks = sortedChunks
    .filter((chunk) => chunk.score >= SIMILARITY_THRESHOLD)
    .slice(0, TOP_K_CHUNKS)

  // If no chunks pass threshold, take top 2 anyway (fallback)
  if (relevantChunks.length === 0 && sortedChunks.length > 0) {
    console.log('No chunks passed threshold, using top 2 as fallback')
    return sortedChunks.slice(0, 2)
  }

  return relevantChunks
}

/**
 * Format retrieved chunks into a context string for the LLM
 * Uses a simple format optimised for small language models
 * @param chunks - The retrieved chunks
 * @returns Formatted context string
 */
export function formatContext(chunks: ScoredChunk[]): string {
  if (chunks.length === 0) {
    return 'No relevant policy information found. Tell the user to check with a member of staff.'
  }

  // Simple, clean format for small models
  return chunks
    .map((chunk) => {
      return `From ${chunk.metadata.source} (${chunk.metadata.section}):\n${chunk.content}`
    })
    .join('\n\n')
}

/**
 * Extract unique sources from retrieved chunks
 * @param chunks - The retrieved chunks
 * @returns Array of unique source citations
 */
export function extractSources(chunks: ScoredChunk[]): MessageSource[] {
  const seen = new Set<string>()
  const sources: MessageSource[] = []

  for (const chunk of chunks) {
    const key = `${chunk.metadata.source}|${chunk.metadata.section}`
    if (!seen.has(key)) {
      seen.add(key)
      sources.push({
        source: chunk.metadata.source,
        section: chunk.metadata.section,
      })
    }
  }

  return sources
}
