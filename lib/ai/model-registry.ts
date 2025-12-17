export interface ModelConfig {
    id: string
    provider: "anthropic" | "openai" | "google" | "stability" | "ideogram"
    strengths: string[]
    weaknesses: string[]
    costPer1kTokens: number
    maxTokens: number
    supportsImages?: boolean
    supportsStreaming?: boolean
    type: "text" | "image"
}

export const MODEL_REGISTRY: Record<string, ModelConfig> = {
    // ============ ANTHROPIC MODELS ============
    "claude-opus-4": {
        id: "claude-opus-4-20250514", // Hypothetical future model
        provider: "anthropic",
        strengths: ["reasoning", "planning", "complex-analysis", "long-context", "code-review"],
        weaknesses: ["speed", "cost"],
        costPer1kTokens: 0.015,
        maxTokens: 200000,
        supportsImages: true,
        supportsStreaming: true,
        type: "text",
    },
    "claude-sonnet-4": {
        id: "claude-sonnet-4-20250514",
        provider: "anthropic",
        strengths: ["code-generation", "balanced", "fast", "api-design", "database-schema"],
        weaknesses: ["creative-writing"],
        costPer1kTokens: 0.003,
        maxTokens: 200000,
        supportsImages: true,
        supportsStreaming: true,
        type: "text",
    },

    // ============ OPENAI MODELS ============
    "gpt-4o": {
        id: "gpt-4o",
        provider: "openai",
        strengths: ["creativity", "ui-design", "visual-understanding", "css-styling", "fast"],
        weaknesses: ["long-context", "cost"],
        costPer1kTokens: 0.005,
        maxTokens: 128000,
        supportsImages: true,
        supportsStreaming: true,
        type: "text",
    },
    "gpt-4-turbo": {
        id: "gpt-4-turbo",
        provider: "openai",
        strengths: ["code", "general-purpose", "reliability"],
        weaknesses: ["cost", "speed"],
        costPer1kTokens: 0.01,
        maxTokens: 128000,
        supportsImages: true,
        supportsStreaming: true,
        type: "text",
    },
    "gpt-4o-mini": {
        id: "gpt-4o-mini",
        provider: "openai",
        strengths: ["fast", "cheap", "simple-tasks"],
        weaknesses: ["complex-reasoning", "long-context"],
        costPer1kTokens: 0.00015,
        maxTokens: 128000,
        supportsImages: true,
        supportsStreaming: true,
        type: "text",
    },

    // ============ GOOGLE MODELS ============
    "gemini-2.0-flash": {
        id: "gemini-2.0-flash", // Hype model
        provider: "google",
        strengths: ["speed", "cost", "multimodal", "simple-edits"],
        weaknesses: ["complex-reasoning", "creativity"],
        costPer1kTokens: 0.0001,
        maxTokens: 1000000,
        supportsImages: true,
        supportsStreaming: true,
        type: "text",
    },
    "gemini-1.5-pro": {
        id: "gemini-1.5-pro",
        provider: "google",
        strengths: ["long-context", "multimodal", "balanced", "cost-effective"],
        weaknesses: ["creativity", "nuanced-writing"],
        costPer1kTokens: 0.00125,
        maxTokens: 2000000,
        supportsImages: true,
        supportsStreaming: true,
        type: "text",
    },

    // ============ IMAGE MODELS ============
    "dall-e-3": {
        id: "dall-e-3",
        provider: "openai",
        strengths: ["photorealistic", "text-in-images", "consistency", "illustrations"],
        weaknesses: ["3d-icons", "logos"],
        costPer1kTokens: 0, // Per-image pricing
        maxTokens: 0,
        type: "image",
    },
    "stable-diffusion-xl": {
        id: "stable-diffusion-xl-1024-v1-0",
        provider: "stability",
        strengths: ["artistic", "customizable", "open-source", "styles"],
        weaknesses: ["text-in-images", "consistency"],
        costPer1kTokens: 0,
        maxTokens: 0,
        type: "image",
    },
    "ideogram": {
        id: "ideogram-v2",
        provider: "ideogram",
        strengths: ["3d-icons", "logos", "text-rendering", "clean-vectors"],
        weaknesses: ["photorealistic", "complex-scenes"],
        costPer1kTokens: 0,
        maxTokens: 0,
        type: "image",
    },
}

// Task to model mapping with fallback chains
export const TASK_MODEL_MAP: Record<string, {
    primary: string
    fallbacks: string[]
    reason: string
}> = {
    // ============ PLANNING & ARCHITECTURE ============
    "architecture-planning": {
        primary: "claude-opus-4",
        fallbacks: ["gpt-4-turbo", "gemini-1.5-pro"],
        reason: "Needs deep reasoning and system design thinking"
    },
    "tech-stack-selection": {
        primary: "claude-opus-4",
        fallbacks: ["gpt-4-turbo", "claude-sonnet-4"],
        reason: "Requires understanding of trade-offs"
    },

    // ============ UI & DESIGN ============
    "ui-component-design": {
        primary: "gpt-4o",
        fallbacks: ["claude-sonnet-4", "gemini-1.5-pro"],
        reason: "GPT-4o excels at creative, visual-first tasks"
    },
    "css-styling": {
        primary: "gpt-4o",
        fallbacks: ["claude-sonnet-4", "gpt-4-turbo"],
        reason: "Strong at aesthetic decisions and modern CSS"
    },
    "color-palette": {
        primary: "gpt-4o",
        fallbacks: ["claude-sonnet-4"],
        reason: "Creative color combinations"
    },
    "animation-design": {
        primary: "gpt-4o",
        fallbacks: ["claude-sonnet-4"],
        reason: "Visual creativity for motion design"
    },

    // ============ BACKEND & LOGIC ============
    "api-generation": {
        primary: "claude-sonnet-4",
        fallbacks: ["gpt-4-turbo", "gemini-1.5-pro"],
        reason: "Claude excels at structured, reliable code generation"
    },
    "database-schema": {
        primary: "claude-sonnet-4",
        fallbacks: ["gpt-4-turbo", "claude-opus-4"],
        reason: "Best at complex relational logic and SQL"
    },
    "auth-logic": {
        primary: "claude-sonnet-4",
        fallbacks: ["gpt-4-turbo"],
        reason: "Security-sensitive, needs precision"
    },
    "validation-logic": {
        primary: "claude-sonnet-4",
        fallbacks: ["gpt-4-turbo", "gemini-1.5-pro"],
        reason: "Thorough edge case handling"
    },

    // ============ INTEGRATION & REVIEW ============
    "code-review": {
        primary: "claude-opus-4",
        fallbacks: ["gpt-4-turbo", "claude-sonnet-4"],
        reason: "Needs thorough analysis and bug detection"
    },
    "conflict-resolution": {
        primary: "claude-opus-4",
        fallbacks: ["gpt-4-turbo"],
        reason: "Complex reasoning to merge code from multiple agents"
    },
    "final-assembly": {
        primary: "claude-opus-4",
        fallbacks: ["gpt-4-turbo", "claude-sonnet-4"],
        reason: "Ensures everything works together"
    },

    // ============ IMAGE GENERATION ============
    "icon-generation": {
        primary: "ideogram",
        fallbacks: ["dall-e-3", "stable-diffusion-xl"],
        reason: "Best for clean, 3D-style icons and logos"
    },
    "illustration-generation": {
        primary: "dall-e-3",
        fallbacks: ["stable-diffusion-xl", "ideogram"],
        reason: "Consistent, high-quality illustrations"
    },
    "hero-image": {
        primary: "dall-e-3",
        fallbacks: ["stable-diffusion-xl"],
        reason: "Photorealistic, attention-grabbing images"
    },

    // ============ QUICK/CHEAP TASKS ============
    "simple-edits": {
        primary: "gemini-2.0-flash",
        fallbacks: ["gpt-4o-mini", "claude-sonnet-4"],
        reason: "Fast and cheap for simple changes"
    },
    "typo-fixes": {
        primary: "gemini-2.0-flash",
        fallbacks: ["gpt-4o-mini"],
        reason: "Simple task, prioritize speed"
    },
    "format-code": {
        primary: "gemini-2.0-flash",
        fallbacks: ["gpt-4o-mini"],
        reason: "Mechanical task, use cheapest option"
    },
}

export function getModelsForTask(task: string): { primary: string; fallbacks: string[] } {
    const mapping = TASK_MODEL_MAP[task]
    if (!mapping) {
        return {
            primary: "claude-sonnet-4",
            fallbacks: ["gpt-4-turbo", "gemini-1.5-pro"]
        }
    }
    return mapping
}
