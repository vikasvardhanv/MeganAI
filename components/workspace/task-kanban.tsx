"use client"

/**
 * Task Kanban Component
 * Auto-populating Kanban board from AI execution plan
 */

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Clock,
    CheckCircle2,
    Loader2,
    AlertCircle,
    FileCode,
    Timer
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTaskStore, type ExecutionTask, type TaskStatus } from "@/lib/stores/task-store"

// Column configuration
const COLUMNS: { id: TaskStatus; label: string; color: string; icon: React.ElementType }[] = [
    { id: "TODO", label: "To Do", color: "bg-slate-500", icon: Clock },
    { id: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500", icon: Loader2 },
    { id: "DONE", label: "Done", color: "bg-green-500", icon: CheckCircle2 },
    { id: "ERROR", label: "Failed", color: "bg-red-500", icon: AlertCircle }
]

interface TaskKanbanProps {
    className?: string
}

export function TaskKanban({ className }: TaskKanbanProps) {
    const { tasks, agents } = useTaskStore()

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, ExecutionTask[]> = {
            TODO: [],
            IN_PROGRESS: [],
            DONE: [],
            ERROR: []
        }

        tasks.forEach((task) => {
            grouped[task.status].push(task)
        })

        return grouped
    }, [tasks])

    // Calculate stats
    const stats = useMemo(() => {
        const total = tasks.length
        const done = tasksByStatus.DONE.length
        const inProgress = tasksByStatus.IN_PROGRESS.length
        const failed = tasksByStatus.ERROR.length
        const progress = total > 0 ? Math.round((done / total) * 100) : 0

        return { total, done, inProgress, failed, progress }
    }, [tasks, tasksByStatus])

    // Format duration
    const formatDuration = (ms?: number) => {
        if (!ms) return "-"
        if (ms < 1000) return `${ms}ms`
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
        return `${(ms / 60000).toFixed(1)}m`
    }

    return (
        <div className={cn("flex flex-col h-full bg-slate-900", className)}>
            {/* Header with Stats */}
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">Execution Pipeline</h3>
                    <Badge variant="outline" className="text-xs">
                        {stats.done}/{stats.total} tasks
                    </Badge>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${stats.progress}%` }}
                    />
                </div>

                {/* Active Agents */}
                <div className="flex gap-2 mt-3">
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
                                agent.status === "idle" && "bg-slate-800 text-slate-400",
                                agent.status === "thinking" && "bg-amber-900/50 text-amber-300 animate-pulse",
                                agent.status === "generating" && "bg-blue-900/50 text-blue-300",
                                agent.status === "complete" && "bg-green-900/50 text-green-300",
                                agent.status === "error" && "bg-red-900/50 text-red-300"
                            )}
                        >
                            <span>{agent.emoji}</span>
                            <span className="hidden sm:inline">{agent.name}</span>
                            {agent.status === "generating" && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-3 p-4 h-full min-w-max">
                    {COLUMNS.map((column) => {
                        const columnTasks = tasksByStatus[column.id]
                        const Icon = column.icon

                        return (
                            <div
                                key={column.id}
                                className="flex flex-col w-64 min-w-[256px] bg-slate-800/50 rounded-lg border border-slate-700"
                            >
                                {/* Column Header */}
                                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", column.color)} />
                                        <span className="text-sm font-medium text-slate-300">
                                            {column.label}
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs h-5 min-w-[20px] justify-center">
                                        {columnTasks.length}
                                    </Badge>
                                </div>

                                {/* Tasks */}
                                <ScrollArea className="flex-1">
                                    <div className="p-2 space-y-2">
                                        {columnTasks.length === 0 ? (
                                            <div className="flex items-center justify-center h-20 text-slate-500 text-xs">
                                                No tasks
                                            </div>
                                        ) : (
                                            columnTasks.map((task) => (
                                                <TaskCard
                                                    key={task.id}
                                                    task={task}
                                                    formatDuration={formatDuration}
                                                />
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Empty State */}
            {tasks.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                    <div className="text-center">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                        <p className="text-slate-400 text-sm">
                            Tasks will appear here when generation starts
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

// Task Card Component
function TaskCard({
    task,
    formatDuration
}: {
    task: ExecutionTask
    formatDuration: (ms?: number) => string
}) {
    return (
        <div
            className={cn(
                "p-3 rounded-lg border transition-all",
                task.status === "TODO" && "bg-slate-800 border-slate-700",
                task.status === "IN_PROGRESS" && "bg-blue-900/20 border-blue-700/50 shadow-lg shadow-blue-900/10",
                task.status === "DONE" && "bg-green-900/20 border-green-700/30",
                task.status === "ERROR" && "bg-red-900/20 border-red-700/30"
            )}
        >
            {/* Task Header */}
            <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">{task.agentEmoji}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                        {task.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                        {task.agent}
                    </p>
                </div>
            </div>

            {/* Progress Bar (for in-progress tasks) */}
            {task.status === "IN_PROGRESS" && (
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                    />
                </div>
            )}

            {/* Task Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500">
                {/* Files Generated */}
                {task.filesGenerated.length > 0 && (
                    <div className="flex items-center gap-1">
                        <FileCode className="h-3 w-3" />
                        <span>{task.filesGenerated.length}</span>
                    </div>
                )}

                {/* Duration */}
                {task.duration && (
                    <div className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        <span>{formatDuration(task.duration)}</span>
                    </div>
                )}

                {/* Status Icon */}
                <div className="ml-auto">
                    {task.status === "IN_PROGRESS" && (
                        <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                    )}
                    {task.status === "DONE" && (
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                    )}
                    {task.status === "ERROR" && (
                        <AlertCircle className="h-3 w-3 text-red-400" />
                    )}
                </div>
            </div>

            {/* Error Message */}
            {task.error && (
                <p className="mt-2 text-xs text-red-400 truncate">
                    {task.error}
                </p>
            )}
        </div>
    )
}

export default TaskKanban
