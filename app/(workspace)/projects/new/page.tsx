"use client"

import { useState } from "react"
import { OrchestratorPanel } from "@/components/workspace/orchestrator-panel"
import { CodeViewer } from "@/components/workspace/code-viewer"
import { Button } from "@/components/ui/button"
import { Loader2, Play, Monitor, Smartphone, Tablet, Download } from "lucide-react"
import { cn } from "@/lib/utils"

type PreviewMode = "desktop" | "tablet" | "mobile"

export default function NewProjectPage() {
    const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop")

    const handleDownload = () => {
        // TODO: Trigger ZIP download
        alert("ZIP download will be implemented")
    }

    const handleDeploy = () => {
        // TODO: Integrate with Vercel/deployment
        alert("Deploy feature coming soon!")
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Left Panel: Orchestrator */}
            <div className="w-1/3 min-w-[350px] border-r flex flex-col bg-muted/5">
                <div className="h-14 border-b flex items-center px-4 justify-between bg-background">
                    <span className="font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        MeganAi Architect
                    </span>
                    <div className="flex gap-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                            Orchestrating
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <OrchestratorPanel />
                </div>
            </div>

            {/* Right Panel: Preview & Code */}
            <div className="flex-1 flex flex-col min-w-0 bg-secondary/5">
                <div className="h-14 border-b flex items-center px-4 justify-between bg-background">
                    <span className="font-semibold">Workspace</span>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-md bg-muted/20 mr-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-none border-r",
                                    previewMode === "desktop" && "bg-primary/10 text-primary"
                                )}
                                onClick={() => setPreviewMode("desktop")}
                            >
                                <Monitor className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-none border-r",
                                    previewMode === "tablet" && "bg-primary/10 text-primary"
                                )}
                                onClick={() => setPreviewMode("tablet")}
                            >
                                <Tablet className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-none",
                                    previewMode === "mobile" && "bg-primary/10 text-primary"
                                )}
                                onClick={() => setPreviewMode("mobile")}
                            >
                                <Smartphone className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={handleDownload}
                        >
                            <Download className="h-3 w-3" />
                            ZIP
                        </Button>

                        <Button
                            size="sm"
                            className="gap-2"
                            onClick={handleDeploy}
                        >
                            <Play className="h-3 w-3" />
                            Deploy
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <CodeViewer previewMode={previewMode} />
                </div>
            </div>
        </div>
    )
}
