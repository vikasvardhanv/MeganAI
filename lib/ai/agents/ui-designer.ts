// lib/ai/agents/ui-designer.ts

import { ModelRouter } from "../router"
import { UI_DESIGNER_SYSTEM_PROMPT } from "../prompts/system-prompts"
import { SharedContext } from "@/types/ai"

export class UIDesignerAgent {
    private router: ModelRouter

    constructor(router: ModelRouter) {
        this.router = router
    }

    async generate(
        prompt: string,
        context: SharedContext
    ): Promise<{ files: Record<string, string>; model: string }> {
        const fullPrompt = `
${UI_DESIGNER_SYSTEM_PROMPT}

Project: ${prompt}

Architecture:
${JSON.stringify(context.architecture, null, 2)}

DESIGN RULES (CRITICAL):
1. NO purple gradients - use unique color palettes
2. NO generic AI aesthetic
3. Create distinctive, memorable designs
4. Use shadcn/ui components but customize them
5. Include proper dark mode support
6. Mobile-first responsive design

COLOR PALETTE OPTIONS (pick ONE that fits the vibe):
- Warm: Terracotta (#E07A5F) + Cream (#F4F1DE) + Forest (#3D405B)
- Bold: Charcoal (#264653) + Coral (#E76F51) + Gold (#E9C46A)
- Cool: Slate (#475569) + Ice Blue (#7DD3FC) + Copper (#C27D52)
- Minimal: Off-white (#FAFAF9) + Black (#18181B) + Sage (#84CC16)
- Dark: Deep Navy (#0F172A) + Electric Teal (#2DD4BF) + Amber (#F59E0B)

Generate React/TypeScript components for all UI pages and components.
Output as JSON with file paths as keys and code as values.
Example: { "components/ui/Button.tsx": "export function Button..." }
    `

        // Route to best model for UI design (GPT-4o is primary)
        const result = await this.router.route("ui-component-design", fullPrompt)

        try {
            const jsonMatch = result.response.match(/\{[\s\S]*\}/)
            const files = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
            return { files, model: result.model }
        } catch {
            return { files: {}, model: result.model }
        }
    }
}
