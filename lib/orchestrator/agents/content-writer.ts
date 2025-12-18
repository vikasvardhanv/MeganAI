/**
 * Content Writer Agent
 * Generates high-quality content with customizable tone, style, and format
 * Uses intelligent model routing to select the best AI for each task
 */

import { ModelRouter } from "../../ai/router"

export interface ContentSpec {
    type: "article" | "blog" | "documentation" | "email" | "social" | "product" | "landing" | "technical"
    topic: string
    tone?: "professional" | "casual" | "technical" | "friendly" | "authoritative" | "conversational"
    length?: "short" | "medium" | "long" | "custom"
    customWordCount?: number
    keywords?: string[]
    audience?: string
    outline?: string[]
    context?: string
    style?: string
}

export interface ContentResult {
    content: string
    title?: string
    excerpt?: string
    wordCount: number
    readingTime: number
    model: string
    tokensUsed?: number
    latencyMs?: number
}

export interface RewriteOptions {
    preserveTone?: boolean
    targetLength?: "shorter" | "longer" | "same"
    style?: string
    keywords?: string[]
}

export class ContentWriterAgent {
    private router: ModelRouter

    constructor(apiKeys: Record<string, string>) {
        this.router = new ModelRouter(apiKeys)
    }

    /**
     * Generate new content from a specification
     */
    async write(spec: ContentSpec): Promise<ContentResult> {
        const prompt = this.buildWritePrompt(spec)
        const startTime = Date.now()

        const result = await this.router.route("content-writing", prompt)

        const content = result.response
        const wordCount = this.countWords(content)

        return {
            content,
            wordCount,
            readingTime: Math.ceil(wordCount / 200),
            model: result.model,
            tokensUsed: result.tokensUsed,
            latencyMs: Date.now() - startTime
        }
    }

    /**
     * Rewrite existing content with new instructions
     */
    async rewrite(content: string, instructions: string, options?: RewriteOptions): Promise<ContentResult> {
        const prompt = `You are an expert content editor. Rewrite the following content according to these instructions.

INSTRUCTIONS:
${instructions}

${options?.preserveTone ? "IMPORTANT: Preserve the original tone and voice." : ""}
${options?.targetLength === "shorter" ? "IMPORTANT: Make it more concise, reduce length by 30-50%." : ""}
${options?.targetLength === "longer" ? "IMPORTANT: Expand with more detail, increase length by 30-50%." : ""}
${options?.style ? `STYLE: Write in a ${options.style} style.` : ""}
${options?.keywords?.length ? `KEYWORDS TO INCLUDE: ${options.keywords.join(", ")}` : ""}

ORIGINAL CONTENT:
${content}

REWRITTEN CONTENT:`

        const startTime = Date.now()
        const result = await this.router.route("content-rewriting", prompt)

        const rewrittenContent = result.response
        const wordCount = this.countWords(rewrittenContent)

        return {
            content: rewrittenContent,
            wordCount,
            readingTime: Math.ceil(wordCount / 200),
            model: result.model,
            tokensUsed: result.tokensUsed,
            latencyMs: Date.now() - startTime
        }
    }

    /**
     * Summarize content to a shorter form
     */
    async summarize(content: string, options?: { maxWords?: number; style?: "bullet" | "paragraph" | "executive" }): Promise<ContentResult> {
        const styleGuide = {
            bullet: "Use bullet points for key takeaways.",
            paragraph: "Write as a coherent paragraph summary.",
            executive: "Write an executive summary suitable for decision-makers."
        }

        const prompt = `Summarize the following content${options?.maxWords ? ` in approximately ${options.maxWords} words` : ""}.

${options?.style ? styleGuide[options.style] : ""}

CONTENT TO SUMMARIZE:
${content}

SUMMARY:`

        const startTime = Date.now()
        const result = await this.router.route("content-summarization", prompt)

        const summary = result.response
        const wordCount = this.countWords(summary)

        return {
            content: summary,
            wordCount,
            readingTime: Math.ceil(wordCount / 200),
            model: result.model,
            tokensUsed: result.tokensUsed,
            latencyMs: Date.now() - startTime
        }
    }

    /**
     * Expand content with more detail
     */
    async expand(content: string, options?: { targetLength?: number; focusAreas?: string[] }): Promise<ContentResult> {
        const prompt = `Expand the following content with more detail, examples, and depth.

${options?.targetLength ? `TARGET LENGTH: Approximately ${options.targetLength} words.` : "Expand to approximately 2x the original length."}
${options?.focusAreas?.length ? `FOCUS AREAS: Expand particularly on: ${options.focusAreas.join(", ")}` : ""}

Maintain the original tone and message while adding value through:
- More specific examples
- Deeper explanations
- Supporting evidence or data points
- Practical applications

ORIGINAL CONTENT:
${content}

EXPANDED CONTENT:`

        const startTime = Date.now()
        const result = await this.router.route("content-expansion", prompt)

        const expanded = result.response
        const wordCount = this.countWords(expanded)

        return {
            content: expanded,
            wordCount,
            readingTime: Math.ceil(wordCount / 200),
            model: result.model,
            tokensUsed: result.tokensUsed,
            latencyMs: Date.now() - startTime
        }
    }

    /**
     * Generate multiple content variations
     */
    async generateVariations(content: string, count: number = 3): Promise<ContentResult[]> {
        const prompt = `Generate ${count} different variations of the following content. 
Each variation should:
- Convey the same core message
- Use different wording and structure
- Have a slightly different angle or emphasis

Separate each variation with "---VARIATION---"

ORIGINAL CONTENT:
${content}

VARIATIONS:`

        const startTime = Date.now()
        const result = await this.router.route("content-rewriting", prompt)

        const variations = result.response.split("---VARIATION---")
            .map((v: string) => v.trim())
            .filter((v: string) => v.length > 0)

        return variations.map((variation: string) => ({
            content: variation,
            wordCount: this.countWords(variation),
            readingTime: Math.ceil(this.countWords(variation) / 200),
            model: result.model,
            latencyMs: Date.now() - startTime
        }))
    }

    /**
     * Generate a title for content
     */
    async generateTitle(content: string, options?: { count?: number; style?: "clickbait" | "seo" | "professional" | "creative" }): Promise<string[]> {
        const styleGuide = {
            clickbait: "Create attention-grabbing, curiosity-inducing titles.",
            seo: "Create SEO-optimized titles with relevant keywords.",
            professional: "Create professional, straightforward titles.",
            creative: "Create creative, memorable, unique titles."
        }

        const count = options?.count || 5

        const prompt = `Generate ${count} compelling titles for the following content.

${options?.style ? styleGuide[options.style] : "Create a mix of styles."}

CONTENT:
${content.substring(0, 2000)}

Return only the titles, one per line, numbered 1-${count}:`

        const result = await this.router.route("meta-generation", prompt)

        return result.response
            .split("\n")
            .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
            .filter((line: string) => line.length > 0)
            .slice(0, count)
    }

    private buildWritePrompt(spec: ContentSpec): string {
        const lengthGuidance = this.getLengthGuidance(spec.length, spec.customWordCount)

        return `You are an expert content writer specializing in ${spec.type} content.

Write high-quality ${spec.type} content with the following specifications:

TOPIC: ${spec.topic}
TONE: ${spec.tone || "professional"}
LENGTH: ${lengthGuidance}
${spec.audience ? `TARGET AUDIENCE: ${spec.audience}` : ""}
${spec.keywords?.length ? `KEYWORDS TO INCLUDE NATURALLY: ${spec.keywords.join(", ")}` : ""}
${spec.context ? `ADDITIONAL CONTEXT: ${spec.context}` : ""}
${spec.style ? `STYLE GUIDE: ${spec.style}` : ""}

${spec.outline?.length ? `FOLLOW THIS OUTLINE:
${spec.outline.map((item, i) => `${i + 1}. ${item}`).join("\n")}` : ""}

REQUIREMENTS:
- Write engaging, valuable content that provides real insight
- Use clear, accessible language appropriate for the audience
- Structure content with proper headings and flow
- Include specific examples and actionable information where appropriate
- Avoid filler content and generic statements

Generate the content now:`
    }

    private getLengthGuidance(length?: string, customWordCount?: number): string {
        if (customWordCount) {
            return `Approximately ${customWordCount} words`
        }

        switch (length) {
            case "short": return "300-500 words (brief, focused)"
            case "long": return "1500-2500 words (comprehensive, detailed)"
            case "custom": return "As appropriate for the topic"
            default: return "800-1200 words (standard article length)"
        }
    }

    private countWords(text: string): number {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length
    }
}
