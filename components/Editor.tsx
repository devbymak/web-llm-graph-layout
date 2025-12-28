import { RefreshCw, Play, Download } from 'lucide-react'

interface LoadingProgress {
  text: string
  progress: number
}

interface EditorProps {
  value: string
  onChange: (value: string) => void
  onGenerate: () => void
  isGenerating: boolean
  error: string | null
  loadingProgress: LoadingProgress | null
}

const Editor = ({ value, onChange, onGenerate, isGenerating, error, loadingProgress }: EditorProps) => {
  const isDownloading = loadingProgress && loadingProgress.progress < 1

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <span>Data Input (JSON)</span>
        </h2>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          aria-label={isGenerating ? 'Generating layout' : 'Generate layout'}
          tabIndex={0}
          className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-all ${
            isGenerating
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-emerald-500/25'
          }`}
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          {isGenerating ? (isDownloading ? 'Loading Model...' : 'Calculating...') : 'Generate Layout'}
        </button>
      </div>

      {/* Model Loading Progress */}
      {loadingProgress && (
        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300 truncate flex-1">
              {loadingProgress.text}
            </span>
            <span className="text-xs text-emerald-400 font-mono">
              {Math.round(loadingProgress.progress * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress.progress * 100}%` }}
            />
          </div>
          {loadingProgress.progress < 0.1 && (
            <p className="text-xs text-slate-500 mt-2">
              First-time setup: downloading model (~1GB). This is cached for future use.
            </p>
          )}
        </div>
      )}
      
      <div className="flex-1 relative">
        <textarea
          className="w-full h-full bg-slate-950 text-slate-300 font-mono text-sm p-4 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          aria-label="JSON input for graph data"
        />
        {error && (
          <div 
            className="absolute bottom-4 left-4 right-4 bg-red-900/90 text-red-100 p-3 rounded border border-red-500/50 text-sm shadow-xl backdrop-blur-md"
            role="alert"
          >
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
      <div className="p-2 bg-slate-800 text-xs text-slate-400 border-t border-slate-700">
        Tip: Edit the JSON structure above to change nodes and links, then click Generate.
      </div>
    </div>
  )
}

export default Editor
