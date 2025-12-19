/**
 * Streaming Orchestrator
 * Event-driven orchestrator that emits real-time updates for the Agent Board
 * Implements parallel execution and streaming inspired by v0 and Lovable
 */

import { EventEmitter } from "events"
import { ModelRouter, RouteResult } from "./router"
import { ArchitectAgent } from "./agents/architect"
import { UIDesignerAgent } from "./agents/ui-designer"
import { BackendAgent } from "./agents/backend"
import { IntegratorAgent } from "./agents/integrator"
import {
    SharedContext,
    GenerationResult,
    ProjectConfig,
} from "@/types/ai"
import {
    AgentEvent,
    AgentEventType,
    GenerationPhase
} from "@/types/agent"

export interface StreamingOrchestratorConfig {
    apiKeys: Record<string, string>
    enableParallel?: boolean
    enableStreaming?: boolean
}

export class StreamingOrchestrator {
    private router: ModelRouter
    private architectAgent: ArchitectAgent
    private uiDesignerAgent: UIDesignerAgent
    private backendAgent: BackendAgent
    private integratorAgent: IntegratorAgent
    private eventEmitter = new EventEmitter()
    private enableParallel: boolean
    private enableStreaming: boolean

    constructor(config: StreamingOrchestratorConfig) {
        this.router = new ModelRouter(config.apiKeys)
        this.architectAgent = new ArchitectAgent(this.router)
        this.uiDesignerAgent = new UIDesignerAgent(this.router)
        this.backendAgent = new BackendAgent(this.router)
        this.integratorAgent = new IntegratorAgent(this.router)
        this.enableParallel = config.enableParallel ?? true
        this.enableStreaming = config.enableStreaming ?? true
    }

    // Subscribe to agent events
    onEvent(callback: (event: AgentEvent) => void): () => void {
        this.eventEmitter.on("agent", callback)
        return () => this.eventEmitter.off("agent", callback)
    }

    // Emit an agent event
    private emit(event: Omit<AgentEvent, "id" | "timestamp">): void {
        const fullEvent: AgentEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            timestamp: Date.now(),
            ...event
        }
        this.eventEmitter.emit("agent", fullEvent)
    }

    // Get available models
    getAvailableModels(): string[] {
        return this.router.getAvailableModels()
    }

    // Main generation method with AsyncGenerator for streaming events
    async *generateApp(
        prompt: string,
        config: ProjectConfig
    ): AsyncGenerator<AgentEvent, GenerationResult> {
        const context: SharedContext = {
            projectName: config.name,
            prompt: prompt,
            framework: config.framework,
            database: config.database,
            files: {},
            dependencies: {},
            apiContracts: {},
        }

        const modelsUsed: Array<{ task: string; model: string; timestamp: Date }> = []

        try {
            // ========== PHASE 1: ARCHITECTURE ==========
            yield this.createEvent("agent_start", "agent-architect", "Architect", "claude-opus-4", "Analyzing requirements and planning architecture...")

            const archResult = await this.architectAgent.plan(prompt, config)
            context.architecture = archResult.architecture
            modelsUsed.push({ task: "architecture", model: archResult.model, timestamp: new Date() })

            yield this.createEvent("agent_complete", "agent-architect", "Architect", archResult.model, "Architecture planning", 0, undefined, undefined, 2500)

            // Collaboration: Architect sends to Backend & UI Designer
            yield this.createEvent("collaboration", "agent-architect", "Architect", archResult.model, "Sending architecture to Backend", undefined, undefined, 0, 0, "agent-backend")
            yield this.createEvent("collaboration", "agent-architect", "Architect", archResult.model, "Sending architecture to UI Designer", undefined, undefined, 0, 0, "agent-ui-designer")

            // ========== PHASE 2: PARALLEL EXECUTION (Backend + UI) ==========
            if (this.enableParallel) {
                // Run Backend and UI Designer in parallel
                const [backendFiles, uiFiles] = await Promise.all([
                    this.runBackendAgent(context, config, modelsUsed),
                    this.runUIAgent(context, modelsUsed)
                ])

                // Emit events for parallel execution
                for (const event of backendFiles.events) {
                    yield event
                }
                for (const event of uiFiles.events) {
                    yield event
                }

                Object.assign(context.files, backendFiles.files)
                Object.assign(context.files, uiFiles.files)
            } else {
                // Sequential execution
                yield this.createEvent("agent_start", "agent-backend", "Backend", "claude-sonnet-4", "Generating backend code...")

                if (config.database !== "NONE") {
                    const dbResult = await this.backendAgent.generateSchema(prompt, context.architecture!, config.database)
                    context.files["prisma/schema.prisma"] = dbResult.schema
                    modelsUsed.push({ task: "database-schema", model: dbResult.model, timestamp: new Date() })
                    yield this.createEvent("file_generated", "agent-backend", "Backend", dbResult.model, "Database schema", undefined, dbResult.schema, 0, 0, undefined, "prisma/schema.prisma")
                }

                const backendResult = await this.backendAgent.generate(prompt, context)
                Object.assign(context.files, backendResult.files)
                modelsUsed.push({ task: "backend-api", model: backendResult.model, timestamp: new Date() })

                yield this.createEvent("agent_complete", "agent-backend", "Backend", backendResult.model, "Backend generation complete", 0, undefined, 3500)

                // Then UI Designer
                yield this.createEvent("agent_start", "agent-ui-designer", "UI Designer", "gpt-4o", "Designing user interface...")

                const uiResult = await this.uiDesignerAgent.generate(prompt, context)
                Object.assign(context.files, uiResult.files)
                modelsUsed.push({ task: "ui-design", model: uiResult.model, timestamp: new Date() })

                yield this.createEvent("agent_complete", "agent-ui-designer", "UI Designer", uiResult.model, "UI design complete", 0, undefined, 4200)
            }

            // ========== PHASE 3: INTEGRATION ==========
            yield this.createEvent("agent_start", "agent-integrator", "Integrator", "claude-opus-4", "Assembling and reviewing all components...")

            // Receive from other agents
            yield this.createEvent("collaboration", "agent-backend", "Backend", "claude-sonnet-4", "Sending files to Integrator", undefined, undefined, 0, 0, "agent-integrator")
            yield this.createEvent("collaboration", "agent-ui-designer", "UI Designer", "gpt-4o", "Sending files to Integrator", undefined, undefined, 0, 0, "agent-integrator")

            const integrationResult = await this.integratorAgent.assemble(context)
            modelsUsed.push({ task: "integration", model: integrationResult.model, timestamp: new Date() })

            // Generate file events for each file
            for (const [path, content] of Object.entries(integrationResult.files)) {
                yield this.createEvent("file_generated", "agent-integrator", "Integrator", integrationResult.model, `Generated ${path}`, undefined, content, 0, 0, undefined, path)
            }

            yield this.createEvent("agent_complete", "agent-integrator", "Integrator", integrationResult.model, "Integration complete", 0, undefined, 5000)

            // Generate config files
            const configFiles = this.generateConfigFiles(context)
            Object.assign(integrationResult.files, configFiles)

            return {
                success: true,
                files: integrationResult.files,
                dependencies: context.dependencies,
                modelsUsed: modelsUsed.map(m => ({ ...m, timestamp: m.timestamp }))
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error"
            yield this.createEvent("agent_error", "agent-integrator", "Integrator", "unknown", errorMessage, undefined, undefined, 0, 0, undefined, undefined, errorMessage)

            return {
                success: false,
                error: errorMessage,
                files: {},
                modelsUsed
            }
        }
    }

    // Helper to run backend agent with events
    private async runBackendAgent(
        context: SharedContext,
        config: ProjectConfig,
        modelsUsed: Array<{ task: string; model: string; timestamp: Date }>
    ): Promise<{ files: Record<string, string>; events: AgentEvent[] }> {
        const events: AgentEvent[] = []
        const files: Record<string, string> = {}

        events.push(this.createEvent("agent_start", "agent-backend", "Backend", "claude-sonnet-4", "Generating backend code..."))

        if (config.database !== "NONE") {
            const dbResult = await this.backendAgent.generateSchema(context.prompt, context.architecture!, config.database)
            files["prisma/schema.prisma"] = dbResult.schema
            modelsUsed.push({ task: "database-schema", model: dbResult.model, timestamp: new Date() })
            events.push(this.createEvent("file_generated", "agent-backend", "Backend", dbResult.model, "Database schema", undefined, dbResult.schema, 0, 0, undefined, "prisma/schema.prisma"))
        }

        const backendResult = await this.backendAgent.generate(context.prompt, context)
        Object.assign(files, backendResult.files)
        modelsUsed.push({ task: "backend-api", model: backendResult.model, timestamp: new Date() })

        for (const [path, content] of Object.entries(backendResult.files)) {
            events.push(this.createEvent("file_generated", "agent-backend", "Backend", backendResult.model, `Generated ${path}`, undefined, content, 0, 0, undefined, path))
        }

        events.push(this.createEvent("agent_complete", "agent-backend", "Backend", backendResult.model, "Backend generation complete", 3500))

        return { files, events }
    }

    // Helper to run UI agent with events
    private async runUIAgent(
        context: SharedContext,
        modelsUsed: Array<{ task: string; model: string; timestamp: Date }>
    ): Promise<{ files: Record<string, string>; events: AgentEvent[] }> {
        const events: AgentEvent[] = []
        const files: Record<string, string> = {}

        events.push(this.createEvent("agent_start", "agent-ui-designer", "UI Designer", "gpt-4o", "Designing user interface..."))

        const uiResult = await this.uiDesignerAgent.generate(context.prompt, context)
        Object.assign(files, uiResult.files)
        modelsUsed.push({ task: "ui-design", model: uiResult.model, timestamp: new Date() })

        for (const [path, content] of Object.entries(uiResult.files)) {
            events.push(this.createEvent("file_generated", "agent-ui-designer", "UI Designer", uiResult.model, `Generated ${path}`, undefined, content, 0, 0, undefined, path))
        }

        events.push(this.createEvent("agent_complete", "agent-ui-designer", "UI Designer", uiResult.model, "UI design complete", 4200))

        return { files, events }
    }

    // Create an agent event
    private createEvent(
        type: AgentEventType,
        agentId: string,
        agentName: string,
        model: string,
        task: string,
        progress?: number,
        output?: string,
        tokensUsed?: number,
        latencyMs?: number,
        targetAgent?: string,
        fileName?: string,
        error?: string
    ): AgentEvent {
        return {
            id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            timestamp: Date.now(),
            type,
            agentId,
            agentName,
            model,
            task,
            progress,
            output,
            tokensUsed,
            latencyMs,
            targetAgent,
            fileName,
            error
        }
    }

    // Generate config files
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
            "tsconfig.json": JSON.stringify({
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
            }, null, 2),
            ".env.example": `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
`,
        }
    }
}
