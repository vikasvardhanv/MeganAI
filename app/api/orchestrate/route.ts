import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AppOrchestrator } from "@/lib/orchestrator/core"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { prompt } = body

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
        }

        // Check for API keys
        const apiKeys = {
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
            OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
            GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || "",
        }

        const hasAnyKey = Object.values(apiKeys).some(k => k.length > 0)
        if (!hasAnyKey) {
            return NextResponse.json({
                error: "No AI API keys configured. Please add at least one API key in environment variables."
            }, { status: 500 })
        }

        console.log("[Orchestrate] Starting with keys:", {
            anthropic: !!apiKeys.ANTHROPIC_API_KEY,
            openai: !!apiKeys.OPENAI_API_KEY,
            google: !!apiKeys.GOOGLE_AI_API_KEY,
        })

        // Initialize orchestrator
        const orchestrator = new AppOrchestrator(apiKeys)

        // Create execution plan
        console.log("[Orchestrate] Creating execution plan...")
        await orchestrator.createExecutionPlan(prompt)
        console.log("[Orchestrate] Plan created successfully")

        // Stream progress
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const event of orchestrator.execute()) {
                        const data = `data: ${JSON.stringify(event)}\n\n`
                        controller.enqueue(encoder.encode(data))
                    }
                    controller.close()
                } catch (error) {
                    console.error("[Orchestrate] Execution error:", error)
                    const errorEvent = `data: ${JSON.stringify({
                        type: "error",
                        message: error instanceof Error ? error.message : "Unknown execution error"
                    })}\n\n`
                    controller.enqueue(encoder.encode(errorEvent))
                    controller.close()
                }
            },
        })

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        })
    } catch (error) {
        console.error("[Orchestrate] API error:", error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal server error",
            stack: process.env.NODE_ENV === "development" ? (error as Error).stack : undefined
        }, { status: 500 })
    }
}
