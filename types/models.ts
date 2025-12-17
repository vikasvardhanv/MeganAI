// types/models.ts

export type AIProvider = "anthropic" | "openai" | "google" | "stability" | "ideogram"

export interface ModelConfig {
    id: string
    provider: AIProvider
    strengths: string[]
    weaknesses: string[]
    costPer1kTokens: number
    maxTokens: number
    supportsImages?: boolean
    supportsStreaming?: boolean
    type: "text" | "image"
}

export interface TaskModelMapping {
    primary: string
    fallbacks: string[]
    reason: string
}

export interface UserAPIKeys {
    ANTHROPIC_API_KEY?: string
    OPENAI_API_KEY?: string
    GOOGLE_AI_API_KEY?: string
    STABILITY_API_KEY?: string
    IDEOGRAM_API_KEY?: string
}

export interface RouteResult {
    model: string
    provider: AIProvider
    response: any
    tokensUsed?: number
    cost?: number
    latencyMs?: number
}

export interface RouterConfig {
    preferCost?: boolean
    preferSpeed?: boolean
    preferQuality?: boolean
    maxBudgetPerTask?: number
}
