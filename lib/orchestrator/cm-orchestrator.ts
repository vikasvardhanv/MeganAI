/**
 * Content Management Orchestrator
 * The intelligent brain that coordinates the entire content lifecycle
 * Automates content creation, optimization, analysis, and delivery
 */

import { Pipeline, PipelineEvent, PipelineResult, createStep, PipelineContext } from "./pipeline"
import { ContentWriterAgent, ContentSpec, ContentResult } from "./agents/content-writer"
import { SEOAgent, SEOOptimization, SEOAnalysis } from "./agents/seo-agent"
import { NLPAgent, TagResult, SentimentResult, Entity } from "./agents/nlp-agent"
import { QualityReviewerAgent, QualityReview } from "./agents/quality-reviewer"
import { UsageTracker, UsageRecord } from "./usage-tracker"

// ============ Types ============

export interface CMConfig {
    apiKeys: Record<string, string>
    brandGuidelines?: string
    styleGuide?: string
    defaultOptions?: ContentOptions
    onUsage?: (record: UsageRecord) => Promise<void>
}

export interface ContentOptions {
    // Processing options
    autoTag?: boolean
    autoSEO?: boolean
    qualityCheck?: boolean
    extractEntities?: boolean
    analyzeSentiment?: boolean

    // Quality thresholds
    minQualityScore?: number  // Skip SEO if quality too low

    // Keywords
    focusKeyword?: string
    secondaryKeywords?: string[]
}

export interface ContentOutput {
    // Core content
    content: string
    title?: string
    excerpt?: string

    // SEO
    metaDescription?: string
    slugSuggestion?: string
    schemaMarkup?: object
    seoScore?: number

    // NLP
    tags?: string[]
    categories?: string[]
    keywords?: string[]
    entities?: Entity[]
    sentiment?: SentimentResult

    // Quality
    qualityScore?: number
    qualityIssues?: number

    // Metadata
    wordCount: number
    readingTime: number
    modelsUsed: string[]
    totalTokens: number
    estimatedCost: number  // in cents

    // Timing
    totalDuration: number
    stepDurations: Record<string, number>
}

export interface AnalysisOutput {
    seo: SEOAnalysis
    quality: QualityReview
    sentiment: SentimentResult
    entities: { entities: Entity[]; model: string }
    keywords: string[]
    tags: TagResult
    readability: any
}

export interface OptimizationOutput {
    originalContent: string
    optimizedContent: string
    seo: SEOOptimization
    qualityImprovement: number
    changes: string[]
    modelsUsed: string[]
}

// ============ Main Orchestrator ============

export class CMOrchestrator {
    private apiKeys: Record<string, string>
    private writerAgent: ContentWriterAgent
    private seoAgent: SEOAgent
    private nlpAgent: NLPAgent
    private reviewerAgent: QualityReviewerAgent
    private usageTracker: UsageTracker
    private brandGuidelines?: string
    private styleGuide?: string
    private defaultOptions: ContentOptions

    constructor(config: CMConfig) {
        this.apiKeys = config.apiKeys
        this.brandGuidelines = config.brandGuidelines
        this.styleGuide = config.styleGuide
        this.defaultOptions = config.defaultOptions || {}

        // Initialize agents
        this.writerAgent = new ContentWriterAgent(config.apiKeys)
        this.seoAgent = new SEOAgent(config.apiKeys)
        this.nlpAgent = new NLPAgent(config.apiKeys)
        this.reviewerAgent = new QualityReviewerAgent(config.apiKeys, {
            brandGuidelines: config.brandGuidelines,
            styleGuide: config.styleGuide
        })

        // Initialize usage tracking
        this.usageTracker = new UsageTracker({ onRecord: config.onUsage })
    }

    // ============ Content Creation ============

    /**
     * Full content creation pipeline with streaming events
     */
    async *createContent(
        spec: ContentSpec,
        options: ContentOptions = {}
    ): AsyncGenerator<PipelineEvent, ContentOutput> {
        const mergedOptions = { ...this.defaultOptions, ...options }
        const stepDurations: Record<string, number> = {}
        let totalTokens = 0

        // Build pipeline
        const pipeline = new Pipeline({ name: "content-creation" })

        // Step 1: Write content
        pipeline.addStep(createStep<ContentSpec, ContentResult>(
            "write",
            "Generate Content",
            async (input) => {
                const result = await this.writerAgent.write(input)
                totalTokens += result.tokensUsed || 0
                return result
            },
            { input: spec }
        ))

        // Step 2: Quality review (optional)
        if (mergedOptions.qualityCheck !== false) {
            pipeline.addStep(createStep<void, QualityReview>(
                "review",
                "Quality Review",
                async (_, ctx) => {
                    const content = ctx.outputs.write.content
                    return this.reviewerAgent.review(content)
                },
                { dependencies: ["write"] }
            ))
        }

        // Step 3: Auto-tag (optional)
        if (mergedOptions.autoTag !== false) {
            pipeline.addStep(createStep<void, TagResult>(
                "tag",
                "Auto-Tagging",
                async (_, ctx) => {
                    const content = ctx.outputs.write.content
                    return this.nlpAgent.autoTag(content)
                },
                { dependencies: ["write"] }
            ))
        }

        // Step 4: Extract entities (optional)
        if (mergedOptions.extractEntities) {
            pipeline.addStep(createStep<void, { entities: Entity[]; model: string }>(
                "entities",
                "Entity Extraction",
                async (_, ctx) => {
                    const content = ctx.outputs.write.content
                    return this.nlpAgent.extractEntities(content)
                },
                { dependencies: ["write"] }
            ))
        }

        // Step 5: Sentiment analysis (optional)
        if (mergedOptions.analyzeSentiment) {
            pipeline.addStep(createStep<void, SentimentResult>(
                "sentiment",
                "Sentiment Analysis",
                async (_, ctx) => {
                    const content = ctx.outputs.write.content
                    return this.nlpAgent.analyzeSentiment(content)
                },
                { dependencies: ["write"] }
            ))
        }

        // Step 6: SEO optimization (optional)
        if (mergedOptions.autoSEO !== false) {
            pipeline.addStep(createStep<void, SEOOptimization>(
                "seo",
                "SEO Optimization",
                async (_, ctx) => {
                    const content = ctx.outputs.write.content
                    const focusKeyword = mergedOptions.focusKeyword || spec.keywords?.[0] || spec.topic
                    return this.seoAgent.optimize(content, focusKeyword)
                },
                {
                    dependencies: ["write"],
                    condition: (ctx) => {
                        // Skip SEO if quality is too low
                        if (mergedOptions.minQualityScore && ctx.outputs.review) {
                            return ctx.outputs.review.overallScore >= mergedOptions.minQualityScore
                        }
                        return true
                    }
                }
            ))
        }

        // Execute pipeline with event streaming
        let pipelineResult: PipelineResult | undefined

        for await (const event of pipeline.execute({ spec, options: mergedOptions })) {
            // Track step durations
            if (event.type === "step-complete" && event.stepId && event.duration) {
                stepDurations[event.stepId] = event.duration
            }

            yield event
        }

        // Get final outputs by running the pipeline
        const finalGen = pipeline.execute({ spec, options: mergedOptions })
        let finalResult: PipelineResult

        while (true) {
            const { value, done } = await finalGen.next()
            if (done) {
                finalResult = value as PipelineResult
                break
            }
        }

        // Compile final output
        const outputs = finalResult.outputs
        const writeResult = outputs.write as ContentResult

        return {
            // Core content
            content: writeResult.content,
            title: outputs.seo?.title,
            excerpt: outputs.seo?.metaDescription,

            // SEO
            metaDescription: outputs.seo?.metaDescription,
            slugSuggestion: outputs.seo?.slugSuggestion,
            schemaMarkup: undefined, // Generate on demand
            seoScore: outputs.seo ? 80 : undefined,

            // NLP
            tags: outputs.tag?.tags,
            categories: outputs.tag?.categories,
            keywords: outputs.seo?.focusKeywords || spec.keywords,
            entities: outputs.entities?.entities,
            sentiment: outputs.sentiment,

            // Quality
            qualityScore: outputs.review?.overallScore,
            qualityIssues: outputs.review?.issues?.length,

            // Metadata
            wordCount: writeResult.wordCount,
            readingTime: writeResult.readingTime,
            modelsUsed: finalResult.modelsUsed,
            totalTokens,
            estimatedCost: this.estimateCost(totalTokens),

            // Timing
            totalDuration: finalResult.totalDuration,
            stepDurations
        }
    }

    /**
     * Quick content generation (minimal processing)
     */
    async quickCreate(spec: ContentSpec): Promise<ContentResult> {
        return this.writerAgent.write(spec)
    }

    // ============ Content Optimization ============

    /**
     * Optimize existing content with streaming events
     */
    async *optimizeContent(
        content: string,
        options: ContentOptions = {}
    ): AsyncGenerator<PipelineEvent, OptimizationOutput> {
        const mergedOptions = { ...this.defaultOptions, ...options }

        const pipeline = new Pipeline({ name: "content-optimization" })

        // Step 1: Analyze current state
        pipeline.addStep(createStep<void, QualityReview>(
            "review-original",
            "Analyze Original",
            async () => this.reviewerAgent.review(content)
        ))

        // Step 2: Extract keywords
        pipeline.addStep(createStep<void, { keywords: Array<{ keyword: string }> }>(
            "extract-keywords",
            "Extract Keywords",
            async () => this.nlpAgent.extractKeywords(content)
        ))

        // Step 3: Improve content
        pipeline.addStep(createStep<void, { improved: string; changes: Array<{ type: string }> }>(
            "improve",
            "Improve Content",
            async (_, ctx) => this.reviewerAgent.improve(content, { focus: "all" }),
            { dependencies: ["review-original"] }
        ))

        // Step 4: SEO optimize
        pipeline.addStep(createStep<void, SEOOptimization>(
            "seo",
            "SEO Optimization",
            async (_, ctx) => {
                const focusKeyword = mergedOptions.focusKeyword ||
                    ctx.outputs["extract-keywords"]?.keywords?.[0]?.keyword || ""
                return this.seoAgent.optimize(ctx.outputs.improve.improved, focusKeyword)
            },
            { dependencies: ["improve", "extract-keywords"] }
        ))

        // Step 5: Review improved content
        pipeline.addStep(createStep<void, QualityReview>(
            "review-improved",
            "Review Improved",
            async (_, ctx) => this.reviewerAgent.review(ctx.outputs.improve.improved),
            { dependencies: ["improve"] }
        ))

        let finalResult: PipelineResult

        for await (const event of pipeline.execute({ content, options: mergedOptions })) {
            yield event
        }

        // Get final result
        const finalGen = pipeline.execute({ content, options: mergedOptions })
        while (true) {
            const { value, done } = await finalGen.next()
            if (done) {
                finalResult = value as PipelineResult
                break
            }
        }

        const outputs = finalResult.outputs

        return {
            originalContent: content,
            optimizedContent: outputs.improve?.improved || content,
            seo: outputs.seo,
            qualityImprovement: (outputs["review-improved"]?.overallScore || 0) -
                (outputs["review-original"]?.overallScore || 0),
            changes: outputs.improve?.changes?.map((c: { type: string }) => c.type) || [],
            modelsUsed: finalResult.modelsUsed
        }
    }

    // ============ Content Analysis ============

    /**
     * Comprehensive content analysis (parallel execution)
     */
    async analyze(content: string): Promise<AnalysisOutput> {
        // Run all analyses in parallel for speed
        const [seo, quality, sentiment, entities, keywords, tags, readability] = await Promise.all([
            this.seoAgent.analyze(content),
            this.reviewerAgent.review(content),
            this.nlpAgent.analyzeSentiment(content),
            this.nlpAgent.extractEntities(content),
            this.nlpAgent.extractKeywords(content),
            this.nlpAgent.autoTag(content),
            this.reviewerAgent.checkReadability(content)
        ])

        return {
            seo,
            quality,
            sentiment,
            entities,
            keywords: keywords.keywords.map(k => k.keyword),
            tags,
            readability
        }
    }

    /**
     * Quick SEO analysis
     */
    async analyzeSEO(content: string, targetKeywords?: string[]): Promise<SEOAnalysis> {
        return this.seoAgent.analyze(content, { targetKeywords })
    }

    /**
     * Quick quality check
     */
    async checkQuality(content: string): Promise<QualityReview> {
        return this.reviewerAgent.review(content)
    }

    // ============ Content Transformation ============

    /**
     * Summarize content
     */
    async summarize(content: string, options?: { maxWords?: number; style?: "bullet" | "paragraph" | "executive" }): Promise<ContentResult> {
        return this.writerAgent.summarize(content, options)
    }

    /**
     * Rewrite content
     */
    async rewrite(content: string, instructions: string): Promise<ContentResult> {
        return this.writerAgent.rewrite(content, instructions)
    }

    /**
     * Expand content
     */
    async expand(content: string, options?: { targetLength?: number; focusAreas?: string[] }): Promise<ContentResult> {
        return this.writerAgent.expand(content, options)
    }

    /**
     * Generate variations
     */
    async generateVariations(content: string, count?: number): Promise<ContentResult[]> {
        return this.writerAgent.generateVariations(content, count)
    }

    // ============ SEO Operations ============

    /**
     * Generate meta tags
     */
    async generateMetaTags(content: string, keyword?: string): Promise<Array<{ title: string; description: string }>> {
        return this.seoAgent.generateMetaTags(content, { keyword })
    }

    /**
     * Generate schema markup
     */
    async generateSchema(content: string, type: string): Promise<object> {
        const result = await this.seoAgent.generateSchemaMarkup(content, type)
        return result.markup
    }

    /**
     * Suggest keywords for a topic
     */
    async suggestKeywords(topic: string): Promise<{
        primary: string[]
        secondary: string[]
        longTail: string[]
        questions: string[]
    }> {
        const result = await this.seoAgent.suggestKeywords(topic, { includeQuestions: true })
        return {
            primary: result.primary,
            secondary: result.secondary,
            longTail: result.longTail,
            questions: result.questions
        }
    }

    // ============ NLP Operations ============

    /**
     * Extract entities
     */
    async extractEntities(text: string): Promise<Entity[]> {
        const result = await this.nlpAgent.extractEntities(text)
        return result.entities
    }

    /**
     * Auto-tag content
     */
    async autoTag(content: string, existingTags?: string[]): Promise<TagResult> {
        return this.nlpAgent.autoTag(content, { existingTags })
    }

    /**
     * Analyze sentiment
     */
    async analyzeSentiment(text: string): Promise<SentimentResult> {
        return this.nlpAgent.analyzeSentiment(text)
    }

    /**
     * Classify content
     */
    async classify(text: string, categories: string[]): Promise<{ category: string; confidence: number }> {
        const result = await this.nlpAgent.classify(text, categories)
        return { category: result.category, confidence: result.confidence }
    }

    // ============ Quality Operations ============

    /**
     * Check grammar
     */
    async checkGrammar(content: string): Promise<{ issues: any[]; corrected: string }> {
        return this.reviewerAgent.checkGrammar(content)
    }

    /**
     * Check facts
     */
    async checkFacts(content: string): Promise<{ isAccurate: boolean; claims: any[] }> {
        return this.reviewerAgent.checkFacts(content)
    }

    /**
     * Improve content
     */
    async improve(content: string, focus?: "clarity" | "engagement" | "conciseness" | "professionalism"): Promise<{ improved: string; changes: any[] }> {
        return this.reviewerAgent.improve(content, { focus })
    }

    // ============ Utilities ============

    /**
     * Get usage statistics
     */
    getUsageStats(since?: Date) {
        return this.usageTracker.getSummary(since ? { since } : undefined)
    }

    /**
     * Estimate cost for tokens
     */
    private estimateCost(tokens: number): number {
        // Average cost estimation across models (in cents)
        const avgCostPer1kTokens = 0.5  // $0.005 per 1k tokens average
        return (tokens / 1000) * avgCostPer1kTokens
    }

    /**
     * Update brand guidelines
     */
    setBrandGuidelines(guidelines: string): void {
        this.brandGuidelines = guidelines
        this.reviewerAgent.setBrandGuidelines(guidelines)
    }

    /**
     * Update style guide
     */
    setStyleGuide(guide: string): void {
        this.styleGuide = guide
        this.reviewerAgent.setStyleGuide(guide)
    }
}

// ============ Factory Function ============

/**
 * Create a CMOrchestrator instance
 */
export function createCMOrchestrator(config: CMConfig): CMOrchestrator {
    return new CMOrchestrator(config)
}

// ============ Preset Pipelines ============

/**
 * Blog post creation pipeline
 */
export async function* createBlogPost(
    orchestrator: CMOrchestrator,
    topic: string,
    options?: {
        keywords?: string[]
        tone?: string
        length?: "short" | "medium" | "long"
    }
): AsyncGenerator<PipelineEvent, ContentOutput> {
    return yield* orchestrator.createContent({
        type: "blog",
        topic,
        tone: (options?.tone as any) || "conversational",
        length: options?.length || "medium",
        keywords: options?.keywords
    }, {
        autoTag: true,
        autoSEO: true,
        qualityCheck: true,
        extractEntities: true
    })
}

/**
 * Product description pipeline
 */
export async function* createProductDescription(
    orchestrator: CMOrchestrator,
    productName: string,
    features: string[],
    options?: {
        tone?: string
        audience?: string
    }
): AsyncGenerator<PipelineEvent, ContentOutput> {
    return yield* orchestrator.createContent({
        type: "product",
        topic: productName,
        tone: (options?.tone as any) || "professional",
        audience: options?.audience,
        context: `Product features: ${features.join(", ")}`,
        length: "medium"
    }, {
        autoSEO: true,
        qualityCheck: true
    })
}
