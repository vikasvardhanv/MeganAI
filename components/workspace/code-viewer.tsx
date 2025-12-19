"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Monitor, Code2, Terminal, Play, Sparkles, Loader2 } from "lucide-react"
import { FileTree, FileNode } from "./file-tree"
import { cn } from "@/lib/utils"
import type { Artifact } from "@/lib/orchestrator/core"

interface CodeViewerProps {
    artifacts?: Artifact[]
    previewMode?: "desktop" | "tablet" | "mobile"
    isBuilding?: boolean
    buildPhase?: string
    buildProgress?: number
}

// Animated code snippets shown during build
const BUILD_ANIMATIONS = [
    { phase: "Understanding", code: "// Analyzing your requirements...\nconst app = analyze(userInput);" },
    { phase: "Planning", code: "// Creating project structure...\nconst structure = {\n  pages: [],\n  components: [],\n  api: []\n};" },
    { phase: "Building", code: "// Generating components...\nexport function App() {\n  return <main>...</main>\n}" },
    { phase: "Styling", code: "// Applying styles...\n.container {\n  display: flex;\n  gap: 1rem;\n}" },
    { phase: "Finishing", code: "// Final touches...\nconsole.log('✅ Build complete!');" }
]

export function CodeViewer({
    artifacts = [],
    previewMode = "desktop",
    isBuilding = false,
    buildPhase = "Preparing",
    buildProgress = 0
}: CodeViewerProps) {
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
    const [fileTree, setFileTree] = useState<FileNode[]>([])
    const [animatedCode, setAnimatedCode] = useState("")
    const [codeIndex, setCodeIndex] = useState(0)
    const [charIndex, setCharIndex] = useState(0)

    // Preview container sizing based on device mode
    const getPreviewSize = () => {
        switch (previewMode) {
            case "mobile":
                return "max-w-[375px]"
            case "tablet":
                return "max-w-[768px]"
            default:
                return "w-full"
        }
    }

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
            }, 25)
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

    // Convert artifacts to file tree structure
    useEffect(() => {
        if (artifacts.length === 0) return

        const tree: FileNode[] = []
        const folders: Record<string, FileNode> = {}

        artifacts.forEach(artifact => {
            const parts = artifact.path.split("/")
            let currentPath = ""

            parts.forEach((part, index) => {
                const isLast = index === parts.length - 1
                currentPath += (currentPath ? "/" : "") + part

                if (isLast) {
                    // It's a file
                    const parentPath = parts.slice(0, -1).join("/") || "/"
                    const parent = folders[parentPath] || {
                        name: "/",
                        path: "/",
                        type: "folder" as const,
                        children: tree
                    }

                    const file: FileNode = {
                        name: part,
                        path: artifact.path,
                        type: "file",
                        content: artifact.content
                    }

                    if (parent.children) {
                        parent.children.push(file)
                    }
                } else {
                    // It's a folder
                    if (!folders[currentPath]) {
                        const folder: FileNode = {
                            name: part,
                            path: currentPath,
                            type: "folder",
                            children: []
                        }

                        const parentPath = parts.slice(0, index).join("/") || "/"
                        const parent = folders[parentPath]

                        if (parent?.children) {
                            parent.children.push(folder)
                        } else {
                            tree.push(folder)
                        }

                        folders[currentPath] = folder
                    }
                }
            })
        })

        setFileTree(tree)
    }, [artifacts])

    return (
        <div className="flex flex-col h-full">
            <Tabs defaultValue="preview" className="flex-1 flex flex-col">
                <div className="border-b">
                    <TabsList className="h-12">
                        <TabsTrigger value="preview">
                            <Monitor className="w-4 h-4 mr-2" />
                            Preview
                            {isBuilding && (
                                <Badge variant="secondary" className="ml-2 text-[10px] animate-pulse">
                                    Building...
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="code">
                            <Code2 className="w-4 h-4 mr-2" />
                            Code
                        </TabsTrigger>
                        <TabsTrigger value="console">
                            <Terminal className="w-4 h-4 mr-2" />
                            Console
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="preview" className="flex-1 m-0">
                    <div className="h-full flex items-center justify-center bg-muted/20 p-4">
                        <div className={cn(
                            "bg-white dark:bg-slate-900 border rounded-lg shadow-lg transition-all duration-300 h-[600px] overflow-hidden",
                            getPreviewSize()
                        )}>
                            {isBuilding ? (
                                /* Building Animation */
                                <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 flex flex-col items-center justify-center p-8">
                                    {/* Progress Bar at Top */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700">
                                        <div
                                            className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-500 transition-all duration-500"
                                            style={{ width: `${buildProgress}%` }}
                                        />
                                    </div>

                                    {/* Animated Orb */}
                                    <div className="relative mb-8">
                                        <div className="w-28 h-28 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 animate-pulse opacity-30 blur-2xl absolute inset-0" />
                                        <div className="w-28 h-28 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 flex items-center justify-center relative border-2 border-white/20">
                                            <Sparkles className="h-14 w-14 text-white animate-pulse" />
                                        </div>
                                        {/* Orbiting dots */}
                                        <div className="absolute inset-[-20px] animate-spin" style={{ animationDuration: "3s" }}>
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                                        </div>
                                        <div className="absolute inset-[-30px] animate-spin" style={{ animationDuration: "5s", animationDirection: "reverse" }}>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50" />
                                        </div>
                                        <div className="absolute inset-[-15px] animate-spin" style={{ animationDuration: "4s" }}>
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50" />
                                        </div>
                                    </div>

                                    {/* Phase Text */}
                                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        {buildPhase}...
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-8">
                                        {Math.round(buildProgress)}% complete
                                    </p>

                                    {/* Animated Code Display */}
                                    <div className="w-full max-w-lg bg-slate-950/80 rounded-xl p-5 font-mono text-sm border border-slate-700/50 backdrop-blur">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-3 h-3 rounded-full bg-red-500" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                            <div className="w-3 h-3 rounded-full bg-green-500" />
                                            <span className="ml-2 text-xs text-slate-500">megan-ai.js</span>
                                        </div>
                                        <pre className="text-green-400 whitespace-pre-wrap min-h-[100px]">
                                            {animatedCode}
                                            <span className="animate-pulse text-white">▌</span>
                                        </pre>
                                    </div>
                                </div>
                            ) : artifacts.length > 0 ? (
                                /* Has artifacts - show preview */
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Sparkles className="w-8 h-8 text-green-500" />
                                        </div>
                                        <p className="text-lg font-medium">App Ready!</p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {artifacts.length} files generated
                                        </p>
                                        <Button variant="outline" size="sm" className="mt-4">
                                            <Play className="w-3 h-3 mr-2" />
                                            Start Preview Server
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* Empty state */
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <Monitor className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p className="text-sm">Live preview will appear here</p>
                                        <p className="text-xs text-muted-foreground/60 mt-2">
                                            Mode: {previewMode}
                                        </p>
                                        <Button variant="outline" size="sm" className="mt-4">
                                            <Play className="w-3 h-3 mr-2" />
                                            Start Preview Server
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="code" className="flex-1 m-0">
                    <div className="grid grid-cols-[250px_1fr] h-full">
                        <div className="border-r">
                            <FileTree files={fileTree} onFileSelect={setSelectedFile} />
                        </div>
                        <ScrollArea className="h-full">
                            {selectedFile ? (
                                <pre className="p-4 text-xs font-mono">
                                    <code>{selectedFile.content || "// No content"}</code>
                                </pre>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                    Select a file to view its contents
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </TabsContent>

                <TabsContent value="console" className="flex-1 m-0">
                    <ScrollArea className="h-full">
                        <div className="p-4 font-mono text-xs space-y-1">
                            <div className="text-muted-foreground">Console output will appear here...</div>
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    )
}

