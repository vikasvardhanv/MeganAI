/**
 * Agent Panel Component
 * Deep-level detail view for individual agent
 * Shows streaming output, model info, and agent-specific activities
 */

"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { AgentCard, ActivityEntry, AGENT_CONFIGS } from "@/types/agent"
import { X, Clock, Zap, Hash, Cpu, ChevronDown, ChevronRight, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AgentPanelProps {
    agent: AgentCard
    activities: ActivityEntry[]
    onClose: () => void
}

export function AgentPanel({ agent, activities, onClose }: AgentPanelProps) {
    const [expandedSections, setExpandedSections] = useState({
        stream: true,
        stats: true,
        history: true
    })
    const [copied, setCopied] = useState(false)

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    const copyOutput = () => {
        if (agent.outputPreview || agent.streamBuffer) {
            navigator.clipboard.writeText(agent.streamBuffer || agent.outputPreview)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const config = AGENT_CONFIGS[agent.role]

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br",
                            agent.color
                        )}>
                            {agent.emoji}
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">{agent.name}</h3>
                            <p className="text-xs text-slate-400">{config.description}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Model badge */}
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-mono text-slate-300">
                        <Cpu className="h-3 w-3 inline mr-1.5" />
                        {agent.currentModel}
                    </span>
                    <StatusIndicator status={agent.status} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Current Task */}
                <div className="p-4 border-b border-slate-700/50">
                    <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Current Task</h4>
                    <p className="text-sm text-white">{agent.currentTask}</p>

                    {/* Progress */}
                    {agent.progress > 0 && agent.status !== "idle" && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                <span>Progress</span>
                                <span>{agent.progress}%</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-500 bg-gradient-to-r",
                                        agent.color
                                    )}
                                    style={{ width: `${agent.progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Streaming Output */}
                <div className="border-b border-slate-700/50">
                    <button
                        onClick={() => toggleSection("stream")}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700/30"
                    >
                        <h4 className="text-xs font-medium text-slate-500 uppercase">Live Output</h4>
                        {expandedSections.stream ? (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                    </button>

                    {expandedSections.stream && (
                        <div className="px-4 pb-4">
                            <div className="relative">
                                <div className="p-3 bg-slate-900 rounded-lg font-mono text-xs text-slate-300 max-h-48 overflow-y-auto">
                                    {agent.streamBuffer || agent.outputPreview || (
                                        <span className="text-slate-500 italic">No output yet...</span>
                                    )}

                                    {/* Streaming cursor */}
                                    {(agent.status === "streaming" || agent.status === "coding") && (
                                        <span className="inline-block w-2 h-4 bg-violet-500 animate-pulse ml-0.5" />
                                    )}
                                </div>

                                {/* Copy button */}
                                {(agent.outputPreview || agent.streamBuffer) && (
                                    <button
                                        onClick={copyOutput}
                                        className="absolute top-2 right-2 p-1.5 rounded bg-slate-700/80 hover:bg-slate-600 transition-colors"
                                    >
                                        {copied ? (
                                            <Check className="h-3 w-3 text-emerald-400" />
                                        ) : (
                                            <Copy className="h-3 w-3 text-slate-400" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="border-b border-slate-700/50">
                    <button
                        onClick={() => toggleSection("stats")}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700/30"
                    >
                        <h4 className="text-xs font-medium text-slate-500 uppercase">Statistics</h4>
                        {expandedSections.stats ? (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                    </button>

                    {expandedSections.stats && (
                        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                            <StatCard
                                icon={<Hash className="h-4 w-4" />}
                                label="Tokens Used"
                                value={agent.tokensUsed.toLocaleString()}
                            />
                            <StatCard
                                icon={<Clock className="h-4 w-4" />}
                                label="Latency"
                                value={`${agent.latencyMs}ms`}
                            />
                            <StatCard
                                icon={<Zap className="h-4 w-4" />}
                                label="Progress"
                                value={`${agent.progress}%`}
                            />
                            <StatCard
                                icon={<Cpu className="h-4 w-4" />}
                                label="Model"
                                value={agent.currentModel.split("-").pop() || ""}
                            />
                        </div>
                    )}
                </div>

                {/* Activity History */}
                <div>
                    <button
                        onClick={() => toggleSection("history")}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700/30"
                    >
                        <h4 className="text-xs font-medium text-slate-500 uppercase">
                            Activity History ({activities.length})
                        </h4>
                        {expandedSections.history ? (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                    </button>

                    {expandedSections.history && (
                        <div className="px-4 pb-4 space-y-2">
                            {activities.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">No activity recorded yet</p>
                            ) : (
                                activities.slice(0, 10).map(activity => (
                                    <ActivityItem key={activity.id} activity={activity} />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                <div className="text-xs text-slate-500">
                    Preferred models: {config.preferredModels.join(", ")}
                </div>
            </div>
        </div>
    )
}

// Status indicator with animation
function StatusIndicator({ status }: { status: AgentCard["status"] }) {
    const configs = {
        idle: { color: "bg-slate-500", label: "Idle" },
        waiting: { color: "bg-slate-500", label: "Waiting" },
        thinking: { color: "bg-yellow-500 animate-pulse", label: "Thinking" },
        coding: { color: "bg-blue-500 animate-pulse", label: "Coding" },
        streaming: { color: "bg-violet-500 animate-pulse", label: "Streaming" },
        reviewing: { color: "bg-purple-500", label: "Reviewing" },
        complete: { color: "bg-emerald-500", label: "Complete" },
        error: { color: "bg-red-500", label: "Error" }
    }

    const config = configs[status]

    return (
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={cn("w-2 h-2 rounded-full", config.color)} />
            {config.label}
        </span>
    )
}

// Stat card
function StatCard({
    icon,
    label,
    value
}: {
    icon: React.ReactNode
    label: string
    value: string
}) {
    return (
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
                {icon}
                <span className="text-xs">{label}</span>
            </div>
            <p className="text-sm font-medium text-white">{value}</p>
        </div>
    )
}

// Activity item
function ActivityItem({ activity }: { activity: ActivityEntry }) {
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    }

    const eventColors: Record<string, string> = {
        agent_start: "text-yellow-400",
        agent_progress: "text-blue-400",
        agent_complete: "text-emerald-400",
        agent_error: "text-red-400",
        model_switch: "text-purple-400",
        collaboration: "text-pink-400",
        token_stream: "text-violet-400",
        file_generated: "text-cyan-400"
    }

    return (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
            <span className="text-xs text-slate-500 w-16 flex-shrink-0">
                {formatTime(activity.timestamp)}
            </span>
            <span className={cn("text-sm flex-1", eventColors[activity.eventType] || "text-slate-300")}>
                {activity.message}
            </span>
        </div>
    )
}
