/**
 * Kanban Board Component
 * Drag-and-drop task management with columns for each status
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MoreHorizontal, GripVertical, Flag, Calendar, User, GitBranch } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskCard, type Task } from "./task-card"

// Column definitions for Kanban
const COLUMNS = [
    { id: "TODO", label: "To Do", color: "bg-slate-500" },
    { id: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500" },
    { id: "IN_REVIEW", label: "In Review", color: "bg-purple-500" },
    { id: "DONE", label: "Done", color: "bg-green-500" }
] as const

type TaskStatus = typeof COLUMNS[number]["id"]

interface KanbanBoardProps {
    workflowId: string
    onTaskCreate?: () => void
    onTaskClick?: (task: Task) => void
}

export function KanbanBoard({ workflowId, onTaskCreate, onTaskClick }: KanbanBoardProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [draggedTask, setDraggedTask] = useState<Task | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

    // Fetch tasks
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await fetch(`/api/tasks?workflowId=${workflowId}`)
                if (response.ok) {
                    const data = await response.json()
                    setTasks(data.tasks || [])
                }
            } catch (error) {
                console.error("Failed to fetch tasks:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (workflowId) {
            fetchTasks()
        }
    }, [workflowId])

    // Get tasks for a column
    const getTasksForColumn = (status: TaskStatus) => {
        return tasks
            .filter(task => task.status === status)
            .sort((a, b) => a.position - b.position)
    }

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task)
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", task.id)
    }

    const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        setDragOverColumn(status)
    }

    const handleDragLeave = () => {
        setDragOverColumn(null)
    }

    const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
        e.preventDefault()
        setDragOverColumn(null)

        if (!draggedTask || draggedTask.status === newStatus) {
            setDraggedTask(null)
            return
        }

        // Optimistic update
        const updatedTasks = tasks.map(task =>
            task.id === draggedTask.id
                ? { ...task, status: newStatus }
                : task
        )
        setTasks(updatedTasks)
        setDraggedTask(null)

        // API call to update
        try {
            await fetch(`/api/tasks/${draggedTask.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            })
        } catch (error) {
            console.error("Failed to update task:", error)
            // Revert on error
            setTasks(tasks)
        }
    }

    const handleDragEnd = () => {
        setDraggedTask(null)
        setDragOverColumn(null)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        )
    }

    return (
        <div className="flex gap-4 h-full overflow-x-auto p-4">
            {COLUMNS.map(column => {
                const columnTasks = getTasksForColumn(column.id)
                const isDragOver = dragOverColumn === column.id

                return (
                    <div
                        key={column.id}
                        className={cn(
                            "flex flex-col min-w-[300px] max-w-[350px] rounded-lg bg-muted/30 border",
                            isDragOver && "ring-2 ring-primary ring-offset-2"
                        )}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        {/* Column Header */}
                        <div className="flex items-center justify-between p-3 border-b">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", column.color)} />
                                <span className="font-medium text-sm">{column.label}</span>
                                <Badge variant="secondary" className="text-xs">
                                    {columnTasks.length}
                                </Badge>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Tasks */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {columnTasks.map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task)}
                                    onDragEnd={handleDragEnd}
                                    className={cn(
                                        "cursor-grab active:cursor-grabbing",
                                        draggedTask?.id === task.id && "opacity-50"
                                    )}
                                >
                                    <TaskCard
                                        task={task}
                                        onClick={() => onTaskClick?.(task)}
                                    />
                                </div>
                            ))}

                            {/* Empty state */}
                            {columnTasks.length === 0 && (
                                <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-muted-foreground/20 text-muted-foreground text-sm">
                                    Drop tasks here
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
