"use client"

import { useState, useCallback, useEffect } from "react"
import { OrchestratorPanel } from "@/components/workspace/orchestrator-panel"
import { CodeViewer } from "@/components/workspace/code-viewer"
import { Button } from "@/components/ui/button"
import { Loader2, Play, Monitor, Smartphone, Tablet, Download, Layers, ChefHat, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Artifact } from "@/lib/orchestrator/core"

type PreviewMode = "desktop" | "tablet" | "mobile"

// Build phases with progress percentages
const BUILD_PHASES = [
    { name: "Understanding requirements", emoji: "🧠", progress: 10 },
    { name: "Planning architecture", emoji: "🏗️", progress: 25 },
    { name: "Generating database schema", emoji: "🗄️", progress: 40 },
    { name: "Building backend APIs", emoji: "⚙️", progress: 55 },
    { name: "Designing UI components", emoji: "🎨", progress: 70 },
    { name: "Integrating systems", emoji: "🔧", progress: 85 },
    { name: "Final review", emoji: "✨", progress: 95 },
    { name: "Complete!", emoji: "🚀", progress: 100 },
]

export default function NewProjectPage() {
    const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop")
    const [isBuilding, setIsBuilding] = useState(false)
    const [buildPhase, setBuildPhase] = useState("Preparing")
    const [buildProgress, setBuildProgress] = useState(0)
    const [artifacts, setArtifacts] = useState<Artifact[]>([])
    const [currentAgent, setCurrentAgent] = useState<string | null>(null)

    // Listen for build events from the orchestrator
    useEffect(() => {
        const handleBuildEvent = (event: CustomEvent) => {
            const { type, data } = event.detail

            switch (type) {
                case "build_start":
                    setIsBuilding(true)
                    setBuildProgress(5)
                    setBuildPhase("Starting build...")
                    setArtifacts([])
                    break

                case "agent_start":
                    setCurrentAgent(data.agent)
                    setBuildPhase(`${data.agent} is ${data.task}`)
                    // Find matching phase for progress
                    const phase = BUILD_PHASES.find(p =>
                        p.name.toLowerCase().includes(data.task?.toLowerCase() || "")
                    )
                    if (phase) {
                        setBuildProgress(phase.progress)
                    }
                    break

                case "agent_progress":
                    if (data.progress) {
                        setBuildProgress(data.progress)
                    }
                    break

                case "file_generated":
                    if (data.path && data.content) {
                        setArtifacts(prev => [
                            ...prev,
                            { path: data.path, content: data.content, type: "code" }
                        ])
                    }
                    break

                case "build_complete":
                    setIsBuilding(false)
                    setBuildProgress(100)
                    setBuildPhase("Complete!")
                    setCurrentAgent(null)
                    break

                case "build_error":
                    setIsBuilding(false)
                    setBuildPhase("Error occurred")
                    setCurrentAgent(null)
                    break
            }
        }

        window.addEventListener("megan-build" as any, handleBuildEvent as EventListener)
        return () => {
            window.removeEventListener("megan-build" as any, handleBuildEvent as EventListener)
        }
    }, [])

    // Demo: Simulate build for testing
    const handleDemoMode = async () => {
        setIsBuilding(true)
        setArtifacts([])

        for (let i = 0; i < BUILD_PHASES.length; i++) {
            const phase = BUILD_PHASES[i]
            setBuildPhase(phase.name)
            setBuildProgress(phase.progress)
            setCurrentAgent(["🏗️ Architect", "🎨 UI Designer", "⚙️ Backend", "🔧 Integrator"][i % 4])

            await new Promise(r => setTimeout(r, 1500))

            // Add demo files
            if (i > 2) {
                const demoFiles: Artifact[] = [
                    { path: "app/page.tsx", content: `// Main app page\nexport default function Home() {\n  return <main>Hello World</main>\n}`, type: "code" },
                    { path: "app/layout.tsx", content: `// Root layout\nexport default function Layout({ children }) {\n  return <html><body>{children}</body></html>\n}`, type: "code" },
                    { path: "components/Button.tsx", content: `// Button component\nexport function Button({ children }) {\n  return <button className="btn">{children}</button>\n}`, type: "code" },
                    { path: "lib/db.ts", content: `// Database connection\nimport { PrismaClient } from '@prisma/client'\nexport const db = new PrismaClient()`, type: "code" },
                    { path: "prisma/schema.prisma", content: `// Prisma schema\ngenerator client {\n  provider = "prisma-client-js"\n}\n\nmodel User {\n  id String @id\n  email String\n}`, type: "config" }
                ]

                if (artifacts.length < demoFiles.length) {
                    setArtifacts(prev => [...prev, demoFiles[prev.length]])
                }
            }
        }

        setIsBuilding(false)
    }

    const handleDownload = () => {
        if (artifacts.length === 0) {
            alert("No files to download yet!")
            return
        }
        // TODO: Trigger ZIP download
        alert(`Would download ${artifacts.length} files as ZIP`)
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
                        <span className={cn(
                            "w-2 h-2 rounded-full",
                            isBuilding ? "bg-amber-500 animate-pulse" : "bg-primary"
                        )} />
                        MeganAi Architect
                    </span>
                    <div className="flex gap-2 items-center">
                        {isBuilding && currentAgent && (
                            <div className="text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-1 rounded flex items-center gap-1">
                                <ChefHat className="h-3 w-3" />
                                {currentAgent}
                            </div>
                        )}
                        <div className={cn(
                            "text-[10px] uppercase font-bold px-2 py-1 rounded",
                            isBuilding
                                ? "text-amber-600 bg-amber-100 dark:bg-amber-950 animate-pulse"
                                : "text-muted-foreground bg-muted"
                        )}>
                            {isBuilding ? "🍳 Cooking..." : "Ready"}
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <OrchestratorPanel />
                </div>

                {/* Demo Mode Button (temporary for testing) */}
                <div className="p-3 border-t bg-muted/30">
                    <Button
                        onClick={handleDemoMode}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={isBuilding}
                    >
                        {isBuilding ? (
                            <>
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                Building...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-3 w-3 mr-2" />
                                Demo: Simulate Build
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Right Panel: Preview & Code */}
            <div className="flex-1 flex flex-col min-w-0 bg-secondary/5">
                <div className="h-14 border-b flex items-center px-4 justify-between bg-background">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold">Workspace</span>
                        {artifacts.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded">
                                <Layers className="h-3 w-3" />
                                {artifacts.length} files
                            </div>
                        )}
                    </div>

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
                            disabled={artifacts.length === 0}
                        >
                            <Download className="h-3 w-3" />
                            ZIP
                        </Button>

                        <Button
                            size="sm"
                            className="gap-2"
                            onClick={handleDeploy}
                            disabled={artifacts.length === 0}
                        >
                            <Play className="h-3 w-3" />
                            Deploy
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <CodeViewer
                        previewMode={previewMode}
                        isBuilding={isBuilding}
                        buildPhase={buildPhase}
                        buildProgress={buildProgress}
                        artifacts={artifacts}
                    />
                </div>
            </div>
        </div>
    )
}
