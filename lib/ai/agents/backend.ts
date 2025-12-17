// lib/ai/agents/backend.ts

import { ModelRouter } from "../router"
import { BACKEND_SYSTEM_PROMPT } from "../prompts/system-prompts"
import { SharedContext, Architecture } from "@/types/ai"

export class BackendAgent {
    private router: ModelRouter

    constructor(router: ModelRouter) {
        this.router = router
    }

    async generateSchema(
        prompt: string,
        architecture: Architecture,
        databaseType: string
    ): Promise<{ schema: string; model: string }> {
        const fullPrompt = `
${BACKEND_SYSTEM_PROMPT}

Project: ${prompt}
Database Type: ${databaseType}
Architecture: ${JSON.stringify(architecture, null, 2)}

Generate a complete Prisma schema including:
1. All models with proper relations
2. Appropriate field types
3. Indexes for performance
4. Enums where needed
5. Audit fields (createdAt, updatedAt)

Output ONLY the Prisma schema content (no JSON wrapper, no markdown code blocks).
Start with "generator client {" and end with the last model definition.
    `

        // Route to best model for database schema (Claude Sonnet is primary)
        const result = await this.router.route("database-schema", fullPrompt)

        return {
            schema: result.response,
            model: result.model,
        }
    }

    async generate(
        prompt: string,
        context: SharedContext
    ): Promise<{ files: Record<string, string>; model: string }> {
        const fullPrompt = `
${BACKEND_SYSTEM_PROMPT}

Project: ${prompt}
Architecture: ${JSON.stringify(context.architecture, null, 2)}
Existing Schema: ${context.files["prisma/schema.prisma"] || "No schema yet"}

Generate complete backend code including:
1. API routes (Next.js App Router format: app/api/[route]/route.ts)
2. Server actions (if applicable)
3. Database queries (Prisma)
4. Input validation (Zod schemas)
5. Authentication middleware
6. Error handling utilities

Output as JSON with file paths as keys and code as values.
Example: { "app/api/users/route.ts": "import { NextResponse }..." }
    `

        // Route to best model for API generation (Claude Sonnet is primary)
        const result = await this.router.route("api-generation", fullPrompt)

        try {
            const jsonMatch = result.response.match(/\{[\s\S]*\}/)
            const files = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
            return { files, model: result.model }
        } catch {
            return { files: {}, model: result.model }
        }
    }
}
