/**
 * Live Preview Panel
 * Animated preview window that shows app being built in real-time
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import {
    Monitor, Smartphone, Tablet, RefreshCw, ExternalLink,
    Code, Eye, Loader2, CheckCircle2, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PreviewFile {
    path: string
    content: string
    language: string
}

interface LivePreviewProps {
    isBuilding: boolean
    buildProgress?: number
    buildPhase?: string
    files?: PreviewFile[]
    previewUrl?: string
    onRefresh?: () => void
}

type DeviceType = "desktop" | "tablet" | "mobile"

const DEVICE_SIZES = {
    desktop: { width: "100%", maxWidth: "100%" },
    tablet: { width: "768px", maxWidth: "768px" },
    mobile: { width: "375px", maxWidth: "375px" }
}

// Animated code snippets that appear during build
const BUILD_ANIMATIONS = [
    { phase: "Understanding", code: "// Analyzing your requirements...\nconst app = analyze(userInput);" },
    { phase: "Planning", code: "// Creating project structure...\nconst structure = {\n  pages: [],\n  components: [],\n  api: []\n};" },
    { phase: "Building", code: "// Generating components...\nexport function App() {\n  return <main>...</main>\n}" },
    { phase: "Styling", code: "// Applying styles...\n.container {\n  display: flex;\n  gap: 1rem;\n}" },
    { phase: "Finishing", code: "// Final touches...\nconsole.log('✅ Build complete!');" }
]

export function LivePreview({
    isBuilding,
    buildProgress = 0,
    buildPhase = "Preparing",
    files = [],
    previewUrl,
    onRefresh
}: LivePreviewProps) {
    const [device, setDevice] = useState<DeviceType>("desktop")
    const [showCode, setShowCode] = useState(false)
    const [animatedCode, setAnimatedCode] = useState("")
    const [codeIndex, setCodeIndex] = useState(0)
    const [charIndex, setCharIndex] = useState(0)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    // Typing animation during build
    useEffect(() => {
        if (!isBuilding) {
            setAnimatedCode("")
            setCodeIndex(0)
            setCharIndex(0)
            return
        }

        const currentSnippet = BUILD_ANIMATIONS[codeIndex % BUILD_ANIMATIONS.length]
        const targetCode = currentSnippet.code

        if (charIndex < targetCode.length) {
            const timer = setTimeout(() => {
                setAnimatedCode(targetCode.slice(0, charIndex + 1))
                setCharIndex(c => c + 1)
            }, 20)
            return () => clearTimeout(timer)
        } else {
            const timer = setTimeout(() => {
                setCodeIndex(c => c + 1)
                setCharIndex(0)
                setAnimatedCode("")
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [isBuilding, charIndex, codeIndex])

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-violet-400" />
                        <span className="font-medium text-white text-sm">Live Preview</span>
                    </div>
                    {isBuilding && (
                        <Badge variant="secondary" className="gap-1 animate-pulse bg-violet-500/20 text-violet-300">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {buildPhase}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Device Toggles */}
                    <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7", device === "desktop" && "bg-slate-600")}
                            onClick={() => setDevice("desktop")}
                        >
                            <Monitor className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7", device === "tablet" && "bg-slate-600")}
                            onClick={() => setDevice("tablet")}
                        >
                            <Tablet className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7", device === "mobile" && "bg-slate-600")}
                            onClick={() => setDevice("mobile")}
                        >
                            <Smartphone className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {/* Code/Preview Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowCode(!showCode)}
                    >
                        {showCode ? <Eye className="h-3.5 w-3.5" /> : <Code className="h-3.5 w-3.5" />}
                    </Button>

                    {/* Refresh */}
                    {onRefresh && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh}>
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                    )}

                    {/* Open in new tab */}
                    {previewUrl && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {isBuilding && (
                <div className="h-1 bg-slate-700">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${buildProgress}%` }}
                    />
                </div>
            )}

            {/* Preview Area */}
            <div className="flex-1 p-4 overflow-hidden bg-slate-950">
                <div
                    className={cn(
                        "h-full mx-auto rounded-lg overflow-hidden shadow-2xl transition-all duration-500",
                        device !== "desktop" && "border border-slate-700"
                    )}
                    style={DEVICE_SIZES[device]}
                >
                    {isBuilding ? (
                        /* Building Animation */
                        <div className="h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-8">
                            {/* Animated Orb */}
                            <div className="relative mb-8">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 animate-pulse opacity-20 blur-xl absolute inset-0" />
                                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center relative">
                                    <Sparkles className="h-12 w-12 text-white animate-pulse" />
                                </div>
                                {/* Orbiting dots */}
                                <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
                                    <div className="absolute -top-2 left-1/2 w-3 h-3 rounded-full bg-cyan-400" />
                                </div>
                                <div className="absolute inset-0 animate-spin" style={{ animationDuration: "4s", animationDirection: "reverse" }}>
                                    <div className="absolute -right-2 top-1/2 w-2 h-2 rounded-full bg-pink-400" />
                                </div>
                            </div>

                            {/* Phase Text */}
                            <h3 className="text-xl font-bold text-white mb-2">
                                {buildPhase}...
                            </h3>
                            <p className="text-slate-400 text-sm mb-6">
                                {Math.round(buildProgress)}% complete
                            </p>

                            {/* Animated Code Display */}
                            <div className="w-full max-w-md bg-slate-900/80 rounded-lg p-4 font-mono text-xs">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <pre className="text-green-400 whitespace-pre-wrap min-h-[80px]">
                                    {animatedCode}
                                    <span className="animate-pulse">|</span>
                                </pre>
                            </div>
                        </div>
                    ) : showCode && files.length > 0 ? (
                        /* Code View */
                        <div className="h-full bg-slate-900 overflow-auto">
                            {files.map((file, i) => (
                                <div key={file.path} className="border-b border-slate-700">
                                    <div className="px-4 py-2 bg-slate-800 text-xs text-slate-400">
                                        {file.path}
                                    </div>
                                    <pre className="p-4 text-xs text-slate-300 overflow-auto">
                                        {file.content.slice(0, 500)}
                                        {file.content.length > 500 && "..."}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    ) : previewUrl ? (
                        /* Live Preview */
                        <iframe
                            ref={iframeRef}
                            src={previewUrl}
                            className="w-full h-full bg-white"
                            title="App Preview"
                        />
                    ) : (
                        /* Empty State */
                        <div className="h-full bg-slate-900 flex flex-col items-center justify-center">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">
                                Ready to Build
                            </h3>
                            <p className="text-sm text-slate-400 text-center max-w-xs">
                                Start building your app and watch it come to life here
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
