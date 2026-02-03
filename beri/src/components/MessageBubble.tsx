import { useState } from 'react'
import type { Message } from '@/types'

interface Props {
  message: Message
}

/**
 * Individual message bubble component
 */
export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const [showContext, setShowContext] = useState(false)
  const formattedTime = message.timestamp.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
    >
      <div
        className={`
          max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-md
          ${
            isUser
              ? 'bg-habs-navy text-white rounded-br-md'
              : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
          }
        `}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-habs-gold animate-pulse" />
          )}
        </div>

        {/* Sources (for assistant messages) */}
        {!isUser && message.sources && message.sources.length > 0 && !message.isStreaming && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-2">Sources:</p>
            <ul className="space-y-1">
              {message.sources.map((source, index) => (
                <li
                  key={index}
                  className="text-xs text-habs-navy/70 flex items-start gap-1"
                >
                  <span className="text-habs-gold">•</span>
                  <span>
                    {source.source} — {source.section}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Context chunks toggle (for assistant messages) */}
        {!isUser && message.contextChunks && message.contextChunks.length > 0 && !message.isStreaming && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => setShowContext(!showContext)}
              className="text-xs font-semibold text-habs-navy/60 hover:text-habs-navy transition-colors flex items-center gap-1"
            >
              <svg
                className={`w-3 h-3 transition-transform ${showContext ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              View context used ({message.contextChunks.length} chunks)
            </button>

            {showContext && (
              <div className="mt-2 space-y-3">
                {message.contextChunks.map((chunk, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-habs-navy">
                        {chunk.source} — {chunk.section}
                      </span>
                      <span className="text-xs text-gray-400">
                        {(chunk.score * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p
          className={`text-xs mt-2 ${
            isUser ? 'text-white/60' : 'text-gray-400'
          }`}
        >
          {formattedTime}
        </p>
      </div>
    </div>
  )
}
