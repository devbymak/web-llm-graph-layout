import { CreateMLCEngine, MLCEngine, InitProgressReport, prebuiltAppConfig } from "@mlc-ai/web-llm"
import { GraphData } from "../types"

const MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC"

const BASE_SYSTEM_PROMPT = `You are a graph layout engine. Given nodes and edges in JSON, assign pixel coordinates to each node.

COORDINATE SYSTEM:
- x and y are pixel values: 0, 200, 400, 600, 800, etc.
- Minimum spacing between any two nodes: 200 pixels horizontally, 150 pixels vertically

RULES:
- Analyze the edges to understand node relationships
- Position nodes so the graph is easy to read with minimal edge crossings
- NO two nodes can overlap - every node must be at least 200px apart horizontally or 150px apart vertically
- Related nodes (connected by edges) should be positioned near each other
- Use the full coordinate range needed to avoid overlaps

EXAMPLE COORDINATE SCALE:
Node positions should look like: {"x": 0, "y": 0}, {"x": 200, "y": 150}, {"x": 400, "y": 0}, {"x": 600, "y": 300}

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

const getLocalModelUrl = () => {
  const base = `${window.location.origin}/webllm-models/${MODEL_ID}/resolve/main/`
  return base
}

const getAppConfig = () => {
  const prebuiltModel = prebuiltAppConfig.model_list.find(m => m.model_id === MODEL_ID)

  if (!prebuiltModel) {
    throw new Error(`[WebLLM] Model not found in prebuiltAppConfig: ${MODEL_ID}`)
  }

  return {
    ...prebuiltAppConfig,
    model_list: [{
      ...prebuiltModel,
      model: getLocalModelUrl(),
    }],
  }
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
  customTemplate?: string
): Promise<GraphData> => {
  const engine = await initializeEngine(onProgress)

  const userMessage = JSON.stringify(graphData, null, 2)
  const systemPrompt = buildSystemPrompt(customTemplate)

  try {
    const response = await engine.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error("No response from WebLLM")
    }

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

    const validatedData: GraphData = {
      ...layoutedData,
      nodes: layoutedData.nodes.map((node, index) => ({
        ...node,
        position: node.position || {
          x: (index % 4) * 300,
          y: Math.floor(index / 4) * 150,
        },
      })),
    }

    return validatedData
  } catch (error) {
    console.error("Layout generation failed:", error)
    throw error
  }
}

export const resetEngine = async (): Promise<void> => {
  if (engineInstance) {
    await engineInstance.resetChat()
  }
}
