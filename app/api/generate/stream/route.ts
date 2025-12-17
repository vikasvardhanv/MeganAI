// app/api/generate/stream/route.ts

import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Orchestrator } from "@/lib/ai/orchestrator"

export const runtime = "nodejs"
export const maxDuration = 300 // 5 minutes

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return new Response("Unauthorized", { status: 401 })
    }

    const { projectId, message, userApiKeys } = await req.json()

    // Verify project ownership
    const project = await db.project.findFirst({
        where: { id: projectId, userId: session.user.id },
    })

    if (!project) {
        return new Response("Project not found", { status: 404 })
    }

    // Check credits
    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.credits < 10) {
        return new Response("Insufficient credits", { status: 402 })
    }

    // Merge user's API keys with platform keys
    const apiKeys = {
        ANTHROPIC_API_KEY: userApiKeys?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
        OPENAI_API_KEY: userApiKeys?.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
        GOOGLE_AI_API_KEY: userApiKeys?.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY,
        STABILITY_API_KEY: userApiKeys?.STABILITY_API_KEY || process.env.STABILITY_API_KEY,
        IDEOGRAM_API_KEY: userApiKeys?.IDEOGRAM_API_KEY || process.env.IDEOGRAM_API_KEY,
    }

    // Ensure at least one text model is available
    if (!apiKeys.ANTHROPIC_API_KEY && !apiKeys.OPENAI_API_KEY && !apiKeys.GOOGLE_AI_API_KEY) {
        return new Response(
            JSON.stringify({
                error: "No AI API keys configured. Please add at least one API key in settings.",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        )
    }

    // Create stream
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Initialize orchestrator with user's API keys
    const orchestrator = new Orchestrator({
        apiKeys,
        routerConfig: {
            preferQuality: true,
        },
    })

    // Log available models
    const availableModels = orchestrator.getAvailableModels()
    console.log(`[Generate] Available models: ${availableModels.join(", ")}`)

        // Run generation in background
        ; (async () => {
            try {
                // Send available models to client
                await writer.write(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: "init",
                            availableModels,
                        })}\n\n`
                    )
                )

                const result = await orchestrator.generateApp(
                    message,
                    {
                        name: project.name,
                        framework: project.framework,
                        database: project.database,
                    },
                    // Progress callback
                    async (status, model) => {
                        await writer.write(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    type: "status",
                                    status,
                                    model,
                                })}\n\n`
                            )
                        )
                    }
                )

                // Send final result
                await writer.write(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: "complete",
                            ...result,
                        })}\n\n`
                    )
                )

                // Update project in database
                await db.project.update({
                    where: { id: projectId },
                    data: {
                        code: result.files,
                        status: result.success ? "READY" : "ERROR",
                    },
                })

                // Save messages
                await db.message.create({
                    data: {
                        projectId,
                        role: "USER",
                        content: message,
                    },
                })

                await db.message.create({
                    data: {
                        projectId,
                        role: "ASSISTANT",
                        content: result.success
                            ? "I've generated your app! Check the preview."
                            : `Generation failed: ${result.error}`,
                        codeChanges: result.files,
                    },
                })

                // Deduct credits
                await db.user.update({
                    where: { id: session.user.id },
                    data: { credits: { decrement: 10 } },
                })
            } catch (error) {
                await writer.write(
                    encoder.encode(
                        `data: ${JSON.stringify({ type: "error", error: String(error) })}\n\n`
                    )
                )
            } finally {
                await writer.close()
            }
        })()

    return new Response(stream.readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    })
}
