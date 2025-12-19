/**
 * Steps Pipeline Component
 * Visual step progress: Requirements → Technical Spec → Planning → Implementation
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Check, Circle, Play, Pause, RotateCcw, Loader2, ChevronDown, ChevronUp, Sparkles, Bot } from "lucide-react"

export interface PipelineStep {
    id: string
    name: string
    description?: string
    order: number
    status: "PENDING" | "IN_PROGRESS" | "COMPLETE" | "FAILED" | "SKIPPED"
    agentUsed?: string
    modelUsed?: string
    tokensUsed?: number
    durationMs?: number
    output?: string
    error?: string
    completedAt?: string
}

interface StepsPipelineProps {
    steps: PipelineStep[]
    onStepStart?: (stepId: string) => void
    onStepRetry?: (stepId: string) => void
    currentStepId?: string
    autoRun?: boolean
}

const statusConfig = {
    PENDING: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted" },
    IN_PROGRESS: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-100" },
    COMPLETE: { icon: Check, color: "text-green-500", bg: "bg-green-100" },
    FAILED: { icon: RotateCcw, color: "text-red-500", bg: "bg-red-100" },
    SKIPPED: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted" }
}

export function StepsPipeline({
    steps,
    onStepStart,
    onStepRetry,
    currentStepId,
    autoRun = true
}: StepsPipelineProps) {
    const [expandedStep, setExpandedStep] = useState<string | null>(null)

    const sortedSteps = [...steps].sort((a, b) => a.order - b.order)
    const completedCount = steps.filter(s => s.status === "COMPLETE").length
    const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0

    const toggleExpand = (stepId: string) => {
        setExpandedStep(expandedStep === stepId ? null : stepId)
    }

    return (
        <div className="space-y-4">
            {/* Overall Progress */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <span className="text-sm font-medium">Pipeline Progress</span>
                    <span className="text-xs text-muted-foreground ml-2">
                        {completedCount}/{steps.length} steps
                    </span>
                </div>
                <Badge variant={progress === 100 ? "default" : "secondary"}>
                    {Math.round(progress)}%
                </Badge>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500",
                        progress === 100 ? "bg-green-500" : "bg-primary"
                    )}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Steps */}
            <div className="space-y-2 mt-6">
                {sortedSteps.map((step, index) => {
                    const config = statusConfig[step.status]
                    const StatusIcon = config.icon
                    const isExpanded = expandedStep === step.id
                    const isCurrent = currentStepId === step.id

                    return (
                        <div key={step.id}>
                            {/* Step Header */}
                            <div
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                                    isCurrent && "ring-2 ring-primary ring-offset-2",
                                    step.status === "IN_PROGRESS" && "bg-blue-50 dark:bg-blue-950/20",
                                    step.status === "COMPLETE" && "bg-green-50 dark:bg-green-950/20",
                                    step.status === "FAILED" && "bg-red-50 dark:bg-red-950/20"
                                )}
                                onClick={() => toggleExpand(step.id)}
                            >
                                {/* Step Number / Status Icon */}
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                                    config.bg, config.color
                                )}>
                                    {step.status === "IN_PROGRESS" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : step.status === "COMPLETE" ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>

                                {/* Step Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{step.name}</span>
                                        {step.status === "IN_PROGRESS" && (
                                            <Badge variant="secondary" className="text-[10px] animate-pulse">
                                                Running...
                                            </Badge>
                                        )}
                                        {step.agentUsed && step.status === "COMPLETE" && (
                                            <Badge variant="outline" className="text-[10px]">
                                                <Bot className="h-3 w-3 mr-1" />
                                                {step.agentUsed}
                                            </Badge>
                                        )}
                                    </div>
                                    {step.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {step.description}
                                        </p>
                                    )}
                                </div>

                                {/* Duration / Actions */}
                                <div className="flex items-center gap-2">
                                    {step.durationMs && step.status === "COMPLETE" && (
                                        <span className="text-xs text-muted-foreground">
                                            {(step.durationMs / 1000).toFixed(1)}s
                                        </span>
                                    )}

                                    {step.status === "PENDING" && onStepStart && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onStepStart(step.id)
                                            }}
                                        >
                                            <Play className="h-3 w-3 mr-1" />
                                            Start
                                        </Button>
                                    )}

                                    {step.status === "FAILED" && onStepRetry && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-xs text-red-500"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onStepRetry(step.id)
                                            }}
                                        >
                                            <RotateCcw className="h-3 w-3 mr-1" />
                                            Retry
                                        </Button>
                                    )}

                                    {isExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (step.output || step.error) && (
                                <div className="ml-11 mt-2 p-3 rounded-lg bg-muted/50 text-sm">
                                    {step.error ? (
                                        <div className="text-red-500">
                                            <span className="font-medium">Error: </span>
                                            {step.error}
                                        </div>
                                    ) : step.output ? (
                                        <div className="whitespace-pre-wrap text-muted-foreground">
                                            {step.output.length > 500
                                                ? step.output.slice(0, 500) + "..."
                                                : step.output
                                            }
                                        </div>
                                    ) : null}

                                    {step.tokensUsed && (
                                        <div className="mt-2 text-xs text-muted-foreground flex gap-4">
                                            <span>Tokens: {step.tokensUsed}</span>
                                            {step.modelUsed && <span>Model: {step.modelUsed}</span>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Connector Line */}
                            {index < sortedSteps.length - 1 && (
                                <div className="ml-[18px] w-0.5 h-4 bg-muted" />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
