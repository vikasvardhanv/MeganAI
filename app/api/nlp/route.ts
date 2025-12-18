/**
 * NLP API
 * POST /api/nlp - NLP-specific operations
 */

import { NextRequest, NextResponse } from "next/server"
import { CMOrchestrator } from "@/lib/orchestrator/cm-orchestrator"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action, text, content, options } = body

        const inputText = text || content

        if (!action || !["entities", "tags", "sentiment", "classify", "keywords"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action. Must be: entities, tags, sentiment, classify, or keywords" },
                { status: 400 }
            )
        }

        if (!inputText) {
            return NextResponse.json(
                { error: "Text or content is required" },
                { status: 400 }
            )
        }

        const apiKeys = {
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
            OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
            GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || ""
        }

        if (!apiKeys.ANTHROPIC_API_KEY && !apiKeys.OPENAI_API_KEY && !apiKeys.GOOGLE_AI_API_KEY) {
            return NextResponse.json(
                { error: "No AI API keys configured" },
                { status: 500 }
            )
        }

        const orchestrator = new CMOrchestrator({ apiKeys })
        let result: any

        switch (action) {
            case "entities":
                result = await orchestrator.extractEntities(inputText)
                break

            case "tags":
                result = await orchestrator.autoTag(inputText, options?.existingTags)
                break

            case "sentiment":
                result = await orchestrator.analyzeSentiment(inputText)
                break

            case "classify":
                if (!options?.categories || !Array.isArray(options.categories)) {
                    return NextResponse.json(
                        { error: "Categories array required for classification" },
                        { status: 400 }
                    )
                }
                result = await orchestrator.classify(inputText, options.categories)
                break

            case "keywords":
                result = await orchestrator.suggestKeywords(inputText)
                break
        }

        return NextResponse.json({
            success: true,
            result
        })

    } catch (error) {
        console.error("NLP error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "NLP operation failed" },
            { status: 500 }
        )
    }
}
