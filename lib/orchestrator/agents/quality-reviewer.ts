/**
 * Quality Reviewer Agent
 * Reviews content for quality, accuracy, brand compliance, and provides improvement suggestions
 */

import { ModelRouter } from "../../ai/router"

export interface QualityReview {
    overallScore: number  // 0-100
    categories: {
        grammar: number
        spelling: number
        clarity: number
        accuracy: number
        engagement: number
        structure: number
        brandVoice: number
        readability: number
    }
    issues: QualityIssue[]
    strengths: string[]
    suggestions: string[]
    model: string
}

export interface QualityIssue {
    type: "grammar" | "spelling" | "clarity" | "factual" | "brand" | "structure" | "tone" | "redundancy"
    severity: "error" | "warning" | "suggestion"
    location: string
    message: string
    fix?: string
}

export interface FactCheckResult {
    isAccurate: boolean
    claims: Array<{
        claim: string
        status: "verified" | "unverified" | "questionable" | "false"
        explanation: string
        source?: string
    }>
    model: string
}

export interface ImprovementResult {
    improved: string
    changes: Array<{
        type: string
        original: string
        replacement: string
        reason: string
    }>
    model: string
}

export interface BrandComplianceResult {
    score: number  // 0-100
    isCompliant: boolean
    violations: Array<{
        type: string
        issue: string
        suggestion: string
    }>
    alignedElements: string[]
    model: string
}

export class QualityReviewerAgent {
    private router: ModelRouter
    private brandGuidelines?: string
    private styleGuide?: string

    constructor(apiKeys: Record<string, string>, options?: {
        brandGuidelines?: string
        styleGuide?: string
    }) {
        this.router = new ModelRouter(apiKeys)
        this.brandGuidelines = options?.brandGuidelines
        this.styleGuide = options?.styleGuide
    }

    /**
     * Set or update brand guidelines
     */
    setBrandGuidelines(guidelines: string): void {
        this.brandGuidelines = guidelines
    }

    /**
     * Set or update style guide
     */
    setStyleGuide(guide: string): void {
        this.styleGuide = guide
    }

    /**
     * Comprehensive quality review
     */
    async review(content: string): Promise<QualityReview> {
        const prompt = `You are an expert content editor. Review this content for quality across all dimensions.

${this.brandGuidelines ? `BRAND GUIDELINES:\n${this.brandGuidelines}\n` : ""}
${this.styleGuide ? `STYLE GUIDE:\n${this.styleGuide}\n` : ""}

CONTENT TO REVIEW:
${content}

Provide a comprehensive review in this exact JSON format:
{
    "overallScore": <0-100>,
    "categories": {
        "grammar": <0-100>,
        "spelling": <0-100>,
        "clarity": <0-100>,
        "accuracy": <0-100>,
        "engagement": <0-100>,
        "structure": <0-100>,
        "brandVoice": <0-100>,
        "readability": <0-100>
    },
    "issues": [
        {
            "type": "grammar|spelling|clarity|factual|brand|structure|tone|redundancy",
            "severity": "error|warning|suggestion",
            "location": "quote or description of where the issue is",
            "message": "description of the issue",
            "fix": "suggested fix"
        }
    ],
    "strengths": ["list of things done well"],
    "suggestions": ["actionable improvement suggestions"]
}

Return ONLY valid JSON:`

        const result = await this.router.route("quality-review", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { ...parsed, model: result.model }
        } catch {
            return this.getDefaultReview(result.model)
        }
    }

    /**
     * Quick grammar and spelling check
     */
    async checkGrammar(content: string): Promise<{
        issues: QualityIssue[]
        corrected: string
        model: string
    }> {
        const prompt = `Check this content for grammar and spelling errors.

CONTENT:
${content}

Return as JSON:
{
    "issues": [
        {
            "type": "grammar|spelling",
            "severity": "error|warning",
            "location": "the problematic text",
            "message": "what's wrong",
            "fix": "correct version"
        }
    ],
    "corrected": "the full content with all corrections applied"
}

Return ONLY valid JSON:`

        const result = await this.router.route("simple-edits", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { ...parsed, model: result.model }
        } catch {
            return { issues: [], corrected: content, model: result.model }
        }
    }

    /**
     * Check factual accuracy of claims
     */
    async checkFacts(content: string, options?: {
        sources?: string[]
        requireSources?: boolean
    }): Promise<FactCheckResult> {
        const prompt = `Analyze this content for factual accuracy. Identify claims and verify them.

CONTENT:
${content}

${options?.sources?.length ? `REFERENCE SOURCES:\n${options.sources.join("\n")}\n` : ""}

Return as JSON:
{
    "isAccurate": true|false (overall assessment),
    "claims": [
        {
            "claim": "the claim or statement",
            "status": "verified|unverified|questionable|false",
            "explanation": "why this status was given",
            "source": "source if available"
        }
    ]
}

Note: Mark as "unverified" if you cannot confirm, not "false". Only mark "false" if definitely incorrect.

Return ONLY valid JSON:`

        const result = await this.router.route("quality-review", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { ...parsed, model: result.model }
        } catch {
            return { isAccurate: true, claims: [], model: result.model }
        }
    }

    /**
     * Check brand/style compliance
     */
    async checkBrandCompliance(content: string, brandGuidelines?: string): Promise<BrandComplianceResult> {
        const guidelines = brandGuidelines || this.brandGuidelines

        if (!guidelines) {
            return {
                score: 100,
                isCompliant: true,
                violations: [],
                alignedElements: [],
                model: "none"
            }
        }

        const prompt = `Check if this content complies with the brand guidelines.

BRAND GUIDELINES:
${guidelines}

CONTENT TO CHECK:
${content}

Return as JSON:
{
    "score": <0-100 compliance score>,
    "isCompliant": true|false,
    "violations": [
        {
            "type": "tone|voice|terminology|style|formatting",
            "issue": "description of the violation",
            "suggestion": "how to fix it"
        }
    ],
    "alignedElements": ["list of things that align well with brand"]
}

Return ONLY valid JSON:`

        const result = await this.router.route("quality-review", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { ...parsed, model: result.model }
        } catch {
            return {
                score: 0,
                isCompliant: false,
                violations: [],
                alignedElements: [],
                model: result.model
            }
        }
    }

    /**
     * Get improvement suggestions and apply them
     */
    async improve(content: string, options?: {
        focus?: "clarity" | "engagement" | "conciseness" | "professionalism" | "all"
        preserveLength?: boolean
    }): Promise<ImprovementResult> {
        const focus = options?.focus || "all"
        const focusInstructions = {
            clarity: "Focus on making the content clearer and easier to understand.",
            engagement: "Focus on making the content more engaging and compelling.",
            conciseness: "Focus on removing redundancy and making it more concise.",
            professionalism: "Focus on making the tone more professional and polished.",
            all: "Improve all aspects: clarity, engagement, conciseness, and professionalism."
        }

        const prompt = `Improve this content.

FOCUS: ${focusInstructions[focus]}
${options?.preserveLength ? "IMPORTANT: Keep the length approximately the same." : ""}

ORIGINAL CONTENT:
${content}

Return as JSON:
{
    "improved": "the full improved content",
    "changes": [
        {
            "type": "clarity|engagement|conciseness|grammar|structure",
            "original": "original text",
            "replacement": "improved text",
            "reason": "why this change was made"
        }
    ]
}

Return ONLY valid JSON:`

        const result = await this.router.route("content-rewriting", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { ...parsed, model: result.model }
        } catch {
            return { improved: content, changes: [], model: result.model }
        }
    }

    /**
     * Check readability score
     */
    async checkReadability(content: string): Promise<{
        score: number
        gradeLevel: string
        avgSentenceLength: number
        avgWordLength: number
        complexWords: string[]
        suggestions: string[]
        model: string
    }> {
        const prompt = `Analyze the readability of this content.

CONTENT:
${content}

Return as JSON:
{
    "score": <0-100 readability score, higher is easier to read>,
    "gradeLevel": "US grade level (e.g., '8th grade', 'College level')",
    "avgSentenceLength": <average words per sentence>,
    "avgWordLength": <average characters per word>,
    "complexWords": ["list of difficult/complex words that could be simplified"],
    "suggestions": ["suggestions to improve readability"]
}

Return ONLY valid JSON:`

        const result = await this.router.route("quality-review", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { ...parsed, model: result.model }
        } catch {
            return {
                score: 70,
                gradeLevel: "Unknown",
                avgSentenceLength: 0,
                avgWordLength: 0,
                complexWords: [],
                suggestions: [],
                model: result.model
            }
        }
    }

    /**
     * Compare two versions of content
     */
    async compareVersions(original: string, revised: string): Promise<{
        originalScore: number
        revisedScore: number
        improvement: number
        changes: Array<{
            aspect: string
            originalValue: number
            revisedValue: number
            change: "improved" | "declined" | "unchanged"
        }>
        summary: string
        model: string
    }> {
        const prompt = `Compare these two versions of content and analyze the changes.

ORIGINAL:
${original}

REVISED:
${revised}

Return as JSON:
{
    "originalScore": <0-100>,
    "revisedScore": <0-100>,
    "improvement": <percentage change>,
    "changes": [
        {
            "aspect": "clarity|engagement|grammar|structure|conciseness",
            "originalValue": <0-100>,
            "revisedValue": <0-100>,
            "change": "improved|declined|unchanged"
        }
    ],
    "summary": "brief summary of the changes and their impact"
}

Return ONLY valid JSON:`

        const result = await this.router.route("quality-review", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { ...parsed, model: result.model }
        } catch {
            return {
                originalScore: 0,
                revisedScore: 0,
                improvement: 0,
                changes: [],
                summary: "Unable to compare versions",
                model: result.model
            }
        }
    }

    private parseJSON(response: string): any {
        let jsonStr = response.trim()

        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim()
        }

        const startIdx = jsonStr.search(/[\[{]/)
        const endIdx = Math.max(jsonStr.lastIndexOf("}"), jsonStr.lastIndexOf("]"))

        if (startIdx !== -1 && endIdx !== -1) {
            jsonStr = jsonStr.substring(startIdx, endIdx + 1)
        }

        return JSON.parse(jsonStr)
    }

    private getDefaultReview(model: string): QualityReview {
        return {
            overallScore: 70,
            categories: {
                grammar: 70,
                spelling: 70,
                clarity: 70,
                accuracy: 70,
                engagement: 70,
                structure: 70,
                brandVoice: 70,
                readability: 70
            },
            issues: [],
            strengths: [],
            suggestions: ["Unable to complete full review"],
            model
        }
    }
}
