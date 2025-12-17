/**
 * Backend Agent
 * Uses Claude Sonnet for generating API routes and database schemas
 */

import { ModelRouter } from "../../ai/router"
import type { Artifact } from "../core"
import type { ArchitectPlan } from "./architect"

export class BackendAgent {
    private router: ModelRouter

    constructor(apiKeys: Record<string, string>) {
        this.router = new ModelRouter(apiKeys)
    }

    async generateSchema(plan: ArchitectPlan): Promise<Artifact> {
        const systemPrompt = `You are an expert database architect.

Generate a Prisma schema for this application.

Data Models needed: ${plan.dataModels.join(', ')}

Requirements:
- Use Prisma syntax
- Include proper relations
- Add indexes where appropriate
- Include createdAt and updatedAt timestamps
- Add proper field validations

Output ONLY the Prisma schema code, no explanations.`

        const result = await this.router.route(
            "code-generation",
            `${systemPrompt}\n\nContext:\n${JSON.stringify(plan, null, 2)}\n\nGenerate the schema:`
        )

        return {
            type: "code",
            path: "prisma/schema.prisma",
            content: this.cleanCode(result.response),
            language: "prisma"
        }
    }

    async generateAPIs(plan: ArchitectPlan): Promise<Artifact[]> {
        const artifacts: Artifact[] = []

        // Generate API routes for each data model
        for (const model of plan.dataModels) {
            const systemPrompt = `You are an expert Next.js API developer.

Generate CRUD API routes for: ${model}

Requirements:
- Use Next.js 14 App Router (app/api/...)
- Include GET, POST, PUT, DELETE
- Use Prisma for database operations
- Add proper error handling
- Use TypeScript
- Include request validation

Output ONLY the route handler code, no explanations.`

            const result = await this.router.route(
                "code-generation",
                `${systemPrompt}\n\nSchema context:\n${JSON.stringify(plan, null, 2)}\n\nGenerate the API route:`
            )

            artifacts.push({
                type: "code",
                path: `app/api/${this.toKebabCase(model)}/route.ts`,
                content: this.cleanCode(result.response),
                language: "typescript"
            })
        }

        return artifacts
    }

    private toKebabCase(str: string): string {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase()
    }

    private cleanCode(code: string): string {
        const codeBlockMatch = code.match(/```(?:prisma|typescript|ts)?\n([\s\S]*?)\n```/)
        if (codeBlockMatch) {
            return codeBlockMatch[1].trim()
        }
        return code.trim()
    }
}
