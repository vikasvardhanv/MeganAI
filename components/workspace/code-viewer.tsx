"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Monitor, Code2, Terminal, Play } from "lucide-react"
import { FileTree, FileNode } from "./file-tree"
import { cn } from "@/lib/utils"
import type { Artifact } from "@/lib/orchestrator/core"

interface CodeViewerProps {
    artifacts?: Artifact[]
    previewMode?: "desktop" | "tablet" | "mobile"
}

export function CodeViewer({ artifacts = [], previewMode = "desktop" }: CodeViewerProps) {
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
    const [fileTree, setFileTree] = useState<FileNode[]>([])

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
                            "bg-white dark:bg-slate-900 border rounded-lg shadow-lg transition-all duration-300 h-[600px]",
                            getPreviewSize()
                        )}>
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
