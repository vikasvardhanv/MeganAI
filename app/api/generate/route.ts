import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ModelRouter } from "@/lib/ai/router"

// Force dynamic since we read request body
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { prompt, task = "code-generation", model } = await req.json()

        // Initialize Router with keys
        const router = new ModelRouter({
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
            OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
            GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || "",
            STABILITY_API_KEY: process.env.STABILITY_API_KEY || "",
            IDEOGRAM_API_KEY: process.env.IDEOGRAM_API_KEY || "",
        })

        // Prepare stream
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const generator = router.routeStream(task, prompt, {
                        // We could pass preference for speed/cost here properly
                    })

                    for await (const chunk of generator) {
                        // Check if chunk is an object or string
                        const text = typeof chunk === 'string' ? chunk : chunk.chunk
                        controller.enqueue(encoder.encode(text))
                    }
                    controller.close()
                } catch (error) {
                    console.error("Streaming error:", error)
                    controller.error(error)
                }
            },
        })

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        })
    } catch (error) {
        console.error("Generation error:", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
