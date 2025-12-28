import { CreateMLCEngine, MLCEngine, InitProgressReport, prebuiltAppConfig } from "@mlc-ai/web-llm"
import { GraphData } from "../types"

const MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC"

const SYSTEM_PROMPT = `Act as a React-Flow layout specialist. I will provide a JSON of nodes and links. Your task: Assign each node an {x, y} position on a 100px grid.

Rules:
1. Start Variables (type: "literalVar" or "byRefVar") at x=0.
2. Put Objects (type: "obj") they reference at x=300.
3. Put Properties (type: "literalProp" or "byRefProp") of those objects at x=600.
4. If a property references another object, move that object to x=900.
5. Increase 'y' by 150 for each distinct group to prevent line intersections.
6. Ensure no two nodes have the same {x, y}.
7. Analyze the links to understand relationships between nodes.

Return ONLY valid JSON - the same structure as input but with "position": { "x": number, "y": number } added to each node. No markdown, no explanations.`

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
  onProgress?: ProgressCallback
): Promise<GraphData> => {
  const engine = await initializeEngine(onProgress)

  const userMessage = JSON.stringify(graphData, null, 2)

  try {
    const response = await engine.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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
