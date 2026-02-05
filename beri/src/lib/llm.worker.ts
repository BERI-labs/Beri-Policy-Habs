/**
 * Web Worker for LLM inference
 * Offloads heavy computation from the main thread
 */

import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm'

// Create the worker handler - this handles all messages from main thread
const handler = new WebWorkerMLCEngineHandler()

// Listen for messages from main thread
self.onmessage = (msg: MessageEvent) => {
  handler.onmessage(msg)
}
