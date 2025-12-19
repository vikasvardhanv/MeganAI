/**
 * Agent Board Component
 * Visual board showing all AI agents working in collaboration
 * Inspired by Lovable, Zenflow, and v0's multi-agent visualization
 */

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AgentPanel } from "./agent-panel"
import { ActivityTimeline } from "./activity-timeline"
import { PreviewPane } from "./preview-pane"
import {
    AgentCard,
    AgentEvent,
    ActivityEntry,
    GeneratedFile,
    AgentBoardState,
    GenerationPhase,
    DEFAULT_AGENTS,
    AgentConnection
} from "@/types/agent"
import {
    Play, Pause, RefreshCw, Settings, Maximize2, Minimize2,
    Layers, Activity, Code, Eye, ChevronRight, Zap
} from "lucide-react"
import "@/styles/agent-board.css"

interface AgentBoardProps {
    onGenerate?: (prompt: string) => Promise<void>
    initialPrompt?: string
}

export function AgentBoard({ onGenerate, initialPrompt }: AgentBoardProps) {
    // Board state
    const [state, setState] = useState<AgentBoardState>({
        agents: DEFAULT_AGENTS,
        connections: [],
        activities: [],
        generatedFiles: [],
        isGenerating: false,
        currentPhase: "idle",
        totalProgress: 0
    })

    // UI state
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<"board" | "timeline" | "preview">("board")
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isPaused, setIsPaused] = useState(false)

    // SSE connection reference
    const eventSourceRef = useRef<EventSource | null>(null)

    // Handle incoming agent events from SSE
    const handleAgentEvent = useCallback((event: AgentEvent) => {
        setState(prev => {
            const newState = { ...prev }

            // Update agent status based on event
            const agentIndex = newState.agents.findIndex(a => a.id === event.agentId)
            if (agentIndex !== -1) {
                const agent = { ...newState.agents[agentIndex] }

                switch (event.type) {
                    case "agent_start":
                        agent.status = "thinking"
                        agent.currentTask = event.task
                        agent.currentModel = event.model
                        agent.startTime = event.timestamp
                        agent.progress = 0
                        break

                    case "agent_progress":
                        agent.status = "coding"
                        agent.progress = event.progress || 0
                        if (event.output) {
                            agent.outputPreview = event.output.slice(-200)
                        }
                        break

                    case "token_stream":
                        agent.status = "streaming"
                        if (event.chunk) {
                            agent.streamBuffer += event.chunk
                            agent.outputPreview = agent.streamBuffer.slice(-200)
                        }
                        break

                    case "agent_complete":
                        agent.status = "complete"
                        agent.progress = 100
                        agent.endTime = event.timestamp
                        agent.tokensUsed = event.tokensUsed || 0
                        agent.latencyMs = event.latencyMs || 0
                        agent.streamBuffer = ""
                        break

                    case "agent_error":
                        agent.status = "error"
                        agent.currentTask = event.error || "An error occurred"
                        break

                    case "model_switch":
                        agent.currentModel = event.model
                        break
                }

                newState.agents[agentIndex] = agent
            }

            // Add to activity timeline
            const activity: ActivityEntry = {
                id: event.id,
                timestamp: event.timestamp,
                agentId: event.agentId,
                agentName: event.agentName,
                agentEmoji: newState.agents.find(a => a.id === event.agentId)?.emoji || "🤖",
                agentColor: newState.agents.find(a => a.id === event.agentId)?.color || "from-gray-500 to-gray-600",
                eventType: event.type,
                message: getEventMessage(event),
                details: event.output,
                model: event.model,
                isExpanded: false
            }
            newState.activities = [activity, ...newState.activities].slice(0, 100)

            // Handle file generation
            if (event.type === "file_generated" && event.fileName && event.output) {
                const file: GeneratedFile = {
                    path: event.fileName,
                    content: event.output,
                    language: getLanguageFromPath(event.fileName),
                    agentId: event.agentId,
                    timestamp: event.timestamp,
                    lineCount: event.output.split("\n").length
                }
                newState.generatedFiles = [...newState.generatedFiles, file]
            }

            // Update connections for collaboration events
            if (event.type === "collaboration" && event.targetAgent) {
                const connection: AgentConnection = {
                    id: `conn-${event.agentId}-${event.targetAgent}`,
                    sourceAgentId: event.agentId,
                    targetAgentId: event.targetAgent,
                    dataType: "architecture",
                    isActive: true,
                    animationProgress: 0
                }
                newState.connections = [...newState.connections.filter(c => c.id !== connection.id), connection]
            }

            // Update total progress
            const completedAgents = newState.agents.filter(a => a.status === "complete").length
            newState.totalProgress = Math.round((completedAgents / newState.agents.length) * 100)

            return newState
        })
    }, [])

    // Start generation with SSE connection
    const startGeneration = async (prompt: string) => {
        if (state.isGenerating) return

        setState(prev => ({
            ...prev,
            isGenerating: true,
            currentPhase: "planning",
            agents: DEFAULT_AGENTS.map(a => ({ ...a, status: "waiting" as const })),
            activities: [],
            generatedFiles: [],
            connections: []
        }))

        try {
            // Connect to SSE endpoint - use demo mode for now
            eventSourceRef.current = new EventSource(`/api/agents/stream?demo=true`)

            eventSourceRef.current.onmessage = (event) => {
                const data = JSON.parse(event.data) as AgentEvent
                if (!isPaused) {
                    handleAgentEvent(data)
                }
            }

            eventSourceRef.current.onerror = () => {
                setState(prev => ({
                    ...prev,
                    isGenerating: false,
                    currentPhase: "error"
                }))
                eventSourceRef.current?.close()
            }

            // Also call the provided callback if exists
            if (onGenerate) {
                await onGenerate(prompt)
            }
        } catch (error) {
            console.error("Generation failed:", error)
            setState(prev => ({
                ...prev,
                isGenerating: false,
                currentPhase: "error"
            }))
        }
    }

    // Cleanup SSE on unmount
    useEffect(() => {
        return () => {
            eventSourceRef.current?.close()
        }
    }, [])

    // Demo mode: Simulate agent activities
    const runDemoMode = () => {
        setState(prev => ({
            ...prev,
            isGenerating: true,
            currentPhase: "architecture"
        }))

        const agents = [...DEFAULT_AGENTS]
        let currentAgentIndex = 0

        const simulateAgent = () => {
            if (currentAgentIndex >= agents.length) {
                setState(prev => ({
                    ...prev,
                    isGenerating: false,
                    currentPhase: "complete",
                    totalProgress: 100
                }))
                return
            }

            const agent = agents[currentAgentIndex]

            // Start agent
            handleAgentEvent({
                id: `demo-${Date.now()}-start`,
                timestamp: Date.now(),
                type: "agent_start",
                agentId: agent.id,
                agentName: agent.name,
                model: agent.currentModel,
                task: `Generating ${agent.role} components...`
            })

            // Progress updates
            let progress = 0
            const progressInterval = setInterval(() => {
                progress += 10
                if (progress <= 100) {
                    handleAgentEvent({
                        id: `demo-${Date.now()}-progress`,
                        timestamp: Date.now(),
                        type: "agent_progress",
                        agentId: agent.id,
                        agentName: agent.name,
                        model: agent.currentModel,
                        task: agent.currentTask,
                        progress,
                        output: `// ${agent.name} generating code...\nfunction ${agent.role.replace("-", "")}() {\n  // Implementation\n}`
                    })
                } else {
                    clearInterval(progressInterval)

                    // Complete agent
                    handleAgentEvent({
                        id: `demo-${Date.now()}-complete`,
                        timestamp: Date.now(),
                        type: "agent_complete",
                        agentId: agent.id,
                        agentName: agent.name,
                        model: agent.currentModel,
                        task: "Completed",
                        tokensUsed: Math.floor(Math.random() * 5000) + 1000,
                        latencyMs: Math.floor(Math.random() * 3000) + 500
                    })

                    currentAgentIndex++
                    setTimeout(simulateAgent, 500)
                }
            }, 200)
        }

        simulateAgent()
    }

    return (
        <div className={cn(
            "flex flex-col bg-slate-900 text-white",
            isFullscreen ? "fixed inset-0 z-50" : "h-full"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Layers className="h-4 w-4 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold">Agent Collaboration Board</h2>
                    </div>

                    <Badge variant="secondary" className={cn(
                        "text-xs",
                        state.isGenerating && "animate-pulse bg-violet-600"
                    )}>
                        {state.currentPhase === "idle" ? "Ready" :
                            state.currentPhase === "complete" ? "✓ Complete" :
                                state.currentPhase === "error" ? "⚠ Error" :
                                    `${state.currentPhase}...`}
                    </Badge>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {/* Tab switcher */}
                    <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab("board")}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                                activeTab === "board" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Layers className="h-3.5 w-3.5 inline mr-1.5" />
                            Board
                        </button>
                        <button
                            onClick={() => setActiveTab("timeline")}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                                activeTab === "timeline" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Activity className="h-3.5 w-3.5 inline mr-1.5" />
                            Activity
                        </button>
                        <button
                            onClick={() => setActiveTab("preview")}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                                activeTab === "preview" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Eye className="h-3.5 w-3.5 inline mr-1.5" />
                            Preview
                        </button>
                    </div>

                    <div className="w-px h-6 bg-slate-600" />

                    {/* Action buttons */}
                    {state.isGenerating ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsPaused(!isPaused)}
                        >
                            {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                            {isPaused ? "Resume" : "Pause"}
                        </Button>
                    ) : (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={runDemoMode}
                            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                        >
                            <Zap className="h-4 w-4 mr-1" />
                            Demo Mode
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Progress bar */}
            {state.isGenerating && (
                <div className="h-1 bg-slate-700">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${state.totalProgress}%` }}
                    />
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Board View */}
                {activeTab === "board" && (
                    <div className="flex-1 flex">
                        {/* Agent Grid */}
                        <div className="flex-1 p-6 overflow-auto">
                            <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
                                {state.agents.map((agent) => (
                                    <AgentCardComponent
                                        key={agent.id}
                                        agent={agent}
                                        isSelected={selectedAgent === agent.id}
                                        onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                                    />
                                ))}
                            </div>

                            {/* Connection lines SVG overlay */}
                            <svg className="absolute inset-0 pointer-events-none overflow-visible">
                                {state.connections.filter(c => c.isActive).map(conn => (
                                    <ConnectionLine
                                        key={conn.id}
                                        connection={conn}
                                        agents={state.agents}
                                    />
                                ))}
                            </svg>
                        </div>

                        {/* Side panel for selected agent */}
                        {selectedAgent && (
                            <div className="w-80 border-l border-slate-700 bg-slate-800/50">
                                <AgentPanel
                                    agent={state.agents.find(a => a.id === selectedAgent)!}
                                    activities={state.activities.filter(a => a.agentId === selectedAgent)}
                                    onClose={() => setSelectedAgent(null)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Timeline View */}
                {activeTab === "timeline" && (
                    <ActivityTimeline
                        activities={state.activities}
                        agents={state.agents}
                    />
                )}

                {/* Preview View */}
                {activeTab === "preview" && (
                    <PreviewPane
                        files={state.generatedFiles}
                        agents={state.agents}
                    />
                )}
            </div>
        </div>
    )
}

// Agent Card Component
function AgentCardComponent({
    agent,
    isSelected,
    onClick
}: {
    agent: AgentCard
    isSelected: boolean
    onClick: () => void
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "relative p-4 rounded-xl border-2 transition-all cursor-pointer",
                "bg-slate-800/80 backdrop-blur-sm hover:bg-slate-800",
                isSelected
                    ? "border-violet-500 ring-2 ring-violet-500/30"
                    : "border-slate-600 hover:border-slate-500",
                agent.status === "coding" || agent.status === "streaming"
                    ? "animate-pulse-subtle"
                    : ""
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br",
                        agent.color
                    )}>
                        {agent.emoji}
                    </div>
                    <div>
                        <h3 className="font-medium text-white">{agent.name}</h3>
                        <p className="text-xs text-slate-400">{agent.currentModel}</p>
                    </div>
                </div>
                <StatusBadge status={agent.status} />
            </div>

            {/* Current task */}
            <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                {agent.currentTask}
            </p>

            {/* Progress bar */}
            {agent.progress > 0 && agent.status !== "idle" && (
                <div className="mb-3">
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-300 bg-gradient-to-r",
                                agent.color
                            )}
                            style={{ width: `${agent.progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{agent.progress}% complete</p>
                </div>
            )}

            {/* Output preview */}
            {agent.outputPreview && (
                <div className="p-2 bg-slate-900/50 rounded-lg font-mono text-xs text-slate-400 line-clamp-3 overflow-hidden">
                    {agent.outputPreview}
                </div>
            )}

            {/* Stats footer */}
            {agent.tokensUsed > 0 && (
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span>{agent.tokensUsed.toLocaleString()} tokens</span>
                    <span>{agent.latencyMs}ms</span>
                </div>
            )}

            {/* Expand indicator */}
            <div className="absolute bottom-2 right-2">
                <ChevronRight className={cn(
                    "h-4 w-4 text-slate-500 transition-transform",
                    isSelected && "rotate-90"
                )} />
            </div>
        </div>
    )
}

// Status Badge
function StatusBadge({ status }: { status: AgentCard["status"] }) {
    const config = {
        idle: { label: "Idle", className: "bg-slate-600 text-slate-300" },
        waiting: { label: "Waiting", className: "bg-slate-600 text-slate-300" },
        thinking: { label: "Thinking", className: "bg-yellow-600/80 text-yellow-100 animate-pulse" },
        coding: { label: "Coding", className: "bg-blue-600/80 text-blue-100 animate-pulse" },
        streaming: { label: "Streaming", className: "bg-violet-600/80 text-violet-100 animate-pulse" },
        reviewing: { label: "Reviewing", className: "bg-purple-600/80 text-purple-100" },
        complete: { label: "Complete", className: "bg-emerald-600/80 text-emerald-100" },
        error: { label: "Error", className: "bg-red-600/80 text-red-100" }
    }

    const { label, className } = config[status]

    return (
        <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            className
        )}>
            {label}
        </span>
    )
}

// Connection Line between agents
function ConnectionLine({
    connection,
    agents
}: {
    connection: AgentConnection
    agents: AgentCard[]
}) {
    // This would need actual DOM measurements to draw accurate lines
    // For now, return null - implement with refs in production
    return null
}

// Helper functions
function getEventMessage(event: AgentEvent): string {
    switch (event.type) {
        case "agent_start":
            return `Started ${event.task}`
        case "agent_progress":
            return `Progress: ${event.progress}%`
        case "agent_complete":
            return `Completed in ${event.latencyMs}ms`
        case "agent_error":
            return `Error: ${event.error}`
        case "model_switch":
            return `Switched to ${event.model}`
        case "collaboration":
            return `Sent data to ${event.targetAgent}`
        case "file_generated":
            return `Generated ${event.fileName}`
        default:
            return event.task
    }
}

function getLanguageFromPath(path: string): string {
    const ext = path.split(".").pop() || ""
    const map: Record<string, string> = {
        ts: "typescript",
        tsx: "typescript",
        js: "javascript",
        jsx: "javascript",
        css: "css",
        json: "json",
        prisma: "prisma",
        md: "markdown"
    }
    return map[ext] || "plaintext"
}
