import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AppOrchestrator } from "@/lib/orchestrator/core"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { prompt } = await req.json()

        // Initialize orchestrator
        const orchestrator = new AppOrchestrator({
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
            OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
            GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || "",
        })

        // Create execution plan
        await orchestrator.createExecutionPlan(prompt)

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
                    console.error("Orchestration error:", error)
                    controller.error(error)
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
        console.error("Orchestration API error:", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
