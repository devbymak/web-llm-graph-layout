import { RefreshCw, Play, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface EditorProps {
  value: string
  onChange: (value: string) => void
  output: string
  onGenerate: () => void
  isGenerating: boolean
  error: string | null
  historyLength: number
  currentIndex: number
  onPrevOutput: () => void
  onNextOutput: () => void
}

const Editor = ({ value, onChange, output, onGenerate, isGenerating, error, historyLength, currentIndex, onPrevOutput, onNextOutput }: EditorProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700">
      {/* Input Section */}
      <div className="flex flex-col flex-1 min-h-0">
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
            {isGenerating ? 'Generating...' : 'Generate Layout'}
          </button>
        </div>
        
        <div className="flex-1 relative min-h-0">
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
      </div>

      {/* Output Section */}
      <div className="flex flex-col flex-1 min-h-0 border-t border-slate-700">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <span>Generated Output (JSON)</span>
          </h2>
          <div className="flex items-center gap-3">
            {historyLength > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onPrevOutput}
                  disabled={currentIndex <= 0}
                  aria-label="Previous output"
                  tabIndex={0}
                  className={`flex items-center justify-center w-8 h-8 rounded font-medium transition-all ${
                    currentIndex <= 0
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-400 font-mono min-w-[60px] text-center">
                  {currentIndex + 1} of {historyLength}
                </span>
                <button
                  onClick={onNextOutput}
                  disabled={currentIndex >= historyLength - 1}
                  aria-label="Next output"
                  tabIndex={0}
                  className={`flex items-center justify-center w-8 h-8 rounded font-medium transition-all ${
                    currentIndex >= historyLength - 1
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {output && (
              <button
                onClick={handleCopy}
                aria-label="Copy output to clipboard"
                tabIndex={0}
                className="flex items-center gap-2 px-3 py-1.5 rounded font-medium transition-all bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 relative min-h-0">
          <textarea
            className="w-full h-full bg-slate-950 text-slate-300 font-mono text-sm p-4 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            value={output}
            readOnly
            spellCheck={false}
            aria-label="Generated JSON output"
          />
          {!output && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-slate-500 text-sm">Generated output will appear here...</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-2 bg-slate-800 text-xs text-slate-400 border-t border-slate-700">
        Tip: Edit the JSON structure above to change nodes and links, then click Generate.
      </div>
    </div>
  )
}

export default Editor
