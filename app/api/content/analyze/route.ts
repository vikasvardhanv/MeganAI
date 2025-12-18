/**
 * Content Analysis API
 * POST /api/content/analyze - Analyze content for SEO, quality, NLP
 */

import { NextRequest, NextResponse } from "next/server"
import { CMOrchestrator } from "@/lib/orchestrator/cm-orchestrator"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { content, options } = body

        if (!content) {
            return NextResponse.json(
                { error: "Content is required" },
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

        // Choose analysis type
        const analysisType = options?.type || "full"

        let result: any

        switch (analysisType) {
            case "seo":
                result = await orchestrator.analyzeSEO(content, options?.targetKeywords)
                break
            case "quality":
                result = await orchestrator.checkQuality(content)
                break
            case "sentiment":
                result = await orchestrator.analyzeSentiment(content)
                break
            case "full":
            default:
                result = await orchestrator.analyze(content)
                break
        }

        return NextResponse.json({
            success: true,
            analysis: result
        })

    } catch (error) {
        console.error("Analysis error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Analysis failed" },
            { status: 500 }
        )
    }
}
