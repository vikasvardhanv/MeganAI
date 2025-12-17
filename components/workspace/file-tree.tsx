"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
    ChevronRight,
    ChevronDown,
    FileCode,
    FolderClosed,
    FolderOpen,
    Download
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface FileNode {
    name: string
    path: string
    type: "file" | "folder"
    children?: FileNode[]
    content?: string
}

interface FileTreeProps {
    files: FileNode[]
    onFileSelect?: (file: FileNode) => void
}

export function FileTree({ files, onFileSelect }: FileTreeProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set(["/"]))
    const [selected, setSelected] = useState<string | null>(null)

    const toggleExpand = (path: string) => {
        const newExpanded = new Set(expanded)
        if (newExpanded.has(path)) {
            newExpanded.delete(path)
        } else {
            newExpanded.add(path)
        }
        setExpanded(newExpanded)
    }

    const handleSelect = (file: FileNode) => {
        if (file.type === "file") {
            setSelected(file.path)
            onFileSelect?.(file)
        } else {
            toggleExpand(file.path)
        }
    }

    const renderNode = (node: FileNode, level: number = 0) => {
        const isExpanded = expanded.has(node.path)
        const isSelected = selected === node.path

        return (
            <div key={node.path}>
                <button
                    onClick={() => handleSelect(node)}
                    className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded-sm transition-colors",
                        isSelected && "bg-primary/10 text-primary font-medium"
                    )}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                >
                    {node.type === "folder" ? (
                        isExpanded ? (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                <FolderOpen className="w-4 h-4 text-amber-500" />
                            </>
                        ) : (
                            <>
                                <ChevronRight className="w-4 h-4" />
                                <FolderClosed className="w-4 h-4 text-amber-500" />
                            </>
                        )
                    ) : (
                        <>
                            <span className="w-4" /> {/* Spacer */}
                            <FileCode className="w-4 h-4 text-blue-500" />
                        </>
                    )}
                    <span className="flex-1 text-left truncate">{node.name}</span>
                </button>
                {node.type === "folder" && isExpanded && node.children && (
                    <div>
                        {node.children.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    const handleDownloadAll = async () => {
        if (files.length === 0) {
            alert("No files to download")
            return
        }

        try {
            // Import ZIP utilities
            const { generateProjectZip, downloadBlob } = await import("@/lib/utils/zip")

            // Convert FileNode tree to Artifact array
            const artifacts: any[] = []
            const extractArtifacts = (nodes: FileNode[]) => {
                nodes.forEach(node => {
                    if (node.type === "file" && node.content) {
                        artifacts.push({
                            type: "code",
                            path: node.path,
                            content: node.content,
                            language: node.path.split(".").pop()
                        })
                    } else if (node.children) {
                        extractArtifacts(node.children)
                    }
                })
            }
            extractArtifacts(files)

            // Generate and download ZIP
            const blob = await generateProjectZip(artifacts, "meganai-app")
            downloadBlob(blob, "meganai-app.zip")
        } catch (error) {
            console.error("Failed to generate ZIP:", error)
            alert("Failed to generate ZIP. Please try again.")
        }
    }

    return (
        <div className="flex flex-col h-full border rounded-lg bg-background">
            <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                <h3 className="font-semibold text-sm">Generated Files</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAll}
                    className="h-7"
                >
                    <Download className="w-3 h-3 mr-2" />
                    ZIP
                </Button>
            </div>
            <ScrollArea className="flex-1 p-2">
                {files.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No files generated yet
                    </div>
                ) : (
                    files.map(node => renderNode(node))
                )}
            </ScrollArea>
        </div>
    )
}
