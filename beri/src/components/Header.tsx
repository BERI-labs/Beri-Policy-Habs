interface Props {
  isReady: boolean
}

/**
 * Application header with logo and status
 */
export function Header({ isReady }: Props) {
  const logoUrl = `${import.meta.env.BASE_URL}beri-logo.svg`

  return (
    <header className="bg-habs-navy border-b border-habs-navy-light px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src={logoUrl}
          alt="BERI Logo"
          className="w-10 h-10"
          onError={(e) => {
            // Show fallback if logo not found
            e.currentTarget.style.display = 'none'
          }}
        />
        <div>
          <h1 className="text-xl font-bold text-white">BERI</h1>
          <p className="text-xs text-habs-gold">Policy Assistant</p>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isReady ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
          }`}
        />
        <span className="text-sm text-white/70">
          {isReady ? 'Ready' : 'Loading...'}
        </span>
      </div>
    </header>
  )
}
