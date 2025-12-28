import { CreateMLCEngine, MLCEngine, InitProgressReport, prebuiltAppConfig } from "@mlc-ai/web-llm"
import { GraphData, GraphNode } from "../types"

const MIN_DISTANCE = 200
const NUDGE_STEP = 50
const MAX_ITERATIONS = 100

const getDistance = (a: { x: number, y: number }, b: { x: number, y: number }): number => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

const resolveOverlaps = (nodes: GraphNode[]): GraphNode[] => {
  const result = nodes.map(node => ({
    ...node,
    position: node.position ? { ...node.position } : { x: 0, y: 0 }
  }))

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    let hasOverlap = false

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const posA = result[i].position!
        const posB = result[j].position!
        const distance = getDistance(posA, posB)

        if (distance < MIN_DISTANCE) {
          hasOverlap = true
          
          const dx = posB.x - posA.x
          const dy = posB.y - posA.y
          const len = distance || 1
          
          const nudgeX = (dx / len) * NUDGE_STEP
          const nudgeY = (dy / len) * NUDGE_STEP

          if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
            result[j].position!.x += NUDGE_STEP
            result[j].position!.y += NUDGE_STEP
          } else {
            result[j].position!.x += nudgeX
            result[j].position!.y += nudgeY
          }
        }
      }
    }

    if (!hasOverlap) break
  }

  return result
}

const MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC"

const BASE_SYSTEM_PROMPT = `You are a graph layout engine. Given nodes and edges in JSON, assign pixel coordinates to each node.

COORDINATE SYSTEM:
- x and y are pixel values
- Each node position must be at least 250 pixels away from every other node (measure from center to center)
- Distribute nodes across a wide area: use coordinates ranging from 0 to 800+ for x and 0 to 600+ for y depending on node count

CRITICAL ANTI-OVERLAP RULES:
- Every node MUST have a unique position
- NO two nodes can have similar x AND y coordinates
- If nodes would be close together, spread them out more
- Before outputting, verify that NO two nodes share similar coordinates

LAYOUT RULES:
- Analyze the edges to understand node relationships
- Position nodes so the graph is easy to read with minimal edge crossings
- Related nodes (connected by edges) should be positioned near each other but NOT overlapping

EXAMPLE - 4 nodes properly spaced:
{"x": 0, "y": 0}, {"x": 300, "y": 0}, {"x": 0, "y": 250}, {"x": 300, "y": 250}

EXAMPLE - 5 nodes properly spaced:
{"x": 400, "y": 0}, {"x": 0, "y": 200}, {"x": 800, "y": 200}, {"x": 200, "y": 450}, {"x": 600, "y": 450}

OUTPUT: Return ONLY valid JSON with the same structure as input, but with "position": {"x": number, "y": number} added to each node. No markdown, no explanation.`

const buildSystemPrompt = (customTemplate?: string): string => {
  if (!customTemplate || customTemplate.trim() === '') {
    return BASE_SYSTEM_PROMPT
  }
  
  return `${BASE_SYSTEM_PROMPT}

Additional Custom Rules:
${customTemplate.trim()}`
}

let engineInstance: MLCEngine | null = null
let isLoading = false

export type ProgressCallback = (progress: InitProgressReport) => void
export type StatusCallback = (status: string) => void

const isDev = import.meta.env.DEV

const getLocalModelUrl = () => {
  const base = `${window.location.origin}/webllm-models/${MODEL_ID}/resolve/main/`
  return base
}

const getAppConfig = () => {
  const prebuiltModel = prebuiltAppConfig.model_list.find(m => m.model_id === MODEL_ID)

  if (!prebuiltModel) {
    throw new Error(`[WebLLM] Model not found in prebuiltAppConfig: ${MODEL_ID}`)
  }

  if (isDev) {
    console.log("[WebLLM] Dev mode: loading model from local files")
    return {
      ...prebuiltAppConfig,
      model_list: [{
        ...prebuiltModel,
        model: getLocalModelUrl(),
      }],
    }
  }

  console.log("[WebLLM] Production mode: loading model from CDN")
  return prebuiltAppConfig
}

export const initializeEngine = async (onProgress?: ProgressCallback): Promise<MLCEngine> => {
  if (engineInstance) {
    return engineInstance
  }

  if (isLoading) {
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (engineInstance) {
      return engineInstance
    }
  }

  isLoading = true

  try {
    engineInstance = await CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (report) => {
        console.log(`[WebLLM] ${report.text}`)
        onProgress?.(report)
      },
      logLevel: "INFO",
      appConfig: getAppConfig(),
    })

    return engineInstance
  } finally {
    isLoading = false
  }
}

export const isEngineReady = (): boolean => {
  return engineInstance !== null
}

export const generateLayout = async (
  graphData: GraphData,
  onProgress?: ProgressCallback,
  customTemplate?: string,
  onStatus?: StatusCallback
): Promise<GraphData> => {
  const engine = await initializeEngine(onProgress)

  const userMessage = JSON.stringify(graphData, null, 2)
  const systemPrompt = buildSystemPrompt(customTemplate)

  try {
    onStatus?.("Reading graph structure...")
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    onStatus?.("Analyzing node relationships...")
    
    await new Promise(resolve => setTimeout(resolve, 200))
    
    onStatus?.("Generating layout coordinates...")

    const response = await engine.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    })

    onStatus?.("Processing AI response...")

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error("No response from WebLLM")
    }

    onStatus?.("Parsing layout data...")

    let jsonString = content.trim()
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.slice(7)
    } else if (jsonString.startsWith("```")) {
      jsonString = jsonString.slice(3)
    }
    if (jsonString.endsWith("```")) {
      jsonString = jsonString.slice(0, -3)
    }
    jsonString = jsonString.trim()

    const layoutedData = JSON.parse(jsonString) as GraphData

    onStatus?.("Validating positions...")

    const nodesWithPositions = layoutedData.nodes.map((node, index) => ({
      ...node,
      position: node.position || {
        x: (index % 4) * 300,
        y: Math.floor(index / 4) * 200,
      },
    }))

    onStatus?.("Resolving overlaps...")

    const resolvedNodes = resolveOverlaps(nodesWithPositions)

    const validatedData: GraphData = {
      ...layoutedData,
      nodes: resolvedNodes,
    }

    onStatus?.("Layout complete!")

    return validatedData
  } catch (error) {
    console.error("Layout generation failed:", error)
    onStatus?.("Error occurred")
    throw error
  }
}

export const resetEngine = async (): Promise<void> => {
  if (engineInstance) {
    await engineInstance.resetChat()
  }
}
