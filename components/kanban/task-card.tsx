/**
 * Task Card Component
 * Individual task card for the Kanban board
 */

"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Flag, Calendar, GitBranch, MessageSquare, Play, Pause, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Task {
    id: string
    title: string
    description?: string
    status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED"
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
    position: number
    currentStage?: string
    progress?: number
    branchName?: string
    assignee?: {
        id: string
        name: string
        image?: string
    }
    createdBy: {
        id: string
        name: string
    }
    workflowTemplate?: "NEW_FEATURE" | "FIX_BUG" | "VIBE_CODE" | "REFACTOR" | "CUSTOM"
    stepsCount?: number
    stepsCompleted?: number
    createdAt: string
    updatedAt: string
}

interface TaskCardProps {
    task: Task
    onClick?: () => void
    compact?: boolean
}

const priorityConfig = {
    LOW: { color: "bg-slate-100 text-slate-600", icon: "○" },
    MEDIUM: { color: "bg-blue-100 text-blue-600", icon: "◐" },
    HIGH: { color: "bg-orange-100 text-orange-600", icon: "●" },
    URGENT: { color: "bg-red-100 text-red-600", icon: "◉" }
}

const templateConfig = {
    NEW_FEATURE: { emoji: "✨", label: "Feature" },
    FIX_BUG: { emoji: "🐛", label: "Bug Fix" },
    VIBE_CODE: { emoji: "🎯", label: "Vibe Code" },
    REFACTOR: { emoji: "🔧", label: "Refactor" },
    CUSTOM: { emoji: "📋", label: "Custom" }
}

export function TaskCard({ task, onClick, compact }: TaskCardProps) {
    const priority = priorityConfig[task.priority]
    const template = task.workflowTemplate ? templateConfig[task.workflowTemplate] : null
    const hasProgress = task.stepsCount && task.stepsCount > 0

    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-white dark:bg-slate-800 rounded-lg border shadow-sm hover:shadow-md transition-all p-3 cursor-pointer group",
                task.status === "BLOCKED" && "border-red-200 bg-red-50/50 dark:bg-red-950/20"
            )}
        >
            {/* Header: Template & Priority */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    {template && (
                        <span className="text-xs" title={template.label}>
                            {template.emoji}
                        </span>
                    )}
                    <Badge variant="outline" className={cn("text-[10px] h-5", priority.color)}>
                        {task.priority}
                    </Badge>
                </div>

                {/* Quick Actions - show on hover */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status === "IN_PROGRESS" ? (
                        <Pause className="h-3 w-3 text-muted-foreground hover:text-primary cursor-pointer" />
                    ) : task.status === "TODO" ? (
                        <Play className="h-3 w-3 text-muted-foreground hover:text-primary cursor-pointer" />
                    ) : null}
                </div>
            </div>

            {/* Title */}
            <h3 className="font-medium text-sm leading-snug mb-2 line-clamp-2">
                {task.title}
            </h3>

            {/* Description (if not compact) */}
            {!compact && task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {task.description}
                </p>
            )}

            {/* Current Stage / Progress */}
            {task.currentStage && (
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-[10px] h-5">
                        📍 {task.currentStage}
                    </Badge>
                </div>
            )}

            {/* Steps Progress Bar */}
            {hasProgress && (
                <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{task.stepsCompleted}/{task.stepsCount} steps</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all",
                                task.status === "DONE" ? "bg-green-500" : "bg-primary"
                            )}
                            style={{
                                width: `${((task.stepsCompleted || 0) / (task.stepsCount || 1)) * 100}%`
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Footer: Branch, Assignee, Date */}
            <div className="flex items-center justify-between pt-2 border-t border-muted/50">
                <div className="flex items-center gap-2">
                    {/* Branch */}
                    {task.branchName && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <GitBranch className="h-3 w-3" />
                            <span className="max-w-[80px] truncate">{task.branchName}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Assignee */}
                    {task.assignee ? (
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={task.assignee.image} />
                            <AvatarFallback className="text-[8px]">
                                {task.assignee.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground">?</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
