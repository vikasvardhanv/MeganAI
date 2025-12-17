"use client"

import { Monitor, Tablet, Smartphone, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ToolbarProps {
    project: any
    viewMode: "split" | "chat" | "preview"
    onViewModeChange: (mode: "split" | "chat" | "preview") => void
}

export function Toolbar({ project, viewMode, onViewModeChange }: ToolbarProps) {
    return (
        <div className="h-14 border-b border-border bg-background px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h1 className="font-semibold">{project?.name || "Untitled Project"}</h1>
            </div>

            <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex border rounded-lg overflow-hidden">
                    <Button
                        size="sm"
                        variant={viewMode === "split" ? "secondary" : "ghost"}
                        onClick={() => onViewModeChange("split")}
                        className="rounded-none"
                    >
                        <Menu className="h-4 w-4 mr-2" />
                        Split
                    </Button>
                    <Button
                        size="sm"
                        variant={viewMode === "chat" ? "secondary" : "ghost"}
                        onClick={() => onViewModeChange("chat")}
                        className="rounded-none border-x"
                    >
                        Chat
                    </Button>
                    <Button
                        size="sm"
                        variant={viewMode === "preview" ? "secondary" : "ghost"}
                        onClick={() => onViewModeChange("preview")}
                        className="rounded-none"
                    >
                        Preview
                    </Button>
                </div>
            </div>
        </div>
    )
}
