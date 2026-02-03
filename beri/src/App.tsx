import { useState, useCallback, useEffect } from 'react'
import type { Message, LoadingState, MessageSource } from '@/types'
import { SYSTEM_PROMPT } from '@/lib/constants'
import { initStorage, loadChunksFromJSON, hasChunks } from '@/lib/storage'
import { initEmbeddings, embed } from '@/lib/embeddings'
import { checkWebGPU, initLLM, generate } from '@/lib/llm'
import { retrieveContext, formatContext, extractSources } from '@/lib/retrieval'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Header } from '@/components/Header'
import { ChatContainer } from '@/components/ChatContainer'
import { InputArea } from '@/components/InputArea'

function App() {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    stage: 'checking',
    progress: 0,
    message: 'Checking browser compatibility...',
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const isReady = loadingState.stage === 'ready'

  // Initialisation sequence
  useEffect(() => {
    let cancelled = false

    async function initialise() {
      try {
        // Step 1: Check WebGPU
        setLoadingState({
          stage: 'checking',
          progress: 5,
          message: 'Checking WebGPU support...',
        })

        const hasWebGPU = await checkWebGPU()
        if (!hasWebGPU) {
          setLoadingState({
            stage: 'error',
            progress: 0,
            message: 'WebGPU not available',
            error:
              'WebGPU is required but not available in your browser. Please use Microsoft Edge or Chrome 113+ with WebGPU enabled.',
          })
          return
        }

        if (cancelled) return

        // Step 2: Init storage
        setLoadingState({
          stage: 'storage',
          progress: 10,
          message: 'Initialising storage...',
        })

        await initStorage()

        if (cancelled) return

        // Step 3: Init embeddings FIRST (needed for chunk embedding generation)
        setLoadingState({
          stage: 'embeddings',
          progress: 15,
          message: 'Loading embedding model...',
        })

        await initEmbeddings((progress, message) => {
          if (!cancelled) {
            setLoadingState({
              stage: 'embeddings',
              progress: 15 + Math.round(progress * 0.25), // 15-40%
              message,
            })
          }
        })

        if (cancelled) return

        // Step 4: Load chunks with real embeddings
        const chunksLoaded = await hasChunks()
        if (!chunksLoaded) {
          setLoadingState({
            stage: 'chunks',
            progress: 40,
            message: 'Generating policy embeddings...',
          })

          await loadChunksFromJSON(embed, (current, total) => {
            if (!cancelled) {
              const chunkProgress = 40 + Math.round((current / total) * 20) // 40-60%
              setLoadingState({
                stage: 'chunks',
                progress: chunkProgress,
                message: `Embedding policy ${current}/${total}...`,
              })
            }
          })
        }

        if (cancelled) return

        // Step 5: Init LLM
        setLoadingState({
          stage: 'llm',
          progress: 60,
          message: 'Loading language model...',
        })

        await initLLM((progress, message) => {
          if (!cancelled) {
            setLoadingState({
              stage: 'llm',
              progress: 60 + Math.round(progress * 0.4), // 60-100%
              message,
            })
          }
        })

        if (cancelled) return

        // Ready!
        setLoadingState({
          stage: 'ready',
          progress: 100,
          message: 'Ready to chat!',
        })
      } catch (error) {
        if (!cancelled) {
          console.error('Initialisation error:', error)
          setLoadingState({
            stage: 'error',
            progress: 0,
            message: 'Failed to initialise',
            error:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred during initialisation.',
          })
        }
      }
    }

    initialise()

    return () => {
      cancelled = true
    }
  }, [])

  // Handle retry after error
  const handleRetry = useCallback(() => {
    window.location.reload()
  }, [])

  // Handle sending a message
  const handleSend = useCallback(async (content: string) => {
    if (isStreaming) return

    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }

    // Create placeholder assistant message
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setIsStreaming(true)

    try {
      // Retrieve relevant context
      const chunks = await retrieveContext(content)
      const context = formatContext(chunks)
      const sources: MessageSource[] = extractSources(chunks)

      console.log('Retrieved chunks:', chunks.length, 'Context length:', context.length)

      // Generate response with streaming
      let fullResponse = ''

      await generate(SYSTEM_PROMPT, context, content, (token) => {
        fullResponse += token
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: fullResponse }
              : msg
          )
        )
      })

      // Finalise message with sources
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: fullResponse, sources, isStreaming: false }
            : msg
        )
      )
    } catch (error) {
      console.error('Generation error:', error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content:
                  'Sorry, I encountered an error while generating a response. Please try again.',
                isStreaming: false,
              }
            : msg
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }, [isStreaming])

  // Show loading screen until ready
  if (!isReady) {
    return <LoadingScreen loadingState={loadingState} onRetry={handleRetry} />
  }

  // Main chat interface
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header isReady={isReady} />
      <ChatContainer
        messages={messages}
        onSuggestedQuestion={handleSend}
        isStreaming={isStreaming}
      />
      <InputArea
        onSend={handleSend}
        disabled={isStreaming}
        isLoading={isStreaming}
      />
    </div>
  )
}

export default App
