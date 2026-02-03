import type { LoadingState } from '@/types'

interface Props {
  loadingState: LoadingState
  onRetry?: () => void
}

/**
 * Loading screen shown during app initialisation
 */
export function LoadingScreen({ loadingState, onRetry }: Props) {
  const isError = loadingState.stage === 'error'
  const logoUrl = `${import.meta.env.BASE_URL}beri-logo.png`

  return (
    <div className="min-h-screen bg-gradient-to-b from-habs-navy to-habs-navy-dark flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
          <img
            src={logoUrl}
            alt="BERI Logo"
            className="h-32 mx-auto mb-4"
          />
          <p className="text-habs-gold text-sm">
            Bespoke Education Retrieval Infrastructure
          </p>
        </div>

        {/* Loading indicator or error */}
        {isError ? (
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 mb-6">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-red-300 mb-4">{loadingState.error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-6 py-2 bg-habs-gold text-habs-navy-dark font-semibold rounded-lg hover:bg-habs-gold-light transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          <div className="mb-6">
            {/* Progress bar */}
            <div className="h-2 bg-habs-navy-light rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-habs-gold transition-all duration-300 ease-out"
                style={{ width: `${loadingState.progress}%` }}
              />
            </div>

            {/* Status message */}
            <p className="text-white/80 text-sm">{loadingState.message}</p>

            {/* Loading spinner */}
            <div className="mt-6">
              <svg
                className="w-8 h-8 mx-auto text-habs-gold animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Browser requirement note */}
        <p className="text-white/50 text-xs">
          BERI requires a WebGPU-compatible browser (Microsoft Edge or Chrome 113+)
        </p>
      </div>
    </div>
  )
}
