/**
 * Multi-Agent Orchestrator Core
 * Inspired by Chef's agentic architecture
 * Delegates tasks to specialized AI models for full-stack app generation
 */

import { ModelRouter } from "../ai/router"

export type TaskType =
    | "architecture"
    | "ui-components"
    | "backend-api"
    | "database-schema"
    | "styling"
    | "integration"
    | "testing"

export interface Task {
    id: string
    type: TaskType
    description: string
    dependencies: string[] // IDs of tasks that must complete first
    status: "pending" | "running" | "complete" | "failed"
    assignedAgent?: string
    output?: Artifact
}

export interface Artifact {
    type: "file" | "code" | "config"
    path: string
    content: string
    language?: string
}

export interface ProgressEvent {
    type: "thinking" | "generating" | "complete" | "error"
    agent?: string
    message: string
    file?: string
    progress?: number
    artifact?: Artifact
}

export class AppOrchestrator {
    private router: ModelRouter
    private tasks: Task[] = []
    private artifacts: Artifact[] = []
    private userPrompt: string = ""
    private analysis: string = ""
    private appName: string = ""
    private features: string[] = []
    private components: string[] = []

    constructor(apiKeys: Record<string, string>) {
        this.router = new ModelRouter(apiKeys)
    }

    /**
     * Parse user prompt and create execution plan
     */
    async createExecutionPlan(prompt: string): Promise<Task[]> {
        this.userPrompt = prompt // Store for later use by agents

        // Use Architect Agent to ACTUALLY analyze the prompt
        const planningPrompt = `You are an expert software architect. Analyze this user request and create a detailed development plan.

USER REQUEST: "${prompt}"

Your job:
1. Understand what the user wants to build
2. Break it down into specific, actionable tasks
3. Identify the components, pages, and features needed

Respond with a JSON object in this EXACT format:
{
    "analysis": "Brief summary of what user wants (1-2 sentences)",
    "appName": "Suggested app name",
    "features": ["list of main features"],
    "pages": ["list of pages/routes needed"],
    "components": ["list of React components"],
    "dataModels": ["list of data entities if any"],
    "tasks": [
        {"id": "1", "type": "architecture", "description": "Specific task description"},
        {"id": "2", "type": "ui-components", "description": "Specific task description", "deps": ["1"]},
        {"id": "3", "type": "backend-api", "description": "Specific task description", "deps": ["1"]}
    ]
}

IMPORTANT: Make the task descriptions specific to what the user asked for, not generic.`

        try {
            const result = await this.router.route("architecture-planning", planningPrompt)
            const plan = this.parseExecutionPlan(result.response, prompt)
            this.tasks = plan
            return plan
        } catch (error) {
            console.error("[Orchestrator] Planning failed:", error)
            // Fallback to a smart default based on the prompt
            return this.createFallbackPlan(prompt)
        }
    }

    private parseExecutionPlan(response: string, userPrompt: string): Task[] {
        try {
            // Extract JSON from the response (might be wrapped in markdown)
            let jsonStr = response
            const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
            if (jsonMatch) {
                jsonStr = jsonMatch[1]
            }

            // Try to find JSON object in the response
            const jsonStart = jsonStr.indexOf('{')
            const jsonEnd = jsonStr.lastIndexOf('}')
            if (jsonStart !== -1 && jsonEnd !== -1) {
                jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1)
            }

            const parsed = JSON.parse(jsonStr)

            // Store the analysis for context
            this.analysis = parsed.analysis || `Building: ${userPrompt}`
            this.appName = parsed.appName || "MeganApp"
            this.features = parsed.features || []
            this.components = parsed.components || []

            // Convert to our Task format
            if (parsed.tasks && Array.isArray(parsed.tasks)) {
                return parsed.tasks.map((t: any, index: number) => ({
                    id: t.id || `task-${index + 1}`,
                    type: this.mapTaskType(t.type),
                    description: t.description || `Task ${index + 1} for ${userPrompt}`,
                    dependencies: t.deps || [],
                    status: "pending" as const
                }))
            }
        } catch (error) {
            console.error("[Orchestrator] Failed to parse AI response:", error)
        }

        // If parsing fails, create a smart fallback
        return this.createFallbackPlan(userPrompt)
    }

    private mapTaskType(type: string): TaskType {
        const typeMap: Record<string, TaskType> = {
            "architecture": "architecture",
            "ui": "ui-components",
            "ui-components": "ui-components",
            "frontend": "ui-components",
            "backend": "backend-api",
            "backend-api": "backend-api",
            "api": "backend-api",
            "database": "database-schema",
            "db": "database-schema",
            "style": "styling",
            "styling": "styling",
            "css": "styling",
            "integration": "integration",
            "test": "testing",
            "testing": "testing"
        }
        return typeMap[type.toLowerCase()] || "integration"
    }

    private createFallbackPlan(prompt: string): Task[] {
        // Create a contextual plan based on the prompt
        const lowerPrompt = prompt.toLowerCase()
        const tasks: Task[] = []

        // Always start with architecture
        tasks.push({
            id: "plan-1",
            type: "architecture",
            description: `Analyze and plan: "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"`,
            dependencies: [],
            status: "pending"
        })

        // Add UI task if prompt mentions visual elements
        if (lowerPrompt.includes('app') || lowerPrompt.includes('page') || lowerPrompt.includes('ui') ||
            lowerPrompt.includes('button') || lowerPrompt.includes('form') || lowerPrompt.includes('dashboard')) {
            tasks.push({
                id: "ui-1",
                type: "ui-components",
                description: `Generate UI components for: ${prompt.slice(0, 50)}`,
                dependencies: ["plan-1"],
                status: "pending"
            })
        }

        // Add backend if prompt mentions data, api, auth, etc
        if (lowerPrompt.includes('api') || lowerPrompt.includes('data') || lowerPrompt.includes('user') ||
            lowerPrompt.includes('auth') || lowerPrompt.includes('login') || lowerPrompt.includes('save')) {
            tasks.push({
                id: "backend-1",
                type: "backend-api",
                description: `Create backend services for: ${prompt.slice(0, 50)}`,
                dependencies: ["plan-1"],
                status: "pending"
            })
        }

        // Add integration if we have both UI and backend
        if (tasks.length > 2) {
            tasks.push({
                id: "integrate-1",
                type: "integration",
                description: `Connect all parts together`,
                dependencies: tasks.slice(1).map(t => t.id),
                status: "pending"
            })
        }

        return tasks
    }

    /**
     * Execute the plan and stream progress
     */
    async *execute(): AsyncGenerator<ProgressEvent> {
        // Show intelligent analysis first
        const analysisMessage = this.analysis
            ? `📋 **Understanding your request:**\n${this.analysis}\n\n🏗️ App: ${this.appName}\n📦 Features: ${this.features.slice(0, 3).join(", ")}${this.features.length > 3 ? "..." : ""}`
            : `🔍 Analyzing: "${this.userPrompt.slice(0, 100)}${this.userPrompt.length > 100 ? "..." : ""}"`

        yield {
            type: "thinking",
            agent: "Architect",
            message: analysisMessage
        }

        // Show the plan
        if (this.tasks.length > 0) {
            yield {
                type: "thinking",
                agent: "Architect",
                message: `📝 **Execution Plan:**\n${this.tasks.map((t, i) => `${i + 1}. ${t.description}`).join("\n")}`
            }
        }

        // Execute tasks based on dependencies
        const completedTasks = new Set<string>()

        while (completedTasks.size < this.tasks.length) {
            // Find next runnable task (dependencies met)
            const runnableTask = this.tasks.find(
                task =>
                    task.status === "pending" &&
                    task.dependencies.every(dep => completedTasks.has(dep))
            )

            if (!runnableTask) {
                // Check if we're stuck (circular dependencies or all failed)
                const failedTasks = this.tasks.filter(t => t.status === "failed")
                if (failedTasks.length > 0) {
                    yield {
                        type: "error",
                        message: `Task failed: ${failedTasks[0].description}`
                    }
                    break
                }
                continue
            }

            // Execute the task
            runnableTask.status = "running"

            yield* this.executeTask(runnableTask)

            completedTasks.add(runnableTask.id)
            runnableTask.status = "complete"
        }

        yield {
            type: "complete",
            message: "App generation complete! Ready to deploy.",
        }
    }

    private async *executeTask(task: Task): AsyncGenerator<ProgressEvent> {
        const agentName = this.getAgentForTask(task.type)

        yield {
            type: "generating",
            agent: agentName,
            message: `${agentName} is ${task.description}...`,
            progress: 0
        }

        // Import agents dynamically to avoid circular dependencies
        const { ArchitectAgent } = await import("./agents/architect")
        const { UIAgent } = await import("./agents/ui")
        const { BackendAgent } = await import("./agents/backend")

        try {
            let generatedArtifacts: Artifact[] = []

            switch (task.type) {
                case "architecture":
                    const architectAgent = new ArchitectAgent(this.router.apiKeys);
                    const architectResult = await architectAgent.analyze(
                        task.description
                    );
                    // Type cast workaround for TS inference issue
                    generatedArtifacts = (architectResult as any).artifacts as Artifact[]
                    (task as any).plan = architectResult.plan
                    break

                case "ui-components":
                    const uiAgent = new UIAgent(this.router.apiKeys)
                    const uiPlan = (this.tasks.find(t => t.type === "architecture") as any)?.plan
                    if (uiPlan) {
                        generatedArtifacts = await uiAgent.generateComponents(uiPlan)
                    }
                    break

                case "backend-api":
                    const backendAgent = new BackendAgent(this.router.apiKeys)
                    const backendPlan = (this.tasks.find(t => t.type === "architecture") as any)?.plan
                    if (backendPlan) {
                        const schema = await backendAgent.generateSchema(backendPlan)
                        const apis = await backendAgent.generateAPIs(backendPlan)
                        generatedArtifacts = [schema, ...apis]
                    }
                    break

                default:
                    // Fallback to generic generation
                    for await (const chunk of this.router.routeStream(
                        this.mapTaskTypeToModelTask(task.type),
                        this.buildPromptForTask(task)
                    )) {
                        yield {
                            type: "generating",
                            agent: agentName,
                            message: chunk.chunk,
                            progress: 50
                        }
                    }
            }

            // Store generated artifacts
            this.artifacts.push(...generatedArtifacts)
            task.output = generatedArtifacts[0] // Store first artifact in task

            yield {
                type: "generating",
                agent: agentName,
                message: `✓ Generated ${generatedArtifacts.length} file(s)`,
                progress: 100
            }
        } catch (error) {
            yield {
                type: "error",
                agent: agentName,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
            throw error
        }
    }

    private getAgentForTask(type: TaskType): string {
        const agentMap: Record<TaskType, string> = {
            "architecture": "Architect",
            "ui-components": "UI Designer",
            "backend-api": "Backend Developer",
            "database-schema": "Database Engineer",
            "styling": "Style Master",
            "integration": "Integration Specialist",
            "testing": "QA Engineer"
        }
        return agentMap[type]
    }

    private mapTaskTypeToModelTask(type: TaskType): string {
        const taskMap: Record<TaskType, string> = {
            "architecture": "architecture-planning",
            "ui-components": "ui-generation",
            "backend-api": "code-generation",
            "database-schema": "code-generation",
            "styling": "ui-generation",
            "integration": "code-generation",
            "testing": "code-generation"
        }
        return taskMap[type]
    }

    private buildPromptForTask(task: Task): string {
        // Build context-aware prompt
        return `Task: ${task.description}\n\nGenerate production-ready code for this task.`
    }

    getArtifacts(): Artifact[] {
        return this.tasks
            .filter(t => t.output)
            .map(t => t.output!)
    }
}
