/**
 * Agent Collaboration Types
 * Type definitions for multi-agent collaboration board
 */

// Agent status states
export type AgentStatus =
    | "idle"
    | "thinking"
    | "coding"
    | "reviewing"
    | "streaming"
    | "complete"
    | "error"
    | "waiting"

// Agent event types
export type AgentEventType =
    | "agent_start"
    | "agent_progress"
    | "agent_complete"
    | "agent_error"
    | "model_switch"
    | "collaboration"
    | "token_stream"
    | "file_generated"

// Individual agent card data
export interface AgentCard {
    id: string
    name: string              // "Architect", "UI Designer", "Backend", "Integrator"
    emoji: string             // 🏗️ 🎨 ⚙️ 🔧
    role: AgentRole
    status: AgentStatus
    currentModel: string      // "claude-opus-4", "gpt-4o", etc.
    currentTask: string       // "Planning component structure..."
    progress: number          // 0-100
    outputPreview: string     // Snippet of latest output
    streamBuffer: string      // Current streaming content
    tokensUsed: number
    latencyMs: number
    startTime?: number
    endTime?: number
    color: string             // Gradient color class
}

// Agent roles
export type AgentRole =
    | "architect"
    | "ui-designer"
    | "backend"
    | "integrator"
    | "quality-reviewer"

// Agent event for real-time updates
export interface AgentEvent {
    id: string
    timestamp: number
    type: AgentEventType
    agentId: string
    agentName: string
    model: string
    task: string
    progress?: number
    output?: string
    chunk?: string            // For streaming
    tokensUsed?: number
    latencyMs?: number
    targetAgent?: string      // For collaboration events
    fileName?: string         // For file generation events
    error?: string
}

// Activity timeline entry
export interface ActivityEntry {
    id: string
    timestamp: number
    agentId: string
    agentName: string
    agentEmoji: string
    agentColor: string
    eventType: AgentEventType
    message: string
    details?: string
    model?: string
    isExpanded: boolean
}

// Generated file preview
export interface GeneratedFile {
    path: string
    content: string
    language: string
    agentId: string
    timestamp: number
    lineCount: number
}

// Collaboration connection between agents
export interface AgentConnection {
    id: string
    sourceAgentId: string
    targetAgentId: string
    dataType: "architecture" | "schema" | "api" | "components" | "review"
    isActive: boolean
    animationProgress: number
}

// Board state
export interface AgentBoardState {
    agents: AgentCard[]
    connections: AgentConnection[]
    activities: ActivityEntry[]
    generatedFiles: GeneratedFile[]
    isGenerating: boolean
    currentPhase: GenerationPhase
    totalProgress: number
    estimatedTimeRemaining?: number
}

// Generation phases
export type GenerationPhase =
    | "idle"
    | "planning"
    | "architecture"
    | "database"
    | "backend"
    | "frontend"
    | "integration"
    | "review"
    | "complete"
    | "error"

// Agent configuration
export const AGENT_CONFIGS: Record<AgentRole, {
    name: string
    emoji: string
    color: string
    description: string
    preferredModels: string[]
}> = {
    "architect": {
        name: "Architect",
        emoji: "🏗️",
        color: "from-violet-500 to-purple-600",
        description: "Plans system architecture and component structure",
        preferredModels: ["claude-opus-4", "gpt-4-turbo"]
    },
    "ui-designer": {
        name: "UI Designer",
        emoji: "🎨",
        color: "from-pink-500 to-rose-600",
        description: "Creates beautiful, responsive UI components",
        preferredModels: ["gpt-4o", "claude-sonnet-4"]
    },
    "backend": {
        name: "Backend",
        emoji: "⚙️",
        color: "from-blue-500 to-cyan-600",
        description: "Builds APIs, database schemas, and server logic",
        preferredModels: ["claude-sonnet-4", "gpt-4-turbo"]
    },
    "integrator": {
        name: "Integrator",
        emoji: "🔧",
        color: "from-amber-500 to-orange-600",
        description: "Assembles and reviews all components together",
        preferredModels: ["claude-opus-4", "gpt-4-turbo"]
    },
    "quality-reviewer": {
        name: "Reviewer",
        emoji: "🔍",
        color: "from-emerald-500 to-green-600",
        description: "Reviews code quality and catches issues",
        preferredModels: ["claude-opus-4", "gpt-4-turbo"]
    }
}

// Default agents for the board
export const DEFAULT_AGENTS: AgentCard[] = [
    {
        id: "agent-architect",
        name: "Architect",
        emoji: "🏗️",
        role: "architect",
        status: "idle",
        currentModel: "claude-opus-4",
        currentTask: "Waiting for task...",
        progress: 0,
        outputPreview: "",
        streamBuffer: "",
        tokensUsed: 0,
        latencyMs: 0,
        color: "from-violet-500 to-purple-600"
    },
    {
        id: "agent-ui-designer",
        name: "UI Designer",
        emoji: "🎨",
        role: "ui-designer",
        status: "idle",
        currentModel: "gpt-4o",
        currentTask: "Waiting for task...",
        progress: 0,
        outputPreview: "",
        streamBuffer: "",
        tokensUsed: 0,
        latencyMs: 0,
        color: "from-pink-500 to-rose-600"
    },
    {
        id: "agent-backend",
        name: "Backend",
        emoji: "⚙️",
        role: "backend",
        status: "idle",
        currentModel: "claude-sonnet-4",
        currentTask: "Waiting for task...",
        progress: 0,
        outputPreview: "",
        streamBuffer: "",
        tokensUsed: 0,
        latencyMs: 0,
        color: "from-blue-500 to-cyan-600"
    },
    {
        id: "agent-integrator",
        name: "Integrator",
        emoji: "🔧",
        role: "integrator",
        status: "idle",
        currentModel: "claude-opus-4",
        currentTask: "Waiting for task...",
        progress: 0,
        outputPreview: "",
        streamBuffer: "",
        tokensUsed: 0,
        latencyMs: 0,
        color: "from-amber-500 to-orange-600"
    }
]
