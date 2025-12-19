/**
 * Workflow Template Selector
 * Select from pre-built workflow templates or create custom
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Sparkles, Bug, Wand2, Wrench, Plus, Check, ArrowRight } from "lucide-react"

interface WorkflowTemplate {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    color: string
    stages: string[]
    autoStart: boolean
}

const TEMPLATES: WorkflowTemplate[] = [
    {
        id: "NEW_FEATURE",
        name: "New Feature",
        description: "Build a new feature from requirements to implementation",
        icon: <Sparkles className="h-5 w-5" />,
        color: "from-purple-500 to-pink-500",
        stages: ["Requirements", "Technical Spec", "Planning", "Implementation", "Review"],
        autoStart: true
    },
    {
        id: "FIX_BUG",
        name: "Fix Bug",
        description: "Investigate, diagnose, and fix a bug",
        icon: <Bug className="h-5 w-5" />,
        color: "from-red-500 to-orange-500",
        stages: ["Investigate", "Diagnose", "Fix", "Test", "Review"],
        autoStart: true
    },
    {
        id: "VIBE_CODE",
        name: "Vibe Code",
        description: "Quick prototyping with AI - just describe what you want",
        icon: <Wand2 className="h-5 w-5" />,
        color: "from-cyan-500 to-blue-500",
        stages: ["Describe", "Generate", "Refine", "Deploy"],
        autoStart: true
    },
    {
        id: "REFACTOR",
        name: "Refactor",
        description: "Improve existing code structure and quality",
        icon: <Wrench className="h-5 w-5" />,
        color: "from-yellow-500 to-green-500",
        stages: ["Analyze", "Plan", "Refactor", "Test", "Review"],
        autoStart: false
    }
]

interface WorkflowSelectorProps {
    onSelect: (template: WorkflowTemplate | { id: "CUSTOM"; stages: string[] }) => void
    onCancel?: () => void
}

export function WorkflowSelector({ onSelect, onCancel }: WorkflowSelectorProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [customStages, setCustomStages] = useState<string[]>([])
    const [newStage, setNewStage] = useState("")

    const handleSelect = (template: WorkflowTemplate) => {
        setSelectedId(template.id)
    }

    const handleConfirm = () => {
        if (selectedId === "CUSTOM") {
            onSelect({ id: "CUSTOM", stages: customStages })
        } else {
            const template = TEMPLATES.find(t => t.id === selectedId)
            if (template) {
                onSelect(template)
            }
        }
    }

    const addCustomStage = () => {
        if (newStage.trim() && !customStages.includes(newStage.trim())) {
            setCustomStages([...customStages, newStage.trim()])
            setNewStage("")
        }
    }

    const removeCustomStage = (stage: string) => {
        setCustomStages(customStages.filter(s => s !== stage))
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Choose a Workflow</h2>
                <p className="text-muted-foreground mt-1">
                    Select a template to get started quickly
                </p>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-2 gap-4">
                {TEMPLATES.map(template => (
                    <Card
                        key={template.id}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            selectedId === template.id && "ring-2 ring-primary"
                        )}
                        onClick={() => handleSelect(template)}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg bg-gradient-to-br text-white",
                                    template.color
                                )}>
                                    {template.icon}
                                </div>
                                <div>
                                    <CardTitle className="text-base">{template.name}</CardTitle>
                                    {template.autoStart && (
                                        <Badge variant="secondary" className="text-[10px] mt-1">
                                            Auto-start
                                        </Badge>
                                    )}
                                </div>
                                {selectedId === template.id && (
                                    <Check className="h-5 w-5 text-primary ml-auto" />
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground mb-3">
                                {template.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {template.stages.map((stage, i) => (
                                    <div key={stage} className="flex items-center">
                                        <Badge variant="outline" className="text-[10px]">
                                            {stage}
                                        </Badge>
                                        {i < template.stages.length - 1 && (
                                            <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Custom Workflow */}
                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md border-dashed",
                        selectedId === "CUSTOM" && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedId("CUSTOM")}
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                                <Plus className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Custom Workflow</CardTitle>
                            </div>
                            {selectedId === "CUSTOM" && (
                                <Check className="h-5 w-5 text-primary ml-auto" />
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-3">
                            Define your own stages and workflow
                        </p>

                        {selectedId === "CUSTOM" && (
                            <div className="space-y-2 mt-3">
                                <div className="flex gap-2">
                                    <Input
                                        value={newStage}
                                        onChange={(e) => setNewStage(e.target.value)}
                                        placeholder="Add a stage..."
                                        className="h-8 text-sm"
                                        onKeyDown={(e) => e.key === "Enter" && addCustomStage()}
                                    />
                                    <Button size="sm" onClick={addCustomStage}>
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {customStages.map((stage, i) => (
                                        <Badge
                                            key={stage}
                                            variant="secondary"
                                            className="text-[10px] cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeCustomStage(stage)
                                            }}
                                        >
                                            {stage} ×
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button
                    onClick={handleConfirm}
                    disabled={!selectedId || (selectedId === "CUSTOM" && customStages.length === 0)}
                >
                    Start Workflow
                </Button>
            </div>
        </div>
    )
}
