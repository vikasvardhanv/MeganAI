import { MODEL_REGISTRY, TASK_MODEL_MAP, getModelsForTask } from "./model-registry"
import { AnthropicProvider } from "./providers/anthropic"
import { OpenAIProvider } from "./providers/openai"
import { GoogleProvider } from "./providers/google"
import { ImageProvider } from "./providers/image"

export interface RouterConfig {
    preferCost?: boolean
    preferSpeed?: boolean
    preferQuality?: boolean
    maxBudgetPerTask?: number
}

export interface RouteResult {
    model: string
    provider: string
    response: any
    tokensUsed?: number
    cost?: number
    latencyMs?: number
}

export class ModelRouter {
    private providers: Map<string, any> = new Map()
    private availability: Map<string, boolean> = new Map()
    public apiKeys: Record<string, string> // Changed from private to public

    constructor(apiKeys: Record<string, string>) {
        this.apiKeys = apiKeys
        this.initializeProviders()
    }

    private initializeProviders() {
        if (this.apiKeys.ANTHROPIC_API_KEY) {
            this.providers.set("anthropic", new AnthropicProvider(this.apiKeys.ANTHROPIC_API_KEY))
            this.availability.set("claude-opus-4", true)
            this.availability.set("claude-sonnet-4", true)
        }

        if (this.apiKeys.OPENAI_API_KEY) {
            this.providers.set("openai", new OpenAIProvider(this.apiKeys.OPENAI_API_KEY))
            this.availability.set("gpt-4o", true)
            this.availability.set("gpt-4-turbo", true)
            this.availability.set("gpt-4o-mini", true)
            this.availability.set("dall-e-3", true)
        }

        if (this.apiKeys.GOOGLE_AI_API_KEY) {
            this.providers.set("google", new GoogleProvider(this.apiKeys.GOOGLE_AI_API_KEY))
            this.availability.set("gemini-2.0-flash", true)
            this.availability.set("gemini-1.5-pro", true)
        }

        if (this.apiKeys.STABILITY_API_KEY) {
            this.providers.set("stability", new ImageProvider(this.apiKeys.STABILITY_API_KEY, "stability"))
            this.availability.set("stable-diffusion-xl", true)
        }

        if (this.apiKeys.IDEOGRAM_API_KEY) {
            this.providers.set("ideogram", new ImageProvider(this.apiKeys.IDEOGRAM_API_KEY, "ideogram"))
            this.availability.set("ideogram", true)
        }
    }

    getAvailableModels(): string[] {
        return Array.from(this.availability.entries())
            .filter(([_, available]) => available)
            .map(([model]) => model)
    }

    async route(
        task: string,
        prompt: string,
        config: RouterConfig = {}
    ): Promise<RouteResult> {
        const startTime = Date.now()

        // Get model candidates for this task
        const { primary, fallbacks } = getModelsForTask(task)

        // Select best available model
        const selectedModel = this.selectBestModel(primary, fallbacks, config)

        if (!selectedModel) {
            throw new Error(`No available model for task "${task}". Available: ${this.getAvailableModels().join(", ")}`)
        }

        console.log(`[Router] Task: ${task} → Model: ${selectedModel}`)

        // Execute with selected model
        const response = await this.execute(selectedModel, prompt)

        const latencyMs = Date.now() - startTime
        const modelConfig = MODEL_REGISTRY[selectedModel]

        return {
            model: selectedModel,
            provider: modelConfig.provider,
            response,
            latencyMs,
        }
    }

    private selectBestModel(
        primary: string,
        fallbacks: string[],
        config: RouterConfig
    ): string | null {
        const candidates = [primary, ...fallbacks]
        const available = candidates.filter(m => this.availability.get(m))

        if (available.length === 0) return null

        if (config.preferCost) {
            available.sort((a, b) => {
                const costA = MODEL_REGISTRY[a]?.costPer1kTokens || 0
                const costB = MODEL_REGISTRY[b]?.costPer1kTokens || 0
                return costA - costB
            })
            return available[0]
        }

        if (config.preferSpeed) {
            const fast = available.find(m =>
                MODEL_REGISTRY[m]?.strengths.includes("fast") ||
                MODEL_REGISTRY[m]?.strengths.includes("speed")
            )
            if (fast) return fast
        }

        return available[0]
    }

    private async execute(model: string, prompt: string): Promise<any> {
        const modelConfig = MODEL_REGISTRY[model]
        if (!modelConfig) {
            throw new Error(`Unknown model: ${model}`)
        }

        const provider = this.providers.get(modelConfig.provider)
        if (!provider) {
            throw new Error(`Provider not initialized: ${modelConfig.provider}`)
        }

        return provider.generate(modelConfig.id, prompt)
    }

    async *routeStream(
        task: string,
        prompt: string,
        config: RouterConfig = {}
    ): AsyncGenerator<{ chunk: string; model: string }> {
        const { primary, fallbacks } = getModelsForTask(task)
        const selectedModel = this.selectBestModel(primary, fallbacks, config)

        if (!selectedModel) {
            throw new Error(`No available model for task "${task}"`)
        }

        const modelConfig = MODEL_REGISTRY[selectedModel]
        const provider = this.providers.get(modelConfig.provider)

        if (!provider.generateStream) {
            const response = await provider.generate(modelConfig.id, prompt)
            yield { chunk: response, model: selectedModel }
            return
        }

        for await (const chunk of provider.generateStream(modelConfig.id, prompt)) {
            yield { chunk, model: selectedModel }
        }
    }
}
