"use client"

/**
 * Premium Workspace Page
 * Integrates WebContainers (Live Preview), Agent Board, Task Kanban, and Code Viewer
 */

import { useState, useEffect, useMemo } from "react"
import { OrchestratorPanel } from "@/components/workspace/orchestrator-panel"
import { CodeViewer } from "@/components/workspace/code-viewer"
import { WebContainerPreview } from "@/components/workspace/webcontainer-preview"
import { TaskKanban } from "@/components/workspace/task-kanban"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
    Loader2,
    Play,
    Monitor,
    Smartphone,
    Tablet,
    Download,
    Layers,
    ChefHat,
    Sparkles,
    Code,
    ListTodo,
    Users,
    Terminal,
    Rocket
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTaskStore, processSSEEvent } from "@/lib/stores/task-store"
import type { Artifact } from "@/lib/orchestrator/core"

type WorkspaceTab = "preview" | "code" | "agents" | "tasks"

export default function NewProjectPage() {
    const [activeTab, setActiveTab] = useState<WorkspaceTab>("preview")
    const [isBuilding, setIsBuilding] = useState(false)
    const [buildPhase, setBuildPhase] = useState("Ready to build")
    const [buildProgress, setBuildProgress] = useState(0)
    const [artifacts, setArtifacts] = useState<Artifact[]>([])
    const [currentAgent, setCurrentAgent] = useState<string | null>(null)

    // Task store
    const { tasks, agents, clearTasks, resetAgents } = useTaskStore()

    // Convert artifacts to files object for WebContainer
    const files = useMemo(() => {
        const fileMap: Record<string, string> = {}
        artifacts.forEach((artifact) => {
            fileMap[artifact.path] = artifact.content
        })
        return fileMap
    }, [artifacts])

    // Listen for build events from the orchestrator
    useEffect(() => {
        const handleBuildEvent = (event: CustomEvent) => {
            const eventData = event.detail
            const type = eventData.type

            console.log("[Workspace] Event:", type, eventData)

            // Process event for task store (Kanban updates)
            processSSEEvent(eventData)

            switch (type) {
                case "build_start":
                    setIsBuilding(true)
                    setBuildProgress(5)
                    setBuildPhase("Starting build...")
                    setArtifacts([])
                    clearTasks()
                    resetAgents()
                    break

                case "agent_start":
                case "thinking":
                case "generating":
                    if (eventData.agent) {
                        setCurrentAgent(eventData.agent)
                    }
                    if (eventData.message) {
                        setBuildPhase(eventData.message.slice(0, 80))
                    }
                    if (eventData.progress) {
                        setBuildProgress(eventData.progress)
                    }
                    break

                case "file_generated":
                    if (eventData.path && eventData.content) {
                        setArtifacts(prev => [
                            ...prev,
                            { path: eventData.path, content: eventData.content, type: "code" }
                        ])
                    }
                    break

                case "build_complete":
                case "complete":
                    setIsBuilding(false)
                    setBuildProgress(100)
                    setBuildPhase("Complete!")
                    setCurrentAgent(null)
                    // Auto-switch to preview tab when build completes
                    if (artifacts.length > 0) {
                        setActiveTab("preview")
                    }
                    break

                case "build_error":
                case "error":
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
    }, [artifacts.length, clearTasks, resetAgents])

    // Demo mode for testing
    const handleDemoMode = async () => {
        setIsBuilding(true)
        setArtifacts([])
        clearTasks()
        resetAgents()

        const demoPhases = [
            { agent: "Architect", phase: "Planning architecture...", progress: 20 },
            { agent: "UI Designer", phase: "Designing components...", progress: 40 },
            { agent: "Backend", phase: "Building APIs...", progress: 60 },
            { agent: "Integrator", phase: "Connecting systems...", progress: 80 }
        ]

        for (const step of demoPhases) {
            setCurrentAgent(step.agent)
            setBuildPhase(step.phase)
            setBuildProgress(step.progress)

            // Add tasks to Kanban
            const taskStore = useTaskStore.getState()
            taskStore.addTask({
                title: step.phase.slice(0, 30),
                description: step.phase,
                agent: step.agent,
                agentEmoji: step.agent === "Architect" ? "🏗️" : step.agent === "UI Designer" ? "🎨" : step.agent === "Backend" ? "⚙️" : "🔧"
            })

            await new Promise(r => setTimeout(r, 1500))

            // Update agent status
            taskStore.updateAgent(step.agent.toLowerCase().replace(' ', '-'), {
                status: "generating"
            })
        }

        // Add demo files
        const demoFiles: Artifact[] = [
            { path: "package.json", content: JSON.stringify({ name: "demo-app", version: "1.0.0" }, null, 2), type: "config" },
            { path: "src/App.jsx", content: `import { useState } from 'react'\n\nfunction App() {\n  const [count, setCount] = useState(0)\n  return (\n    <div className="app">\n      <h1>🚀 Demo App</h1>\n      <button onClick={() => setCount(c => c + 1)}>\n        Count: {count}\n      </button>\n    </div>\n  )\n}\n\nexport default App`, type: "code" },
            { path: "src/main.jsx", content: `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n)`, type: "code" },
            { path: "src/index.css", content: `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: system-ui; background: #1a1a2e; color: white; }\n.app { text-align: center; padding: 2rem; }\nbutton { padding: 0.5rem 1rem; cursor: pointer; }`, type: "code" },
            { path: "index.html", content: `<!DOCTYPE html>\n<html>\n<head><title>Demo App</title></head>\n<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>\n</html>`, type: "code" },
            { path: "vite.config.js", content: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({ plugins: [react()] })`, type: "config" }
        ]

        setArtifacts(demoFiles)
        setIsBuilding(false)
        setBuildPhase("Complete!")
        setCurrentAgent(null)
        setBuildProgress(100)
    }

    const handleDownload = () => {
        if (artifacts.length === 0) {
            alert("No files to download yet!")
            return
        }
        alert(`Would download ${artifacts.length} files as ZIP`)
    }

    // Active agents count
    const activeAgents = agents.filter(a => a.status === "generating" || a.status === "thinking").length
    const completedTasks = tasks.filter(t => t.status === "DONE").length

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Left Panel: Orchestrator Chat */}
            <div className="w-[400px] min-w-[350px] border-r flex flex-col bg-muted/5">
                {/* Header */}
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
                            <Badge variant="outline" className="text-[10px] gap-1 bg-amber-50 dark:bg-amber-950 text-amber-600 border-amber-200">
                                <ChefHat className="h-3 w-3" />
                                {currentAgent}
                            </Badge>
                        )}
                        <Badge variant={isBuilding ? "default" : "secondary"} className={cn(
                            "text-[10px]",
                            isBuilding && "bg-amber-500 animate-pulse"
                        )}>
                            {isBuilding ? "🍳 Cooking..." : "Ready"}
                        </Badge>
                    </div>
                </div>

                {/* Orchestrator Panel */}
                <div className="flex-1 overflow-hidden">
                    <OrchestratorPanel />
                </div>

                {/* Demo Button */}
                <div className="p-3 border-t bg-muted/30">
                    <Button
                        onClick={handleDemoMode}
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        disabled={isBuilding}
                    >
                        {isBuilding ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Building...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-3 w-3" />
                                Demo: Simulate Build
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Right Panel: Tabbed Workspace */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header with Tabs */}
                <div className="h-14 border-b flex items-center px-4 justify-between bg-background">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as WorkspaceTab)}>
                        <TabsList className="bg-muted/50">
                            <TabsTrigger value="preview" className="gap-2 text-xs">
                                <Monitor className="h-3.5 w-3.5" />
                                Preview
                            </TabsTrigger>
                            <TabsTrigger value="code" className="gap-2 text-xs">
                                <Code className="h-3.5 w-3.5" />
                                Code
                                {artifacts.length > 0 && (
                                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                                        {artifacts.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="agents" className="gap-2 text-xs">
                                <Users className="h-3.5 w-3.5" />
                                Agents
                                {activeAgents > 0 && (
                                    <Badge className="h-4 px-1 text-[10px] bg-blue-500">
                                        {activeAgents}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="tasks" className="gap-2 text-xs">
                                <ListTodo className="h-3.5 w-3.5" />
                                Tasks
                                {tasks.length > 0 && (
                                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                                        {completedTasks}/{tasks.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2">
                        {/* Progress indicator */}
                        {isBuilding && (
                            <div className="flex items-center gap-2 mr-4">
                                <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-300"
                                        style={{ width: `${buildProgress}%` }}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground">{buildProgress}%</span>
                            </div>
                        )}

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
                            disabled={artifacts.length === 0}
                        >
                            <Rocket className="h-3 w-3" />
                            Deploy
                        </Button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === "preview" && (
                        <WebContainerPreview
                            files={files}
                            appName="MeganAi App"
                            onReady={(url) => console.log("[Preview] Ready at:", url)}
                        />
                    )}

                    {activeTab === "code" && (
                        <CodeViewer
                            previewMode="desktop"
                            isBuilding={isBuilding}
                            buildPhase={buildPhase}
                            buildProgress={buildProgress}
                            artifacts={artifacts}
                        />
                    )}

                    {activeTab === "agents" && (
                        <div className="h-full bg-slate-900 p-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-white mb-2">Agent Collaboration</h2>
                                <p className="text-slate-400 text-sm">
                                    Watch AI agents work together to build your app
                                </p>
                            </div>

                            {/* Agent Grid */}
                            <div className="grid grid-cols-4 gap-4">
                                {agents.map((agent) => (
                                    <div
                                        key={agent.id}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all",
                                            agent.status === "idle" && "bg-slate-800/50 border-slate-700",
                                            agent.status === "thinking" && "bg-amber-900/20 border-amber-600 shadow-lg shadow-amber-900/20",
                                            agent.status === "generating" && "bg-blue-900/20 border-blue-600 shadow-lg shadow-blue-900/20",
                                            agent.status === "complete" && "bg-green-900/20 border-green-600",
                                            agent.status === "error" && "bg-red-900/20 border-red-600"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-3xl">{agent.emoji}</span>
                                            <div>
                                                <h3 className="font-semibold text-white">{agent.name}</h3>
                                                <p className="text-xs text-slate-400">{agent.model}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Badge variant={
                                                agent.status === "idle" ? "secondary" :
                                                    agent.status === "thinking" ? "default" :
                                                        agent.status === "generating" ? "default" :
                                                            agent.status === "complete" ? "default" : "destructive"
                                            } className={cn(
                                                "text-xs capitalize",
                                                agent.status === "thinking" && "bg-amber-600",
                                                agent.status === "generating" && "bg-blue-600",
                                                agent.status === "complete" && "bg-green-600"
                                            )}>
                                                {agent.status === "generating" && (
                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                )}
                                                {agent.status}
                                            </Badge>

                                            {agent.filesGenerated.length > 0 && (
                                                <span className="text-xs text-slate-400">
                                                    {agent.filesGenerated.length} files
                                                </span>
                                            )}
                                        </div>

                                        {agent.currentTask && (
                                            <p className="mt-3 text-xs text-slate-400 truncate">
                                                {agent.currentTask}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Connection Lines Placeholder */}
                            {isBuilding && (
                                <div className="mt-6 flex justify-center">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <div className="w-8 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
                                        <span>Agents collaborating</span>
                                        <div className="w-8 h-px bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "tasks" && (
                        <TaskKanban className="h-full" />
                    )}
                </div>
            </div>
        </div>
    )
}
