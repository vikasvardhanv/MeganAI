/**
 * UI Agent
 * Uses GPT-4 for generating React components
 */

import { ModelRouter } from "../../ai/router"
import type { Artifact } from "../core"
import type { ArchitectPlan } from "./architect"

export class UIAgent {
    private router: ModelRouter

    constructor(apiKeys: Record<string, string>) {
        this.router = new ModelRouter(apiKeys)
    }

    async generateComponents(plan: ArchitectPlan): Promise<Artifact[]> {
        const artifacts: Artifact[] = []

        for (const componentName of plan.components) {
            const systemPrompt = `You are an expert React/Next.js developer.

Generate a production-ready TypeScript component for: ${componentName}

Requirements:
- Use TypeScript with proper types
- Use Tailwind CSS for styling
- Follow Next.js 14 best practices
- Use "use client" directive if client-side features needed
- Include proper imports
- Add JSDoc comments

Output ONLY the component code, no explanations.`

            const result = await this.router.route(
                "ui-generation",
                `${systemPrompt}\n\nContext from architecture:\n${JSON.stringify(plan, null, 2)}\n\nGenerate the ${componentName} component:`
            )

            artifacts.push({
                type: "code",
                path: `components/${this.toKebabCase(componentName)}.tsx`,
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
        // Remove markdown code blocks if present
        const codeBlockMatch = code.match(/```(?:tsx?|typescript|jsx?)?\n([\s\S]*?)\n```/)
        if (codeBlockMatch) {
            return codeBlockMatch[1].trim()
        }
        return code.trim()
    }
}
