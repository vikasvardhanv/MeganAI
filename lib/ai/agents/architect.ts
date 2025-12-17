// lib/ai/agents/architect.ts

import { ModelRouter } from "../router"
import { ARCHITECT_SYSTEM_PROMPT } from "../prompts/system-prompts"
import { ProjectConfig, Architecture } from "@/types/ai"

export class ArchitectAgent {
    private router: ModelRouter

    constructor(router: ModelRouter) {
        this.router = router
    }

    async plan(
        prompt: string,
        config: ProjectConfig
    ): Promise<{ architecture: Architecture; model: string }> {
        const fullPrompt = `
${ARCHITECT_SYSTEM_PROMPT}

Project Request: ${prompt}

Configuration:
- Framework: ${config.framework}
- Database: ${config.database}

Create a detailed architecture plan including:
1. File structure (every file path that will be created)
2. Component hierarchy (parent-child relationships)
3. Data models (all entities with fields and types)
4. API endpoints (method, path, request/response types)
5. State management approach
6. Third-party integrations needed
7. Environment variables required

Output as JSON with this exact structure:
{
  "fileStructure": { "directories": [], "files": [] },
  "components": { "pages": [], "shared": [], "features": [] },
  "dataModels": [],
  "apiEndpoints": [],
  "stateManagement": {},
  "integrations": [],
  "envVars": []
}
    `

        // Route to best model for architecture (Claude Opus is primary)
        const result = await this.router.route("architecture-planning", fullPrompt)

        try {
            const jsonMatch = result.response.match(/\{[\s\S]*\}/)
            const architecture = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
            return {
                architecture,
                model: result.model,
            }
        } catch {
            return {
                architecture: {
                    fileStructure: { directories: [], files: [] },
                    components: { pages: [], shared: [], features: [] },
                    dataModels: [],
                    apiEndpoints: [],
                    stateManagement: {},
                    integrations: [],
                    envVars: [],
                },
                model: result.model,
            }
        }
    }
}
