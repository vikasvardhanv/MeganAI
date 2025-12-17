// lib/ai/agents/integrator.ts

import { ModelRouter } from "../router"
import { INTEGRATOR_SYSTEM_PROMPT } from "../prompts/system-prompts"
import { SharedContext } from "@/types/ai"

export class IntegratorAgent {
    private router: ModelRouter

    constructor(router: ModelRouter) {
        this.router = router
    }

    async assemble(
        context: SharedContext
    ): Promise<{
        files: Record<string, string>
        model: string
        issues: string[]
    }> {
        const fullPrompt = `
${INTEGRATOR_SYSTEM_PROMPT}

Project: ${context.projectName}
Framework: ${context.framework}
Database: ${context.database}

Current files to integrate:
${JSON.stringify(Object.keys(context.files), null, 2)}

File contents:
${JSON.stringify(context.files, null, 2)}

Your tasks:
1. Review ALL files for consistency
2. Fix any import errors
3. Resolve type mismatches
4. Add any missing "glue" code
5. Ensure all components connect properly
6. Verify API contracts match between frontend and backend
7. Add proper error boundaries
8. Generate index files where needed

Output as JSON:
{
  "files": { "path": "content", ... },
  "issues": ["list of issues found and fixed"],
  "warnings": ["list of potential issues to watch"]
}
    `

        // Route to Claude Opus for thorough code review and integration
        const result = await this.router.route("code-review", fullPrompt)

        try {
            const jsonMatch = result.response.match(/\{[\s\S]*\}/)
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { files: {}, issues: [] }
            return {
                files: parsed.files || context.files,
                model: result.model,
                issues: parsed.issues || [],
            }
        } catch {
            return {
                files: context.files,
                model: result.model,
                issues: [],
            }
        }
    }
}
