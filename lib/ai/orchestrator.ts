// lib/ai/orchestrator.ts

import { ModelRouter } from "./router"
import { ArchitectAgent } from "./agents/architect"
import { UIDesignerAgent } from "./agents/ui-designer"
import { BackendAgent } from "./agents/backend"
import { IntegratorAgent } from "./agents/integrator"
import {
    SharedContext,
    GenerationResult,
    ProjectConfig,
    ModelUsageLog,
} from "@/types/ai"
import { RouterConfig } from "@/types/models"

export interface OrchestratorConfig {
    apiKeys: Record<string, string>
    routerConfig?: RouterConfig
}

export class Orchestrator {
    private router: ModelRouter
    private architectAgent: ArchitectAgent
    private uiDesignerAgent: UIDesignerAgent
    private backendAgent: BackendAgent
    private integratorAgent: IntegratorAgent

    constructor(config: OrchestratorConfig) {
        // Initialize the multi-model router with user's API keys
        this.router = new ModelRouter(config.apiKeys)

        // Initialize agents with the router
        this.architectAgent = new ArchitectAgent(this.router)
        this.uiDesignerAgent = new UIDesignerAgent(this.router)
        this.backendAgent = new BackendAgent(this.router)
        this.integratorAgent = new IntegratorAgent(this.router)
    }

    // Get which models are available based on user's API keys
    getAvailableModels(): string[] {
        return this.router.getAvailableModels()
    }

    async generateApp(
        prompt: string,
        config: ProjectConfig,
        onProgress?: (status: string, model?: string) => void
    ): Promise<GenerationResult> {
        // Track which models were used for each task
        const modelsUsed: ModelUsageLog[] = []

        // Initialize shared context
        const context: SharedContext = {
            projectName: config.name,
            prompt: prompt,
            framework: config.framework,
            database: config.database,
            files: {},
            dependencies: {},
            apiContracts: {},
        }

        try {
            // Step 1: Architecture Planning
            onProgress?.("🏗️ Planning architecture...", "claude-opus-4")
            const archResult = await this.architectAgent.plan(prompt, config)
            context.architecture = archResult.architecture
            modelsUsed.push({
                task: "architecture",
                model: archResult.model,
                timestamp: new Date(),
            })
            onProgress?.(`✅ Architecture complete (${archResult.model})`)

            // Step 2: Database Schema
            if (config.database !== "NONE") {
                onProgress?.("🗄️ Designing database schema...", "claude-sonnet-4")
                const dbResult = await this.backendAgent.generateSchema(
                    prompt,
                    context.architecture!,
                    config.database
                )
                context.files["prisma/schema.prisma"] = dbResult.schema
                modelsUsed.push({
                    task: "database-schema",
                    model: dbResult.model,
                    timestamp: new Date(),
                })
                onProgress?.(`✅ Database schema complete (${dbResult.model})`)
            }

            // Step 3: Backend/API
            onProgress?.("⚙️ Building backend...", "claude-sonnet-4")
            const backendResult = await this.backendAgent.generate(prompt, context)
            Object.assign(context.files, backendResult.files)
            modelsUsed.push({
                task: "backend-api",
                model: backendResult.model,
                timestamp: new Date(),
            })
            onProgress?.(`✅ Backend complete (${backendResult.model})`)

            // Step 4: UI Components
            onProgress?.("🎨 Designing interface...", "gpt-4o")
            const uiResult = await this.uiDesignerAgent.generate(prompt, context)
            Object.assign(context.files, uiResult.files)
            modelsUsed.push({
                task: "ui-design",
                model: uiResult.model,
                timestamp: new Date(),
            })
            onProgress?.(`✅ UI design complete (${uiResult.model})`)

            // Step 5: Integration & Review
            onProgress?.("🔧 Integrating & reviewing...", "claude-opus-4")
            const integrationResult = await this.integratorAgent.assemble(context)
            modelsUsed.push({
                task: "integration",
                model: integrationResult.model,
                timestamp: new Date(),
            })
            onProgress?.(`✅ Integration complete (${integrationResult.model})`)

            // Step 6: Generate package.json and configs
            onProgress?.("📦 Finalizing project...")
            const configFiles = this.generateConfigFiles(context)
            Object.assign(integrationResult.files, configFiles)

            return {
                success: true,
                files: integrationResult.files,
                dependencies: context.dependencies,
                modelsUsed,
            }
        } catch (error) {
            console.error("Generation failed:", error)
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                files: {},
                modelsUsed,
            }
        }
    }

    private generateConfigFiles(context: SharedContext): Record<string, string> {
        const packageJson = {
            name: context.projectName.toLowerCase().replace(/\s+/g, "-"),
            version: "0.1.0",
            private: true,
            scripts: {
                dev: "next dev",
                build: "next build",
                start: "next start",
                lint: "next lint",
                "db:push": "prisma db push",
                "db:generate": "prisma generate",
            },
            dependencies: {
                next: "14.0.0",
                react: "^18",
                "react-dom": "^18",
                "@prisma/client": "^5.0.0",
                ...context.dependencies,
            },
            devDependencies: {
                typescript: "^5",
                "@types/node": "^20",
                "@types/react": "^18",
                tailwindcss: "^3.3.0",
                prisma: "^5.0.0",
            },
        }

        return {
            "package.json": JSON.stringify(packageJson, null, 2),
            "tsconfig.json": this.getTsConfig(),
            ".env.example": this.getEnvExample(),
        }
    }

    private getTsConfig(): string {
        return JSON.stringify(
            {
                compilerOptions: {
                    target: "ES2017",
                    lib: ["dom", "dom.iterable", "esnext"],
                    allowJs: true,
                    skipLibCheck: true,
                    strict: true,
                    forceConsistentCasingInFileNames: true,
                    noEmit: true,
                    esModuleInterop: true,
                    module: "esnext",
                    moduleResolution: "node",
                    resolveJsonModule: true,
                    isolatedModules: true,
                    jsx: "preserve",
                    incremental: true,
                    plugins: [{ name: "next" }],
                    paths: { "@/*": ["./*"] },
                },
                include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
                exclude: ["node_modules"],
            },
            null,
            2
        )
    }

    private getEnvExample(): string {
        return `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Add other env vars as needed
`
    }
}
