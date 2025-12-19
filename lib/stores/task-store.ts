/**
 * Task Store
 * Zustand store for managing execution tasks in the Kanban board
 */

import { create } from "zustand"

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "ERROR"

export interface ExecutionTask {
    id: string
    title: string
    description: string
    status: TaskStatus
    agent: string
    agentEmoji: string
    progress: number
    startedAt?: Date
    completedAt?: Date
    duration?: number // in milliseconds
    filesGenerated: string[]
    error?: string
}

export interface AgentState {
    id: string
    name: string
    emoji: string
    status: "idle" | "thinking" | "generating" | "complete" | "error"
    currentTask?: string
    model?: string
    tokensUsed: number
    filesGenerated: string[]
    lastOutput?: string
}

interface TaskStore {
    // Tasks
    tasks: ExecutionTask[]
    addTask: (task: Omit<ExecutionTask, "id" | "status" | "progress" | "filesGenerated">) => string
    updateTask: (id: string, updates: Partial<ExecutionTask>) => void
    startTask: (id: string) => void
    completeTask: (id: string, filesGenerated?: string[]) => void
    failTask: (id: string, error: string) => void
    clearTasks: () => void

    // Agents
    agents: AgentState[]
    updateAgent: (id: string, updates: Partial<AgentState>) => void
    resetAgents: () => void

    // Derived state
    getTasksByStatus: (status: TaskStatus) => ExecutionTask[]
    getCurrentTask: () => ExecutionTask | undefined
    getAgentById: (id: string) => AgentState | undefined
}

// Default agents
const DEFAULT_AGENTS: AgentState[] = [
    {
        id: "architect",
        name: "Architect",
        emoji: "🏗️",
        status: "idle",
        model: "claude-opus",
        tokensUsed: 0,
        filesGenerated: []
    },
    {
        id: "ui-designer",
        name: "UI Designer",
        emoji: "🎨",
        status: "idle",
        model: "gpt-4o",
        tokensUsed: 0,
        filesGenerated: []
    },
    {
        id: "backend",
        name: "Backend",
        emoji: "⚙️",
        status: "idle",
        model: "claude-sonnet",
        tokensUsed: 0,
        filesGenerated: []
    },
    {
        id: "integrator",
        name: "Integrator",
        emoji: "🔧",
        status: "idle",
        model: "claude-opus",
        tokensUsed: 0,
        filesGenerated: []
    }
]

export const useTaskStore = create<TaskStore>((set, get) => ({
    tasks: [],
    agents: [...DEFAULT_AGENTS],

    addTask: (task) => {
        const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const newTask: ExecutionTask = {
            ...task,
            id,
            status: "TODO",
            progress: 0,
            filesGenerated: []
        }

        set((state) => ({
            tasks: [...state.tasks, newTask]
        }))

        return id
    },

    updateTask: (id, updates) => {
        set((state) => ({
            tasks: state.tasks.map((task) =>
                task.id === id ? { ...task, ...updates } : task
            )
        }))
    },

    startTask: (id) => {
        set((state) => ({
            tasks: state.tasks.map((task) =>
                task.id === id
                    ? { ...task, status: "IN_PROGRESS" as TaskStatus, startedAt: new Date(), progress: 10 }
                    : task
            )
        }))
    },

    completeTask: (id, filesGenerated = []) => {
        const task = get().tasks.find((t) => t.id === id)
        const completedAt = new Date()
        const duration = task?.startedAt
            ? completedAt.getTime() - task.startedAt.getTime()
            : undefined

        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id
                    ? {
                        ...t,
                        status: "DONE" as TaskStatus,
                        completedAt,
                        duration,
                        progress: 100,
                        filesGenerated: [...t.filesGenerated, ...filesGenerated]
                    }
                    : t
            )
        }))
    },

    failTask: (id, error) => {
        set((state) => ({
            tasks: state.tasks.map((task) =>
                task.id === id
                    ? { ...task, status: "ERROR" as TaskStatus, error }
                    : task
            )
        }))
    },

    clearTasks: () => {
        set({ tasks: [] })
    },

    updateAgent: (id, updates) => {
        set((state) => ({
            agents: state.agents.map((agent) =>
                agent.id === id ? { ...agent, ...updates } : agent
            )
        }))
    },

    resetAgents: () => {
        set({ agents: [...DEFAULT_AGENTS] })
    },

    getTasksByStatus: (status) => {
        return get().tasks.filter((task) => task.status === status)
    },

    getCurrentTask: () => {
        return get().tasks.find((task) => task.status === "IN_PROGRESS")
    },

    getAgentById: (id) => {
        return get().agents.find((agent) => agent.id === id)
    }
}))

/**
 * Helper to map SSE events to task store updates
 */
export function processSSEEvent(event: {
    type: string
    agent?: string
    message?: string
    progress?: number
    path?: string
    content?: string
}) {
    const store = useTaskStore.getState()

    // Map agent names to IDs
    const agentNameToId: Record<string, string> = {
        Architect: "architect",
        "UI Designer": "ui-designer",
        "Backend Developer": "backend",
        Integrator: "integrator"
    }

    const agentId = event.agent ? agentNameToId[event.agent] || event.agent.toLowerCase() : undefined

    switch (event.type) {
        case "thinking":
            if (agentId) {
                store.updateAgent(agentId, {
                    status: "thinking",
                    currentTask: event.message
                })
            }
            // Create task from thinking message if it looks like a plan
            if (event.message?.includes("Execution Plan")) {
                // Parse plan items into tasks
                const lines = event.message.split("\n")
                lines.forEach((line, index) => {
                    const match = line.match(/^\d+\.\s+(.+)$/)
                    if (match) {
                        const emoji = agentId ? store.getAgentById(agentId)?.emoji || "📋" : "📋"
                        store.addTask({
                            title: match[1].slice(0, 50),
                            description: match[1],
                            agent: event.agent || "System",
                            agentEmoji: emoji
                        })
                    }
                })
            }
            break

        case "generating":
        case "agent_start":
            if (agentId) {
                store.updateAgent(agentId, {
                    status: "generating",
                    currentTask: event.message,
                    lastOutput: event.message
                })
            }
            // Start the first TODO task for this agent
            const agentDisplayName = event.agent || ""
            const todoTasks = store.tasks.filter(
                (t) => t.status === "TODO" && t.agent === agentDisplayName
            )
            if (todoTasks.length > 0) {
                store.startTask(todoTasks[0].id)
            }
            break

        case "file_generated":
            if (event.path && agentId) {
                store.updateAgent(agentId, {
                    filesGenerated: [
                        ...store.getAgentById(agentId)!.filesGenerated,
                        event.path
                    ]
                })
            }
            break

        case "complete":
        case "build_complete":
            // Complete all in-progress tasks
            store.tasks
                .filter((t) => t.status === "IN_PROGRESS")
                .forEach((t) => store.completeTask(t.id))

            // Reset all agents to complete
            store.agents.forEach((agent) => {
                store.updateAgent(agent.id, { status: "complete" })
            })
            break

        case "error":
        case "build_error":
            // Fail current task
            const currentTask = store.getCurrentTask()
            if (currentTask) {
                store.failTask(currentTask.id, event.message || "Unknown error")
            }

            // Set agent to error state
            if (agentId) {
                store.updateAgent(agentId, { status: "error" })
            }
            break
    }
}

export default useTaskStore
