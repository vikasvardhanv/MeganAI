/**
 * Activity Timeline Component
 * Chronological log of all agent activities
 * Color-coded by agent with expandable details
 */

"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ActivityEntry, AgentCard } from "@/types/agent"
import {
    Clock, Filter, ChevronDown, ChevronRight,
    Play, CheckCircle, AlertCircle, ArrowRight,
    Cpu, FileCode, Zap, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActivityTimelineProps {
    activities: ActivityEntry[]
    agents: AgentCard[]
}

export function ActivityTimeline({ activities, agents }: ActivityTimelineProps) {
    const [filter, setFilter] = useState<string | null>(null)
    const [autoScroll, setAutoScroll] = useState(true)
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new activities come in
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = 0
        }
    }, [activities.length, autoScroll])

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const filteredActivities = filter
        ? activities.filter(a => a.agentId === filter)
        : activities

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        })
    }

    const formatTimeDiff = (timestamp: number) => {
        const diff = Date.now() - timestamp
        if (diff < 1000) return "just now"
        if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        return formatTime(timestamp)
    }

    const getEventIcon = (eventType: string) => {
        switch (eventType) {
            case "agent_start":
                return <Play className="h-3.5 w-3.5" />
            case "agent_progress":
                return <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            case "agent_complete":
                return <CheckCircle className="h-3.5 w-3.5" />
            case "agent_error":
                return <AlertCircle className="h-3.5 w-3.5" />
            case "model_switch":
                return <Cpu className="h-3.5 w-3.5" />
            case "collaboration":
                return <ArrowRight className="h-3.5 w-3.5" />
            case "file_generated":
                return <FileCode className="h-3.5 w-3.5" />
            case "token_stream":
                return <Zap className="h-3.5 w-3.5" />
            default:
                return <Clock className="h-3.5 w-3.5" />
        }
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-3">
                    <h3 className="font-medium text-white">Activity Timeline</h3>
                    <span className="text-xs text-slate-400">
                        {filteredActivities.length} events
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Agent filter */}
                    <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
                        <button
                            onClick={() => setFilter(null)}
                            className={cn(
                                "px-2 py-1 text-xs rounded-md transition-colors",
                                filter === null
                                    ? "bg-slate-600 text-white"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            All
                        </button>
                        {agents.map(agent => (
                            <button
                                key={agent.id}
                                onClick={() => setFilter(agent.id)}
                                className={cn(
                                    "px-2 py-1 text-xs rounded-md transition-colors",
                                    filter === agent.id
                                        ? "bg-slate-600 text-white"
                                        : "text-slate-400 hover:text-white"
                                )}
                                title={agent.name}
                            >
                                {agent.emoji}
                            </button>
                        ))}
                    </div>

                    {/* Auto-scroll toggle */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={cn(
                            "text-xs",
                            autoScroll && "bg-violet-600/20 border-violet-500"
                        )}
                    >
                        {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
                    </Button>
                </div>
            </div>

            {/* Timeline */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4"
            >
                {filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <Clock className="h-12 w-12 mb-4 opacity-50" />
                        <p>No activity recorded yet</p>
                        <p className="text-sm mt-1">Start a generation to see agent activities</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredActivities.map((activity, index) => (
                            <TimelineItem
                                key={activity.id}
                                activity={activity}
                                isExpanded={expandedItems.has(activity.id)}
                                onToggle={() => toggleExpand(activity.id)}
                                formatTime={formatTimeDiff}
                                getEventIcon={getEventIcon}
                                isFirst={index === 0}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Live indicator */}
            {activities.length > 0 && (
                <div className="p-3 border-t border-slate-700 bg-slate-800/50 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-slate-400">
                        Live updates • Last activity: {formatTimeDiff(activities[0]?.timestamp || Date.now())}
                    </span>
                </div>
            )}
        </div>
    )
}

// Timeline Item Component
function TimelineItem({
    activity,
    isExpanded,
    onToggle,
    formatTime,
    getEventIcon,
    isFirst
}: {
    activity: ActivityEntry
    isExpanded: boolean
    onToggle: () => void
    formatTime: (timestamp: number) => string
    getEventIcon: (eventType: string) => React.ReactNode
    isFirst: boolean
}) {
    const eventColors: Record<string, { bg: string; text: string; border: string }> = {
        agent_start: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
        agent_progress: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
        agent_complete: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
        agent_error: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
        model_switch: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
        collaboration: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/30" },
        file_generated: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
        token_stream: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" }
    }

    const colors = eventColors[activity.eventType] || {
        bg: "bg-slate-500/10",
        text: "text-slate-400",
        border: "border-slate-500/30"
    }

    return (
        <div
            onClick={onToggle}
            className={cn(
                "relative flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                colors.bg,
                colors.border,
                isFirst && "ring-1 ring-violet-500/30",
                isExpanded && "ring-1 ring-white/10"
            )}
        >
            {/* Timeline connector */}
            <div className="absolute left-6 top-12 bottom-0 w-px bg-slate-700/50" />

            {/* Agent emoji */}
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-gradient-to-br flex-shrink-0",
                activity.agentColor
            )}>
                {activity.agentEmoji}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm">
                            {activity.agentName}
                        </span>
                        <span className={cn("flex items-center gap-1 text-xs", colors.text)}>
                            {getEventIcon(activity.eventType)}
                            <span className="capitalize">{activity.eventType.replace(/_/g, " ")}</span>
                        </span>
                    </div>
                    <span className="text-xs text-slate-500">
                        {formatTime(activity.timestamp)}
                    </span>
                </div>

                <p className="text-sm text-slate-300">{activity.message}</p>

                {/* Model info */}
                {activity.model && (
                    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded bg-slate-700/50 text-xs text-slate-400">
                        <Cpu className="h-3 w-3" />
                        {activity.model}
                    </span>
                )}

                {/* Expanded details */}
                {isExpanded && activity.details && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-900/50 font-mono text-xs text-slate-400 max-h-48 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{activity.details}</pre>
                    </div>
                )}

                {/* Expand indicator */}
                {activity.details && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                        {isExpanded ? (
                            <>
                                <ChevronDown className="h-3 w-3" />
                                Click to collapse
                            </>
                        ) : (
                            <>
                                <ChevronRight className="h-3 w-3" />
                                Click to expand details
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
