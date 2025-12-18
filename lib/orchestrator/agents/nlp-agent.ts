/**
 * NLP Agent
 * Natural Language Processing for tagging, entity extraction, sentiment analysis, and classification
 */

import { ModelRouter } from "../../ai/router"

export interface Entity {
    text: string
    type: "person" | "organization" | "location" | "date" | "product" | "concept" | "event" | "money" | "other"
    confidence: number
    context?: string
}

export interface TagResult {
    tags: string[]
    categories: string[]
    topics: string[]
    confidence: number
    model: string
}

export interface SentimentResult {
    sentiment: "positive" | "negative" | "neutral" | "mixed"
    score: number  // -1 to 1
    magnitude: number  // 0 to 1 (strength of emotion)
    emotions: {
        joy: number
        sadness: number
        anger: number
        fear: number
        surprise: number
        trust: number
    }
    model: string
}

export interface KeywordResult {
    keywords: Array<{
        keyword: string
        relevance: number
        frequency: number
    }>
    model: string
}

export interface ClassificationResult {
    category: string
    confidence: number
    alternatives: Array<{ category: string; confidence: number }>
    model: string
}

export interface SimilarityResult {
    score: number  // 0 to 1
    explanation: string
    model: string
}

export class NLPAgent {
    private router: ModelRouter

    constructor(apiKeys: Record<string, string>) {
        this.router = new ModelRouter(apiKeys)
    }

    /**
     * Extract named entities from text
     */
    async extractEntities(text: string): Promise<{ entities: Entity[]; model: string }> {
        const prompt = `Extract all named entities from this text. Identify people, organizations, locations, dates, products, concepts, events, and monetary values.

TEXT:
${text}

Return as JSON:
{
    "entities": [
        {
            "text": "entity text as it appears",
            "type": "person|organization|location|date|product|concept|event|money|other",
            "confidence": <0.0-1.0>,
            "context": "brief context of how it's used"
        }
    ]
}

Return ONLY valid JSON:`

        const result = await this.router.route("entity-extraction", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { entities: parsed.entities || [], model: result.model }
        } catch {
            return { entities: [], model: result.model }
        }
    }

    /**
     * Auto-generate tags and categories for content
     */
    async autoTag(content: string, options?: {
        existingTags?: string[]
        maxTags?: number
        taxonomy?: string[]
    }): Promise<TagResult> {
        const maxTags = options?.maxTags || 10

        const prompt = `Analyze this content and generate relevant tags, categories, and topics.

CONTENT:
${content}

${options?.existingTags?.length ? `EXISTING TAG VOCABULARY (prefer these when applicable): ${options.existingTags.slice(0, 50).join(", ")}` : ""}
${options?.taxonomy?.length ? `TAXONOMY TO USE: ${options.taxonomy.join(", ")}` : ""}

Generate up to ${maxTags} tags.

Return as JSON:
{
    "tags": ["relevant", "descriptive", "tags"],
    "categories": ["primary category", "secondary category"],
    "topics": ["main topics covered"],
    "confidence": <0.0-1.0 overall confidence>
}

Return ONLY valid JSON:`

        const result = await this.router.route("auto-tagging", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return {
                tags: parsed.tags || [],
                categories: parsed.categories || [],
                topics: parsed.topics || [],
                confidence: parsed.confidence || 0.8,
                model: result.model
            }
        } catch {
            return {
                tags: [],
                categories: [],
                topics: [],
                confidence: 0,
                model: result.model
            }
        }
    }

    /**
     * Extract important keywords and phrases
     */
    async extractKeywords(text: string, options?: {
        count?: number
        includeNGrams?: boolean
    }): Promise<KeywordResult> {
        const count = options?.count || 10

        const prompt = `Extract the ${count} most important keywords and key phrases from this text.

TEXT:
${text}

${options?.includeNGrams ? "Include both single words and multi-word phrases (2-4 words)." : "Focus on the most important single words and short phrases."}

Rank by relevance to the main topic.

Return as JSON:
{
    "keywords": [
        {
            "keyword": "keyword or phrase",
            "relevance": <0.0-1.0>,
            "frequency": <number of occurrences>
        }
    ]
}

Return ONLY valid JSON:`

        const result = await this.router.route("keyword-extraction", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { keywords: parsed.keywords || [], model: result.model }
        } catch {
            return { keywords: [], model: result.model }
        }
    }

    /**
     * Analyze sentiment of text
     */
    async analyzeSentiment(text: string): Promise<SentimentResult> {
        const prompt = `Analyze the sentiment and emotional tone of this text.

TEXT:
${text}

Return as JSON:
{
    "sentiment": "positive|negative|neutral|mixed",
    "score": <-1.0 (very negative) to 1.0 (very positive)>,
    "magnitude": <0.0 (weak) to 1.0 (strong emotional content)>,
    "emotions": {
        "joy": <0.0-1.0>,
        "sadness": <0.0-1.0>,
        "anger": <0.0-1.0>,
        "fear": <0.0-1.0>,
        "surprise": <0.0-1.0>,
        "trust": <0.0-1.0>
    }
}

Return ONLY valid JSON:`

        const result = await this.router.route("sentiment-analysis", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { ...parsed, model: result.model }
        } catch {
            return {
                sentiment: "neutral",
                score: 0,
                magnitude: 0,
                emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, trust: 0 },
                model: result.model
            }
        }
    }

    /**
     * Classify text into predefined categories
     */
    async classify(text: string, categories: string[]): Promise<ClassificationResult> {
        const prompt = `Classify this text into ONE of these categories: ${categories.join(", ")}

TEXT:
${text}

Return as JSON:
{
    "category": "the best matching category from the list",
    "confidence": <0.0-1.0>,
    "alternatives": [
        {"category": "second best match", "confidence": <0.0-1.0>},
        {"category": "third best match", "confidence": <0.0-1.0>}
    ]
}

Return ONLY valid JSON:`

        const result = await this.router.route("text-classification", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { ...parsed, model: result.model }
        } catch {
            return {
                category: categories[0] || "unknown",
                confidence: 0,
                alternatives: [],
                model: result.model
            }
        }
    }

    /**
     * Detect the language of text
     */
    async detectLanguage(text: string): Promise<{
        language: string
        languageCode: string
        confidence: number
        model: string
    }> {
        const prompt = `Detect the language of this text.

TEXT:
${text.substring(0, 500)}

Return as JSON:
{
    "language": "full language name",
    "languageCode": "ISO 639-1 code (e.g., 'en', 'es', 'fr')",
    "confidence": <0.0-1.0>
}

Return ONLY valid JSON:`

        const result = await this.router.route("text-classification", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { ...parsed, model: result.model }
        } catch {
            return {
                language: "English",
                languageCode: "en",
                confidence: 0.5,
                model: result.model
            }
        }
    }

    /**
     * Calculate semantic similarity between two texts
     */
    async calculateSimilarity(text1: string, text2: string): Promise<SimilarityResult> {
        const prompt = `Compare these two texts and determine their semantic similarity.

TEXT 1:
${text1.substring(0, 1000)}

TEXT 2:
${text2.substring(0, 1000)}

Return as JSON:
{
    "score": <0.0 (completely different) to 1.0 (nearly identical meaning)>,
    "explanation": "brief explanation of the similarity/differences"
}

Return ONLY valid JSON:`

        const result = await this.router.route("text-classification", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { ...parsed, model: result.model }
        } catch {
            return {
                score: 0,
                explanation: "Unable to compare texts",
                model: result.model
            }
        }
    }

    /**
     * Generate a topic model from multiple documents
     */
    async extractTopics(documents: string[], options?: { numTopics?: number }): Promise<{
        topics: Array<{
            name: string
            keywords: string[]
            weight: number
        }>
        model: string
    }> {
        const numTopics = options?.numTopics || 5
        const docSamples = documents.slice(0, 10).map((d, i) =>
            `--- DOCUMENT ${i + 1} ---\n${d.substring(0, 500)}`
        ).join("\n\n")

        const prompt = `Identify the ${numTopics} main topics across these documents.

${docSamples}

Return as JSON:
{
    "topics": [
        {
            "name": "descriptive topic name",
            "keywords": ["key", "words", "for", "topic"],
            "weight": <0.0-1.0 importance>
        }
    ]
}

Return ONLY valid JSON:`

        const result = await this.router.route("auto-tagging", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { topics: parsed.topics || [], model: result.model }
        } catch {
            return { topics: [], model: result.model }
        }
    }

    /**
     * Summarize key facts from text
     */
    async extractFacts(text: string): Promise<{
        facts: Array<{
            fact: string
            type: "claim" | "statistic" | "quote" | "event" | "definition"
            confidence: number
        }>
        model: string
    }> {
        const prompt = `Extract key facts, claims, and important information from this text.

TEXT:
${text}

Return as JSON:
{
    "facts": [
        {
            "fact": "the extracted fact or claim",
            "type": "claim|statistic|quote|event|definition",
            "confidence": <0.0-1.0>
        }
    ]
}

Return ONLY valid JSON:`

        const result = await this.router.route("entity-extraction", prompt)

        try {
            const parsed = this.parseJSON(result.response)
            return { facts: parsed.facts || [], model: result.model }
        } catch {
            return { facts: [], model: result.model }
        }
    }

    private parseJSON(response: string): any {
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
}
