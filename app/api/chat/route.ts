import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ModelRouter } from "@/lib/ai/router"

export const dynamic = "force-dynamic"

interface Message {
    role: "user" | "assistant" | "system"
    content: string
}

interface ConversationState {
    phase: "gathering" | "planning" | "building" | "complete"
    projectSpec?: {
        name?: string
        description?: string
        features?: string[]
        techStack?: Record<string, string>
        pages?: string[]
        dataModels?: string[]
    }
    missingInfo?: string[]
    plan?: any
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { messages, state } = body as { messages: Message[], state?: ConversationState }

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: "Messages required" }, { status: 400 })
        }

        const apiKeys = {
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
            OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
            GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || "",
        }

        const hasAnyKey = Object.values(apiKeys).some(k => k.length > 0)
        if (!hasAnyKey) {
            return NextResponse.json({
                error: "No AI API keys configured"
            }, { status: 500 })
        }

        const router = new ModelRouter(apiKeys)
        const currentState = state || { phase: "gathering" }

        // Build conversation context
        const conversationHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")
        const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || ""

        // Determine what to do based on phase
        const systemPrompt = buildSystemPrompt(currentState)
        const fullPrompt = `${systemPrompt}

CONVERSATION HISTORY:
${conversationHistory}

Based on the conversation, respond appropriately. 
- If you need more info, ask a question
- If you have enough info, summarize the plan
- Only start building when confident you understand

Respond in this JSON format:
{
    "action": "ask_question" | "summarize_plan" | "start_building",
    "message": "Your response to the user",
    "updatedSpec": { /* any project spec updates */ },
    "missingInfo": ["list of things you still need to know"],
    "confidence": 0-100
}`

        const result = await router.route("architecture-planning", fullPrompt)

        // Parse AI response
        let response: any
        try {
            const jsonMatch = result.response.match(/\{[\s\S]*\}/)
            response = jsonMatch ? JSON.parse(jsonMatch[0]) : {
                action: "ask_question",
                message: result.response,
                confidence: 50
            }
        } catch {
            response = {
                action: "ask_question",
                message: result.response,
                confidence: 50
            }
        }

        // Update state based on action
        let newState: ConversationState = { ...currentState }

        if (response.updatedSpec) {
            newState.projectSpec = { ...newState.projectSpec, ...response.updatedSpec }
        }
        if (response.missingInfo) {
            newState.missingInfo = response.missingInfo
        }

        // Advance phase based on confidence
        if (response.action === "start_building" || response.confidence >= 80) {
            newState.phase = "planning"
        }

        return NextResponse.json({
            message: response.message,
            action: response.action,
            state: newState,
            confidence: response.confidence || 50
        })

    } catch (error) {
        console.error("[Chat] Error:", error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal error"
        }, { status: 500 })
    }
}

function buildSystemPrompt(state: ConversationState): string {
    return `You are Megan, an expert AI software architect and developer. Your personality:
- Friendly but professional
- Ask smart, focused questions
- Don't overwhelm users with too many questions at once
- Remember context from the conversation
- Be decisive when you have enough information

Current project understanding:
${JSON.stringify(state.projectSpec || {}, null, 2)}

${state.missingInfo?.length ? `Still need to understand: ${state.missingInfo.join(", ")}` : ""}

Your goal: Help the user define their app clearly, then build it.

IMPORTANT GUIDELINES:
1. If this is the first message, greet and ask about the core purpose
2. Ask 1-2 focused questions at a time, not a list
3. When you understand the core app (name, purpose, 2-3 features), offer to start building
4. Be conversational, not robotic
5. Remember what they already told you - don't re-ask!`
}
