/**
 * Content Creation API
 * POST /api/content/create - Create new content with full processing pipeline
 */

import { NextRequest, NextResponse } from "next/server"
import { CMOrchestrator } from "@/lib/orchestrator/cm-orchestrator"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { spec, options } = body

        // Validate required fields
        if (!spec?.topic || !spec?.type) {
            return NextResponse.json(
                { error: "Missing required fields: topic and type are required" },
                { status: 400 }
            )
        }

        // Get API keys from environment
        const apiKeys = {
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
            OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
            GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || ""
        }

        // Check at least one API key is available
        if (!apiKeys.ANTHROPIC_API_KEY && !apiKeys.OPENAI_API_KEY && !apiKeys.GOOGLE_AI_API_KEY) {
            return NextResponse.json(
                { error: "No AI API keys configured" },
                { status: 500 }
            )
        }

        const orchestrator = new CMOrchestrator({ apiKeys })

        // For non-streaming, use quickCreate
        if (options?.quick) {
            const result = await orchestrator.quickCreate(spec)
            return NextResponse.json({ success: true, result })
        }

        // Full pipeline - collect results
        const events: any[] = []
        let finalOutput: any

        for await (const event of orchestrator.createContent(spec, options || {})) {
            events.push({
                type: event.type,
                stepId: event.stepId,
                stepName: event.stepName,
                message: event.message,
                progress: event.progress,
                timestamp: event.timestamp
            })
        }

        // Get final result from last generator run
        const gen = orchestrator.createContent(spec, options || {})
        while (true) {
            const { value, done } = await gen.next()
            if (done) {
                finalOutput = value
                break
            }
        }

        return NextResponse.json({
            success: true,
            output: finalOutput,
            events
        })

    } catch (error) {
        console.error("Content creation error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Content creation failed" },
            { status: 500 }
        )
    }
}
