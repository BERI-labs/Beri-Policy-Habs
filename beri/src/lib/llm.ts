/**
 * LLM layer using WebLLM with Web Worker for non-blocking inference
 */

import * as webllm from '@mlc-ai/web-llm'
import { LLM_MODEL, MAX_TOKENS, TEMPERATURE, CONTEXT_WINDOW_SIZE } from './constants'
import type { ProgressCallback } from '@/types'

// Engine type that works with both regular and worker-based engines
let engine: webllm.MLCEngineInterface | null = null

/**
 * Check if WebGPU is available
 * @returns Whether WebGPU is supported
 */
export async function checkWebGPU(): Promise<boolean> {
  if (!navigator.gpu) {
    return false
  }

  try {
    const adapter = await navigator.gpu.requestAdapter()
    return adapter !== null
  } catch {
    return false
  }
}

/**
 * Initialise the LLM engine using a Web Worker for non-blocking UI
 * @param onProgress - Progress callback for loading updates
 */
export async function initLLM(onProgress?: ProgressCallback): Promise<void> {
  onProgress?.(0, 'Initialising language model...')

  const initProgressCallback = (report: webllm.InitProgressReport) => {
    const progress = Math.round(report.progress * 100)
    onProgress?.(progress, report.text)
  }

  try {
    // Try to create Web Worker engine for non-blocking UI
    const worker = new Worker(
      new URL('./llm.worker.ts', import.meta.url),
      { type: 'module' }
    )

    engine = await webllm.CreateWebWorkerMLCEngine(
      worker,
      LLM_MODEL,
      {
        initProgressCallback,
        logLevel: 'SILENT',
      },
      {
        context_window_size: CONTEXT_WINDOW_SIZE,
      }
    )

    console.log('LLM initialised with Web Worker')
  } catch (workerError) {
    // Fallback to main thread engine if worker fails
    console.warn('Web Worker failed, falling back to main thread:', workerError)

    engine = new webllm.MLCEngine({
      initProgressCallback,
      logLevel: 'SILENT',
    })

    await engine.reload(LLM_MODEL, {
      context_window_size: CONTEXT_WINDOW_SIZE,
    })

    console.log('LLM initialised on main thread (fallback)')
  }

  onProgress?.(100, 'Language model ready')
}

/**
 * Generate a response using the LLM
 * Uses a simple prompt format optimised for small models
 * @param _systemPrompt - The system prompt (unused, kept for API compatibility)
 * @param context - The retrieved context
 * @param query - The user's question
 * @param onToken - Callback for each generated token
 * @returns The complete response
 */
export async function generate(
  _systemPrompt: string,
  context: string,
  query: string,
  onToken?: (token: string) => void
): Promise<string> {
  if (!engine) {
    throw new Error('LLM not initialised')
  }

  // Simple, direct prompt format for small models
  // Putting everything in user message works better than system+user split
  const prompt = `You are BERI, a school policy assistant. Answer the question using ONLY the information below. Be accurate, concise, and precise; use bullet points. Always cite the source policy.

POLICY INFORMATION:
${context}

QUESTION: ${query}

ANSWER:`

  const messages: webllm.ChatCompletionMessageParam[] = [
    { role: 'user', content: prompt },
  ]

  let fullResponse = ''

  const asyncChunkGenerator = await engine.chat.completions.create({
    messages,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    stream: true,
  })

  for await (const chunk of asyncChunkGenerator) {
    const token = chunk.choices[0]?.delta?.content || ''
    if (token) {
      fullResponse += token
      onToken?.(token)
    }
  }

  // Reset chat after each response to avoid context buildup
  await engine.resetChat()

  return fullResponse
}

/**
 * Reset the chat context
 */
export async function resetChat(): Promise<void> {
  if (engine) {
    await engine.resetChat()
  }
}
