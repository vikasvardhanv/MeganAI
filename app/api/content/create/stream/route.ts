/**
 * Content Creation Streaming API
 * POST /api/content/create/stream - Stream content creation events via SSE
 */

import { NextRequest } from "next/server"
import { CMOrchestrator } from "@/lib/orchestrator/cm-orchestrator"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { spec, options } = body

        // Validate required fields
        if (!spec?.topic || !spec?.type) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: topic and type are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            )
        }

        // Get API keys from environment
        const apiKeys = {
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
            OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
            GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || ""
        }

        if (!apiKeys.ANTHROPIC_API_KEY && !apiKeys.OPENAI_API_KEY && !apiKeys.GOOGLE_AI_API_KEY) {
            return new Response(
                JSON.stringify({ error: "No AI API keys configured" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            )
        }

        const orchestrator = new CMOrchestrator({ apiKeys })

        // Create a readable stream for SSE
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    let finalOutput: any

                    for await (const event of orchestrator.createContent(spec, options || {})) {
                        const data = JSON.stringify({
                            type: event.type,
                            stepId: event.stepId,
                            stepName: event.stepName,
                            message: event.message,
                            progress: event.progress,
                            data: event.data,
                            timestamp: event.timestamp
                        })

                        controller.enqueue(encoder.encode(`data: ${data}\n\n`))

                        // Capture final output for the complete event
                        if (event.type === "pipeline-complete" || event.type === "pipeline-failed") {
                            // Final output will be sent after generator completes
                        }
                    }

                    // Get final result
                    const gen = orchestrator.createContent(spec, options || {})
                    while (true) {
                        const { value, done } = await gen.next()
                        if (done) {
                            finalOutput = value
                            break
                        }
                    }

                    // Send final result
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: "result",
                        output: finalOutput
                    })}\n\n`))

                    controller.close()
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error"
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: "error",
                        error: errorMessage
                    })}\n\n`))
                    controller.close()
                }
            }
        })

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        })

    } catch (error) {
        console.error("Streaming error:", error)
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Streaming failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
}
