/**
 * Content Transform API
 * POST /api/content/transform - Transform content (summarize, rewrite, expand)
 */

import { NextRequest, NextResponse } from "next/server"
import { CMOrchestrator } from "@/lib/orchestrator/cm-orchestrator"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { content, action, options } = body

        if (!content) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            )
        }

        if (!action || !["summarize", "rewrite", "expand", "variations"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action. Must be: summarize, rewrite, expand, or variations" },
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
            case "summarize":
                result = await orchestrator.summarize(content, options)
                break
            case "rewrite":
                if (!options?.instructions) {
                    return NextResponse.json(
                        { error: "Instructions required for rewrite action" },
                        { status: 400 }
                    )
                }
                result = await orchestrator.rewrite(content, options.instructions)
                break
            case "expand":
                result = await orchestrator.expand(content, options)
                break
            case "variations":
                result = await orchestrator.generateVariations(content, options?.count)
                break
        }

        return NextResponse.json({
            success: true,
            result
        })

    } catch (error) {
        console.error("Transform error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Transform failed" },
            { status: 500 }
        )
    }
}
