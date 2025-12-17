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

    constructor(apiKeys: Record<string, string>) {
        this.router = new ModelRouter(apiKeys)
    }

    /**
     * Parse user prompt and create execution plan
     */
    async createExecutionPlan(prompt: string): Promise<Task[]> {
        // Use Architect Agent (Claude Opus) to analyze prompt
        const planningPrompt = `You are an expert software architect. Analyze this user request and break it down into specific development tasks.

User Request: ${prompt}

Generate a structured plan with:
1. App architecture (routes, components, data flow)
2. UI components needed
3. Backend APIs/routes
4. Database schema
5. Styling approach
6. Integration steps

Return a JSON array of tasks with: type, description, dependencies.`

        const result = await this.router.route("architecture-planning", planningPrompt)

        // Parse the result into tasks
        const plan = this.parseExecutionPlan(result.response)
        this.tasks = plan
        return plan
    }

    private parseExecutionPlan(response: string): Task[] {
        // TODO: Parse AI response into structured tasks
        // For now, return a basic plan
        return [
            {
                id: "arch-1",
                type: "architecture",
                description: "Design app structure",
                dependencies: [],
                status: "pending"
            },
            {
                id: "ui-1",
                type: "ui-components",
                description: "Generate UI components",
                dependencies: ["arch-1"],
                status: "pending"
            },
            {
                id: "backend-1",
                type: "backend-api",
                description: "Create API routes",
                dependencies: ["arch-1"],
                status: "pending"
            },
            {
                id: "integration-1",
                type: "integration",
                description: "Wire everything together",
                dependencies: ["ui-1", "backend-1"],
                status: "pending"
            }
        ]
    }

    /**
     * Execute the plan and stream progress
     */
    async *execute(): AsyncGenerator<ProgressEvent> {
        yield {
            type: "thinking",
            agent: "Architect",
            message: "Analyzing your request and creating execution plan..."
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

        // Route to appropriate model
        const modelTask = this.mapTaskTypeToModelTask(task.type)
        const prompt = this.buildPromptForTask(task)

        let progress = 0
        for await (const chunk of this.router.routeStream(modelTask, prompt)) {
            progress += 10
            yield {
                type: "generating",
                agent: agentName,
                message: chunk.chunk,
                progress: Math.min(progress, 100)
            }
        }

        // For now, mark as complete
        // TODO: Actually generate artifacts
        task.output = {
            type: "code",
            path: `src/${task.type}.ts`,
            content: "// Generated code placeholder",
            language: "typescript"
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
