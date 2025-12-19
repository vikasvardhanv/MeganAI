/**
 * Agent Board SSE Stream API Route
 * Server-Sent Events endpoint for real-time agent collaboration updates
 * Powers the Agent Collaboration Board UI with multi-agent visibility
 */

import { NextRequest } from "next/server"
import { StreamingOrchestrator } from "@/lib/ai/streaming-orchestrator"
import { AgentEvent } from "@/types/agent"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes

// GET endpoint for simple SSE streaming with query params
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const prompt = searchParams.get("prompt")
    const demo = searchParams.get("demo") === "true"

    // Demo mode - simulate agent activities
    if (demo) {
        return createDemoStream()
    }

    if (!prompt) {
        return new Response(
            JSON.stringify({ error: "Missing prompt parameter" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        )
    }

    return createGenerationStream(prompt, {
        name: "Generated App",
        framework: "NEXTJS",
        database: "POSTGRESQL"
    })
}

// POST endpoint for complex configurations
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { prompt, config, demo } = body

        if (demo) {
            return createDemoStream()
        }

        if (!prompt) {
            return new Response(
                JSON.stringify({ error: "Missing prompt" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            )
        }

        return createGenerationStream(prompt, {
            name: config?.name || "Generated App",
            framework: config?.framework || "NEXTJS",
            database: config?.database || "POSTGRESQL",
            features: config?.features || [],
            enableParallel: config?.enableParallel ?? true
        })
    } catch {
        return new Response(
            JSON.stringify({ error: "Invalid request body" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        )
    }
}

// Create the actual generation stream
function createGenerationStream(
    prompt: string,
    config: {
        name: string
        framework: string
        database: string
        features?: string[]
        enableParallel?: boolean
    }
) {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const orchestrator = new StreamingOrchestrator({
                    apiKeys: {
                        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
                        OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
                        GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || "",
                    },
                    enableParallel: config.enableParallel ?? true,
                    enableStreaming: true
                })

                // Send init event
                sendEvent(controller, encoder, {
                    id: "init",
                    timestamp: Date.now(),
                    type: "agent_start",
                    agentId: "system",
                    agentName: "System",
                    model: "system",
                    task: "Initializing agent collaboration..."
                })

                // Run generation
                const generator = orchestrator.generateApp(prompt, {
                    name: config.name,
                    framework: config.framework as "NEXTJS",
                    database: config.database as "POSTGRESQL" | "NONE",
                    features: config.features || []
                })

                let result
                while (true) {
                    const next = await generator.next()

                    if (next.done) {
                        result = next.value
                        break
                    }

                    sendEvent(controller, encoder, next.value)
                }

                // Send completion
                sendEvent(controller, encoder, {
                    id: "complete",
                    timestamp: Date.now(),
                    type: "agent_complete",
                    agentId: "system",
                    agentName: "System",
                    model: "system",
                    task: result?.success ? "Generation complete!" : "Generation failed",
                    output: result?.success
                        ? JSON.stringify({ fileCount: Object.keys(result.files).length })
                        : result?.error
                })

                controller.close()
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error"
                sendEvent(controller, encoder, {
                    id: "error",
                    timestamp: Date.now(),
                    type: "agent_error",
                    agentId: "system",
                    agentName: "System",
                    model: "system",
                    task: "Generation failed",
                    error: errorMessage
                })
                controller.close()
            }
        }
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    })
}

// Create demo stream with simulated agent activities
function createDemoStream() {
    const encoder = new TextEncoder()

    const agents = [
        { id: "agent-architect", name: "Architect", emoji: "🏗️", model: "claude-opus-4", color: "from-violet-500 to-purple-600" },
        { id: "agent-ui-designer", name: "UI Designer", emoji: "🎨", model: "gpt-4o", color: "from-pink-500 to-rose-600" },
        { id: "agent-backend", name: "Backend", emoji: "⚙️", model: "claude-sonnet-4", color: "from-blue-500 to-cyan-600" },
        { id: "agent-integrator", name: "Integrator", emoji: "🔧", model: "claude-opus-4", color: "from-amber-500 to-orange-600" }
    ]

    const stream = new ReadableStream({
        async start(controller) {
            // Init event
            sendEvent(controller, encoder, {
                id: "demo-init",
                timestamp: Date.now(),
                type: "agent_start",
                agentId: "system",
                agentName: "System",
                model: "demo",
                task: "Starting demo mode..."
            })

            await sleep(500)

            // Simulate each agent
            for (const agent of agents) {
                // Agent start
                sendEvent(controller, encoder, {
                    id: `demo-${agent.id}-start`,
                    timestamp: Date.now(),
                    type: "agent_start",
                    agentId: agent.id,
                    agentName: agent.name,
                    model: agent.model,
                    task: `Generating ${agent.name.toLowerCase()} components...`
                })

                await sleep(300)

                // Progress updates
                for (let progress = 20; progress <= 100; progress += 20) {
                    sendEvent(controller, encoder, {
                        id: `demo-${agent.id}-progress-${progress}`,
                        timestamp: Date.now(),
                        type: "agent_progress",
                        agentId: agent.id,
                        agentName: agent.name,
                        model: agent.model,
                        task: `Processing...`,
                        progress,
                        output: `// ${agent.name} generated code\nfunction ${agent.name.toLowerCase().replace(" ", "")}Component() {\n  // Implementation ${progress}%\n  return <div>...</div>\n}`
                    })
                    await sleep(200)
                }

                // Agent complete
                sendEvent(controller, encoder, {
                    id: `demo-${agent.id}-complete`,
                    timestamp: Date.now(),
                    type: "agent_complete",
                    agentId: agent.id,
                    agentName: agent.name,
                    model: agent.model,
                    task: "Completed",
                    tokensUsed: Math.floor(Math.random() * 5000) + 1000,
                    latencyMs: Math.floor(Math.random() * 3000) + 500
                })

                // Collaboration event to next agent
                const nextAgentIndex = agents.indexOf(agent) + 1
                if (nextAgentIndex < agents.length) {
                    sendEvent(controller, encoder, {
                        id: `demo-${agent.id}-collab`,
                        timestamp: Date.now(),
                        type: "collaboration",
                        agentId: agent.id,
                        agentName: agent.name,
                        model: agent.model,
                        task: `Sending output to ${agents[nextAgentIndex].name}`,
                        targetAgent: agents[nextAgentIndex].id
                    })
                }

                await sleep(300)
            }

            // Final completion
            sendEvent(controller, encoder, {
                id: "demo-complete",
                timestamp: Date.now(),
                type: "agent_complete",
                agentId: "system",
                agentName: "System",
                model: "demo",
                task: "Demo complete! All agents finished.",
                output: JSON.stringify({ fileCount: 12, success: true })
            })

            controller.close()
        }
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive"
        }
    })
}

// Helper: Send SSE event
function sendEvent(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    event: AgentEvent
) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
}

// Helper: Sleep
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}
