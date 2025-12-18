/**
 * SEO Agent
 * Optimizes content for search engines with analysis, optimization, and schema generation
 */

import { ModelRouter } from "../../ai/router"

export interface SEOAnalysis {
    score: number  // 0-100
    issues: SEOIssue[]
    suggestions: string[]
    keywords: KeywordAnalysis[]
    readability: ReadabilityScore
    model: string
}

export interface SEOIssue {
    severity: "critical" | "warning" | "info"
    type: "title" | "meta" | "headings" | "keywords" | "content" | "structure" | "links"
    message: string
    fix?: string
}

export interface KeywordAnalysis {
    keyword: string
    density: number
    count: number
    inTitle: boolean
    inHeadings: boolean
    suggestion: string
}

export interface ReadabilityScore {
    score: number  // 0-100
    grade: string  // e.g., "8th grade"
    avgSentenceLength: number
    avgWordLength: number
}

export interface SEOOptimization {
    title: string
    metaDescription: string
    h1: string
    slugSuggestion: string
    focusKeywords: string[]
    secondaryKeywords: string[]
    internalLinkSuggestions: string[]
    model: string
}

export interface SchemaMarkup {
    type: string
    markup: object
    model: string
}

export class SEOAgent {
    private router: ModelRouter

    constructor(apiKeys: Record<string, string>) {
        this.router = new ModelRouter(apiKeys)
    }

    /**
     * Comprehensive SEO analysis of content
     */
    async analyze(content: string, options?: {
        targetKeywords?: string[]
        url?: string
    }): Promise<SEOAnalysis> {
        const prompt = `You are an SEO expert. Analyze the following content for search engine optimization.

CONTENT:
${content}

${options?.targetKeywords?.length ? `TARGET KEYWORDS: ${options.targetKeywords.join(", ")}` : ""}
${options?.url ? `URL: ${options.url}` : ""}

Provide a comprehensive SEO analysis in this exact JSON format:
{
    "score": <0-100 overall SEO score>,
    "issues": [
        {
            "severity": "critical|warning|info",
            "type": "title|meta|headings|keywords|content|structure|links",
            "message": "description of the issue",
            "fix": "how to fix it"
        }
    ],
    "suggestions": ["list of improvement suggestions"],
    "keywords": [
        {
            "keyword": "keyword phrase",
            "density": <percentage as decimal>,
            "count": <number of occurrences>,
            "inTitle": true|false,
            "inHeadings": true|false,
            "suggestion": "optimization suggestion"
        }
    ],
    "readability": {
        "score": <0-100>,
        "grade": "reading level",
        "avgSentenceLength": <number>,
        "avgWordLength": <number>
    }
}

Return ONLY valid JSON:`

        const result = await this.router.route("seo-optimization", prompt)

        try {
            const analysis = this.parseJSON(result.response)
            return { ...analysis, model: result.model }
        } catch {
            return this.getDefaultAnalysis(result.model)
        }
    }

    /**
     * Generate optimized SEO metadata for content
     */
    async optimize(content: string, focusKeyword: string): Promise<SEOOptimization> {
        const prompt = `You are an SEO expert. Generate optimized metadata for this content.

FOCUS KEYWORD: ${focusKeyword}

CONTENT:
${content}

Generate SEO-optimized metadata in this exact JSON format:
{
    "title": "SEO-optimized title (50-60 characters, includes focus keyword near start)",
    "metaDescription": "Compelling meta description (150-160 characters, includes focus keyword, has call-to-action)",
    "h1": "Primary heading (includes focus keyword naturally)",
    "slugSuggestion": "url-friendly-slug-with-keyword",
    "focusKeywords": ["primary keyword", "variations"],
    "secondaryKeywords": ["related", "semantic", "keywords"],
    "internalLinkSuggestions": ["topics to link to internally"]
}

Return ONLY valid JSON:`

        const result = await this.router.route("seo-optimization", prompt)

        try {
            const optimization = this.parseJSON(result.response)
            return { ...optimization, model: result.model }
        } catch {
            return {
                title: "",
                metaDescription: "",
                h1: "",
                slugSuggestion: "",
                focusKeywords: [focusKeyword],
                secondaryKeywords: [],
                internalLinkSuggestions: [],
                model: result.model
            }
        }
    }

    /**
     * Generate meta tags (title and description) quickly
     */
    async generateMetaTags(content: string, options?: {
        keyword?: string
        count?: number
    }): Promise<Array<{ title: string; description: string }>> {
        const count = options?.count || 3

        const prompt = `Generate ${count} SEO-optimized meta tag combinations for this content.

${options?.keyword ? `FOCUS KEYWORD: ${options.keyword}` : ""}

CONTENT:
${content.substring(0, 2000)}

For each combination:
- Title: 50-60 characters, compelling, keyword near start
- Description: 150-160 characters, includes keyword, has call-to-action

Return as JSON array:
[
    {"title": "...", "description": "..."},
    ...
]

Return ONLY valid JSON:`

        const result = await this.router.route("meta-generation", prompt)

        try {
            return this.parseJSON(result.response)
        } catch {
            return [{ title: "", description: "" }]
        }
    }

    /**
     * Generate structured data schema markup
     */
    async generateSchemaMarkup(content: string, type: string): Promise<SchemaMarkup> {
        const schemaTypes: Record<string, string> = {
            article: "Article or BlogPosting schema",
            product: "Product schema with offers",
            faq: "FAQPage schema",
            howto: "HowTo schema with steps",
            organization: "Organization schema",
            person: "Person schema",
            event: "Event schema",
            recipe: "Recipe schema",
            review: "Review schema",
            video: "VideoObject schema",
            breadcrumb: "BreadcrumbList schema"
        }

        const schemaDescription = schemaTypes[type.toLowerCase()] || type

        const prompt = `Generate valid JSON-LD schema.org markup for this content.

SCHEMA TYPE: ${schemaDescription}

CONTENT:
${content.substring(0, 3000)}

Generate complete, valid JSON-LD markup that can be embedded in a <script type="application/ld+json"> tag.
Include all relevant properties from the content.

Return ONLY the JSON-LD object (no script tags):`

        const result = await this.router.route("schema-markup", prompt)

        try {
            const markup = this.parseJSON(result.response)
            return {
                type,
                markup,
                model: result.model
            }
        } catch {
            return {
                type,
                markup: { "@context": "https://schema.org", "@type": type },
                model: result.model
            }
        }
    }

    /**
     * Suggest keyword variations and related terms
     */
    async suggestKeywords(topic: string, options?: {
        count?: number
        includeQuestions?: boolean
    }): Promise<{
        primary: string[]
        secondary: string[]
        longTail: string[]
        questions: string[]
        model: string
    }> {
        const count = options?.count || 10

        const prompt = `Suggest SEO keywords for this topic.

TOPIC: ${topic}

Generate keyword suggestions in this JSON format:
{
    "primary": ["${count} main keywords/phrases"],
    "secondary": ["related semantic keywords"],
    "longTail": ["longer, specific keyword phrases"],
    ${options?.includeQuestions ? '"questions": ["question-based keywords people search for"]' : '"questions": []'}
}

Return ONLY valid JSON:`

        const result = await this.router.route("keyword-extraction", prompt)

        try {
            const keywords = this.parseJSON(result.response)
            return { ...keywords, model: result.model }
        } catch {
            return {
                primary: [],
                secondary: [],
                longTail: [],
                questions: [],
                model: result.model
            }
        }
    }

    /**
     * Analyze competitor content for SEO insights
     */
    async analyzeCompetitorContent(contents: string[]): Promise<{
        commonKeywords: string[]
        gaps: string[]
        recommendations: string[]
        avgWordCount: number
        model: string
    }> {
        const combinedContent = contents.map((c, i) => `--- COMPETITOR ${i + 1} ---\n${c.substring(0, 1500)}`).join("\n\n")

        const prompt = `Analyze these competitor contents for SEO insights.

${combinedContent}

Provide competitive analysis in JSON format:
{
    "commonKeywords": ["keywords all competitors use"],
    "gaps": ["topics/keywords competitors miss that you could target"],
    "recommendations": ["strategic recommendations based on analysis"],
    "avgWordCount": <average word count across competitors>
}

Return ONLY valid JSON:`

        const result = await this.router.route("seo-optimization", prompt)

        try {
            const analysis = this.parseJSON(result.response)
            return { ...analysis, model: result.model }
        } catch {
            return {
                commonKeywords: [],
                gaps: [],
                recommendations: [],
                avgWordCount: 0,
                model: result.model
            }
        }
    }

    private parseJSON(response: string): any {
        // Try to extract JSON from response
        let jsonStr = response.trim()

        // Remove markdown code blocks if present
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim()
        }

        // Find JSON object/array boundaries
        const startIdx = jsonStr.search(/[\[{]/)
        const endIdx = Math.max(jsonStr.lastIndexOf("}"), jsonStr.lastIndexOf("]"))

        if (startIdx !== -1 && endIdx !== -1) {
            jsonStr = jsonStr.substring(startIdx, endIdx + 1)
        }

        return JSON.parse(jsonStr)
    }

    private getDefaultAnalysis(model: string): SEOAnalysis {
        return {
            score: 50,
            issues: [],
            suggestions: ["Unable to fully analyze content"],
            keywords: [],
            readability: {
                score: 70,
                grade: "Unknown",
                avgSentenceLength: 0,
                avgWordLength: 0
            },
            model
        }
    }
}
