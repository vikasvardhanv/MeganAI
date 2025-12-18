/**
 * Quality Check API
 * POST /api/quality - Quality review operations
 */

import { NextRequest, NextResponse } from "next/server"
import { CMOrchestrator } from "@/lib/orchestrator/cm-orchestrator"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action, content, options } = body

        if (!action || !["review", "grammar", "facts", "improve", "readability"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action. Must be: review, grammar, facts, improve, or readability" },
                { status: 400 }
            )
        }

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
        let result: any

        switch (action) {
            case "review":
                result = await orchestrator.checkQuality(content)
                break

            case "grammar":
                result = await orchestrator.checkGrammar(content)
                break

            case "facts":
                result = await orchestrator.checkFacts(content)
                break

            case "improve":
                result = await orchestrator.improve(content, options?.focus)
                break

            case "readability":
                // Use full analysis and extract readability
                const analysis = await orchestrator.analyze(content)
                result = analysis.readability
                break
        }

        return NextResponse.json({
            success: true,
            result
        })

    } catch (error) {
        console.error("Quality check error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Quality check failed" },
            { status: 500 }
        )
    }
}
