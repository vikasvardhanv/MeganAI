/**
 * SEO API
 * POST /api/seo - SEO-specific operations
 */

import { NextRequest, NextResponse } from "next/server"
import { CMOrchestrator } from "@/lib/orchestrator/cm-orchestrator"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action, content, topic, options } = body

        if (!action || !["analyze", "optimize", "meta", "schema", "keywords"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action. Must be: analyze, optimize, meta, schema, or keywords" },
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
            case "analyze":
                if (!content) {
                    return NextResponse.json({ error: "Content required for analyze" }, { status: 400 })
                }
                result = await orchestrator.analyzeSEO(content, options?.targetKeywords)
                break

            case "optimize":
                if (!content) {
                    return NextResponse.json({ error: "Content required for optimize" }, { status: 400 })
                }
                // Use streaming internally
                const events: any[] = []
                for await (const event of orchestrator.optimizeContent(content, options || {})) {
                    events.push(event)
                }
                const gen = orchestrator.optimizeContent(content, options || {})
                while (true) {
                    const { value, done } = await gen.next()
                    if (done) {
                        result = value
                        break
                    }
                }
                break

            case "meta":
                if (!content) {
                    return NextResponse.json({ error: "Content required for meta generation" }, { status: 400 })
                }
                result = await orchestrator.generateMetaTags(content, options?.keyword)
                break

            case "schema":
                if (!content || !options?.type) {
                    return NextResponse.json({ error: "Content and schema type required" }, { status: 400 })
                }
                result = await orchestrator.generateSchema(content, options.type)
                break

            case "keywords":
                if (!topic) {
                    return NextResponse.json({ error: "Topic required for keyword suggestions" }, { status: 400 })
                }
                result = await orchestrator.suggestKeywords(topic)
                break
        }

        return NextResponse.json({
            success: true,
            result
        })

    } catch (error) {
        console.error("SEO error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "SEO operation failed" },
            { status: 500 }
        )
    }
}
