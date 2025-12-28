import { useState, useEffect, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
  ConnectionMode,
  ReactFlowProvider,
  NodeChange,
  applyNodeChanges,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { SAMPLES, DEFAULT_SAMPLE_ID } from './constants'
import { GraphData, HistoryItem } from './types'
import { generateLayout, isEngineReady, ProgressCallback, resetEngine } from './services/webllmService'
import Editor from './components/Editor'
import CustomNode from './components/CustomNode'
import { Layout, GitFork, Cpu, Loader2 } from 'lucide-react'

const nodeTypes = {
  literalVar: CustomNode,
  byRefVar: CustomNode,
  obj: CustomNode,
  literalProp: CustomNode,
  byRefProp: CustomNode,
  default: CustomNode,
}

const createInitialNodes = (data: GraphData): Node[] => {
  return data.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position || { x: 0, y: 0 },
    data: {
      label: node.label || node.id,
      type: node.type,
      value: node.value,
      objectType: node.objectType,
    },
  }))
}

const createEdges = (data: GraphData): Edge[] => {
  return data.edges.map((edge, i) => ({
    id: `e-${i}`,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#94a3b8',
    },
    style: { stroke: '#475569', strokeWidth: 1.5 },
  }))
}

const getDefaultSample = () => {
  return SAMPLES.find(s => s.id === DEFAULT_SAMPLE_ID) || SAMPLES[0]
}

const App = () => {
  const defaultSample = getDefaultSample()
  const [selectedSampleId, setSelectedSampleId] = useState<string>(defaultSample.id)
  const [jsonInput, setJsonInput] = useState<string>(JSON.stringify(defaultSample.data, null, 2))
  const [outputHistory, setOutputHistory] = useState<HistoryItem[]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1)
  const [nodes, setNodes] = useState<Node[]>(createInitialNodes(defaultSample.data))
  const [edges, setEdges] = useState<Edge[]>(createEdges(defaultSample.data))
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState<{ text: string; progress: number } | null>(null)
  const [modelReady, setModelReady] = useState(isEngineReady())
  const [customTemplate, setCustomTemplate] = useState<string>(defaultSample.template)

  const handleJsonChange = (val: string) => {
    setJsonInput(val)
    try {
      const parsed = JSON.parse(val) as GraphData
      if (parsed.nodes && parsed.edges) {
        setEdges(createEdges(parsed))
        setNodes(prev => {
          const newNodes = createInitialNodes(parsed)
          return newNodes.map(n => {
            const existing = prev.find(p => p.id === n.id)
            return existing ? { ...n, position: existing.position } : n
          })
        })
        setError(null)
      }
    } catch {
      // Ignore JSON parse errors while typing
    }
  }

  const handleSampleChange = async (sampleId: string) => {
    const sample = SAMPLES.find(s => s.id === sampleId)
    if (!sample) return
    
    await resetEngine()
    setSelectedSampleId(sampleId)
    setJsonInput(JSON.stringify(sample.data, null, 2))
    setCustomTemplate(sample.template)
    setNodes([])
    setEdges([])
    setOutputHistory([])
    setCurrentHistoryIndex(-1)
    setError(null)
  }

  const handleProgress: ProgressCallback = (report) => {
    setLoadingProgress({
      text: report.text,
      progress: report.progress,
    })
  }

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [])

  const handlePrevOutput = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1
      const historyItem = outputHistory[newIndex]
      setCurrentHistoryIndex(newIndex)
      
      const newNodes = createInitialNodes(historyItem.layoutedData)
      const newEdges = createEdges(historyItem.layoutedData)
      setNodes(newNodes)
      setEdges(newEdges)
    }
  }, [currentHistoryIndex, outputHistory])

  const handleNextOutput = useCallback(() => {
    if (currentHistoryIndex < outputHistory.length - 1) {
      const newIndex = currentHistoryIndex + 1
      const historyItem = outputHistory[newIndex]
      setCurrentHistoryIndex(newIndex)
      
      const newNodes = createInitialNodes(historyItem.layoutedData)
      const newEdges = createEdges(historyItem.layoutedData)
      setNodes(newNodes)
      setEdges(newEdges)
    }
  }, [currentHistoryIndex, outputHistory])

  const handleGenerateLayout = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      let graphData: GraphData
      try {
        graphData = JSON.parse(jsonInput)
      } catch {
        throw new Error("Invalid JSON format")
      }

      const layoutedData = await generateLayout(graphData, handleProgress, customTemplate)
      
      setModelReady(true)
      setLoadingProgress(null)

      const newNodes = layoutedData.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.label || node.id,
          type: node.type,
          value: node.value,
          objectType: node.objectType,
        },
      }))

      const newEdges = createEdges(layoutedData)

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        input: jsonInput,
        output: JSON.stringify(layoutedData, null, 2),
        layoutedData,
      }

      setOutputHistory(prev => {
        const newHistory = [...prev, historyItem]
        setCurrentHistoryIndex(newHistory.length - 1)
        return newHistory
      })
      setNodes(newNodes)
      setEdges(newEdges)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      setLoadingProgress(null)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    handleGenerateLayout()
  }, [])

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 font-sans">
        
        {/* Left Panel: Editor */}
        <div className="w-1/3 min-w-[350px] max-w-[600px] h-full flex flex-col z-10 shadow-2xl">
          <div className="bg-slate-900 p-4 border-b border-slate-700 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Cpu className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">Local AI Graph Engine</h1>
              <p className="text-xs text-slate-400">
                In-Browser Layout (Qwen 2.5 Coder)
                {modelReady && (
                  <span className="ml-2 text-emerald-400">● Ready</span>
                )}
              </p>
            </div>
          </div>
          <Editor 
            value={jsonInput} 
            onChange={handleJsonChange} 
            output={currentHistoryIndex >= 0 ? outputHistory[currentHistoryIndex]?.output || '' : ''}
            onGenerate={handleGenerateLayout}
            isGenerating={isGenerating}
            error={error}
            historyLength={outputHistory.length}
            currentIndex={currentHistoryIndex}
            onPrevOutput={handlePrevOutput}
            onNextOutput={handleNextOutput}
            customTemplate={customTemplate}
            onCustomTemplateChange={setCustomTemplate}
            samples={SAMPLES}
            selectedSampleId={selectedSampleId}
            onSampleChange={handleSampleChange}
          />
        </div>

        {/* Right Panel: React Flow or Loading */}
        <div className="flex-1 h-full relative bg-slate-950">
          {!modelReady || isGenerating ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-6 max-w-md px-8">
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-emerald-400 animate-spin" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-slate-200 mb-2">
                    {!modelReady ? 'Loading AI Model...' : 'Generating Layout...'}
                  </h3>
                  {loadingProgress && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-400 mb-3">
                        {loadingProgress.text}
                      </p>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 ease-out"
                          style={{ width: `${loadingProgress.progress * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-emerald-400 font-mono mt-2">
                        {Math.round(loadingProgress.progress * 100)}%
                      </p>
                    </div>
                  )}
                  {!loadingProgress && !modelReady && (
                    <p className="text-sm text-slate-500 mt-2">
                      Preparing the model for first use...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={() => {}}
                connectionMode={ConnectionMode.Loose}
                fitView
                className="bg-slate-950"
                proOptions={{ hideAttribution: true }}
                nodesDraggable={true}
              >
                <Background color="#334155" gap={20} size={1} />
                <Controls className="!bg-slate-800 !border-slate-700 !shadow-xl [&>button]:!border-slate-700 [&>button]:!text-slate-400 [&>button:hover]:!bg-slate-700 [&>button:hover]:!text-white" />
              </ReactFlow>

              {/* Overlay Status/Info */}
              <div className="absolute top-4 right-4 flex gap-4 pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-xl text-xs text-slate-400">
                  <div className="flex items-center gap-2 mb-1">
                    <Layout className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Auto-Layout Active</span>
                  </div>
                  <p>Modify JSON or click Generate to re-calculate.</p>
                </div>
              </div>
              
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-slate-600 text-lg font-medium flex flex-col items-center">
                    <GitFork className="w-12 h-12 mb-4 opacity-50" />
                    <span>No nodes to display</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ReactFlowProvider>
  )
}

export default App
