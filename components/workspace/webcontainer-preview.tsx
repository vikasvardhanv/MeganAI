"use client"

/**
 * WebContainer Preview Component
 * Runs generated code in the browser and displays live preview
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Play,
    Square,
    RefreshCw,
    Terminal,
    ExternalLink,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Monitor,
    Smartphone,
    Tablet
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    bootWebContainer,
    isWebContainerSupported,
    writeFilesToContainer,
    installDependencies,
    startDevServer,
    teardownWebContainer,
    type ProcessOutput,
    type WebContainerState,
    initialWebContainerState
} from "@/lib/webcontainer/container"
import { mergeWithTemplate, convertNextToVite } from "@/lib/webcontainer/templates"
import type { WebContainer } from "@webcontainer/api"

interface WebContainerPreviewProps {
    files: Record<string, string>
    appName?: string
    className?: string
    onReady?: (url: string) => void
}

type DeviceMode = "desktop" | "tablet" | "mobile"

export function WebContainerPreview({
    files,
    appName = "MeganAi App",
    className,
    onReady
}: WebContainerPreviewProps) {
    const [state, setState] = useState<WebContainerState>(initialWebContainerState)
    const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop")
    const [showConsole, setShowConsole] = useState(false)
    const containerRef = useRef<WebContainer | null>(null)
    const consoleRef = useRef<HTMLDivElement>(null)

    // Check browser support on mount
    useEffect(() => {
        setState(prev => ({
            ...prev,
            isSupported: isWebContainerSupported()
        }))
    }, [])

    // Auto-scroll console
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight
        }
    }, [state.consoleOutput])

    const addConsoleOutput = useCallback((output: ProcessOutput) => {
        setState(prev => ({
            ...prev,
            consoleOutput: [...prev.consoleOutput, output.data]
        }))
    }, [])

    const handleStart = useCallback(async () => {
        if (!state.isSupported) {
            setState(prev => ({
                ...prev,
                error: "WebContainers not supported in this browser. Requires SharedArrayBuffer."
            }))
            return
        }

        if (Object.keys(files).length === 0) {
            setState(prev => ({
                ...prev,
                error: "No files to run. Generate some code first!"
            }))
            return
        }

        try {
            // Boot WebContainer
            setState(prev => ({
                ...prev,
                isBooting: true,
                error: null,
                consoleOutput: ["🔧 Booting WebContainer...\n"]
            }))

            const container = await bootWebContainer()
            containerRef.current = container

            setState(prev => ({
                ...prev,
                isBooting: false,
                isReady: true,
                consoleOutput: [...prev.consoleOutput, "✅ WebContainer ready!\n"]
            }))

            // Convert and merge files
            addConsoleOutput({ type: "stdout", data: "📁 Preparing files...\n" })
            const viteFiles = convertNextToVite(files)
            const mergedFiles = mergeWithTemplate(viteFiles, appName)

            // Write files to container
            await writeFilesToContainer(container, mergedFiles)
            addConsoleOutput({ type: "stdout", data: `📄 Mounted ${Object.keys(mergedFiles).length} files\n` })

            // Install dependencies
            setState(prev => ({ ...prev, isInstalling: true }))
            const installed = await installDependencies(container, addConsoleOutput)

            if (!installed) {
                setState(prev => ({
                    ...prev,
                    isInstalling: false,
                    error: "Failed to install dependencies"
                }))
                return
            }

            setState(prev => ({ ...prev, isInstalling: false, isRunning: true }))

            // Start dev server
            await startDevServer(
                container,
                addConsoleOutput,
                (url) => {
                    setState(prev => ({ ...prev, previewUrl: url }))
                    onReady?.(url)
                }
            )

        } catch (error) {
            console.error("[WebContainerPreview] Error:", error)
            setState(prev => ({
                ...prev,
                isBooting: false,
                isInstalling: false,
                isRunning: false,
                error: error instanceof Error ? error.message : "Unknown error"
            }))
        }
    }, [files, appName, state.isSupported, addConsoleOutput, onReady])

    const handleStop = useCallback(async () => {
        await teardownWebContainer()
        containerRef.current = null
        setState({
            ...initialWebContainerState,
            isSupported: isWebContainerSupported()
        })
    }, [])

    const handleRefresh = useCallback(() => {
        // Refresh the iframe
        const iframe = document.querySelector('iframe[data-webcontainer-preview]') as HTMLIFrameElement
        if (iframe && state.previewUrl) {
            iframe.src = state.previewUrl
        }
    }, [state.previewUrl])

    const getDeviceClass = () => {
        switch (deviceMode) {
            case "mobile":
                return "max-w-[375px]"
            case "tablet":
                return "max-w-[768px]"
            default:
                return "w-full"
        }
    }

    const getStatusBadge = () => {
        if (state.error) {
            return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Error</Badge>
        }
        if (state.isBooting) {
            return <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Booting</Badge>
        }
        if (state.isInstalling) {
            return <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Installing</Badge>
        }
        if (state.isRunning && state.previewUrl) {
            return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Running</Badge>
        }
        if (state.isRunning) {
            return <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Starting</Badge>
        }
        return <Badge variant="outline" className="gap-1">Ready</Badge>
    }

    // Not supported view
    if (!state.isSupported && typeof window !== "undefined") {
        return (
            <div className={cn("flex flex-col h-full bg-slate-900", className)}>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                            WebContainers Not Available
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Live preview requires SharedArrayBuffer, which needs specific HTTP headers.
                            This works on Vercel but may not work locally without HTTPS.
                        </p>
                        <p className="text-slate-500 text-xs">
                            Try deploying to Vercel or use a local HTTPS proxy.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col h-full bg-slate-900", className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">Live Preview</span>
                    {getStatusBadge()}
                </div>

                <div className="flex items-center gap-2">
                    {/* Device Mode Selector */}
                    <div className="flex items-center border border-slate-600 rounded-md bg-slate-800">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7 rounded-none", deviceMode === "desktop" && "bg-slate-700")}
                            onClick={() => setDeviceMode("desktop")}
                        >
                            <Monitor className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7 rounded-none", deviceMode === "tablet" && "bg-slate-700")}
                            onClick={() => setDeviceMode("tablet")}
                        >
                            <Tablet className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7 rounded-none", deviceMode === "mobile" && "bg-slate-700")}
                            onClick={() => setDeviceMode("mobile")}
                        >
                            <Smartphone className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {/* Controls */}
                    {!state.isRunning ? (
                        <Button
                            size="sm"
                            onClick={handleStart}
                            disabled={state.isBooting || state.isInstalling}
                            className="gap-1"
                        >
                            {state.isBooting || state.isInstalling ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Play className="h-3 w-3" />
                            )}
                            Run
                        </Button>
                    ) : (
                        <>
                            <Button size="sm" variant="outline" onClick={handleRefresh} className="gap-1">
                                <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={handleStop} className="gap-1">
                                <Square className="h-3 w-3" />
                                Stop
                            </Button>
                        </>
                    )}

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowConsole(!showConsole)}
                        className={cn("gap-1", showConsole && "bg-slate-700")}
                    >
                        <Terminal className="h-3 w-3" />
                    </Button>

                    {state.previewUrl && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(state.previewUrl!, "_blank")}
                        >
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Iframe Preview */}
                <div className={cn(
                    "flex-1 flex items-center justify-center p-4 bg-slate-950",
                    showConsole && "border-r border-slate-700"
                )}>
                    {state.previewUrl ? (
                        <div className={cn(
                            "h-full bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300",
                            getDeviceClass()
                        )}>
                            <iframe
                                data-webcontainer-preview
                                src={state.previewUrl}
                                className="w-full h-full border-0"
                                title="Live Preview"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                            />
                        </div>
                    ) : (
                        <div className="text-center">
                            {state.isBooting || state.isInstalling || state.isRunning ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 animate-pulse opacity-30 blur-xl absolute inset-0 mx-auto" />
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 flex items-center justify-center relative mx-auto">
                                            <Loader2 className="h-10 w-10 text-white animate-spin" />
                                        </div>
                                    </div>
                                    <p className="text-white font-medium">
                                        {state.isBooting && "Booting WebContainer..."}
                                        {state.isInstalling && "Installing dependencies..."}
                                        {state.isRunning && !state.previewUrl && "Starting dev server..."}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Monitor className="w-16 h-16 mx-auto text-slate-600" />
                                    <p className="text-slate-400">
                                        Click "Run" to start the live preview
                                    </p>
                                    {Object.keys(files).length === 0 && (
                                        <p className="text-slate-500 text-sm">
                                            Generate some code first!
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Console Panel */}
                {showConsole && (
                    <div className="w-80 flex flex-col bg-slate-900">
                        <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-400">Console</span>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={() => setState(prev => ({ ...prev, consoleOutput: [] }))}
                            >
                                Clear
                            </Button>
                        </div>
                        <ScrollArea className="flex-1">
                            <div
                                ref={consoleRef}
                                className="p-2 font-mono text-xs text-slate-300 whitespace-pre-wrap"
                            >
                                {state.consoleOutput.length === 0 ? (
                                    <span className="text-slate-500">Console output will appear here...</span>
                                ) : (
                                    state.consoleOutput.map((line, i) => (
                                        <div key={i} className={cn(
                                            line.includes("error") || line.includes("Error") || line.includes("❌")
                                                ? "text-red-400"
                                                : line.includes("✅") || line.includes("✨")
                                                    ? "text-green-400"
                                                    : ""
                                        )}>
                                            {line}
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>

            {/* Error Banner */}
            {state.error && (
                <div className="px-4 py-2 bg-red-900/50 border-t border-red-800 text-red-200 text-sm">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    {state.error}
                </div>
            )}
        </div>
    )
}

export default WebContainerPreview
