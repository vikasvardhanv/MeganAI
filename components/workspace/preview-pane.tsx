/**
 * Preview Pane Component
 * Real-time preview of generated files with syntax highlighting
 * Split view with file tree and code viewer
 */

"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { GeneratedFile, AgentCard } from "@/types/agent"
import {
    FileCode, FolderOpen, Folder, ChevronRight, ChevronDown,
    Copy, Check, Download, Eye, Code, Split, Maximize2,
    File, FileJson, FileType, Database
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface PreviewPaneProps {
    files: GeneratedFile[]
    agents: AgentCard[]
}

// File tree node structure
interface FileTreeNode {
    name: string
    path: string
    isDirectory: boolean
    children: FileTreeNode[]
    file?: GeneratedFile
}

export function PreviewPane({ files, agents }: PreviewPaneProps) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/"]))
    const [viewMode, setViewMode] = useState<"code" | "preview" | "split">("code")
    const [copied, setCopied] = useState(false)

    // Build file tree from flat file list
    const fileTree = useMemo(() => {
        const root: FileTreeNode = { name: "/", path: "/", isDirectory: true, children: [] }

        files.forEach(file => {
            const parts = file.path.split("/").filter(Boolean)
            let current = root

            parts.forEach((part, index) => {
                const isLast = index === parts.length - 1
                const path = "/" + parts.slice(0, index + 1).join("/")

                let node = current.children.find(c => c.name === part)

                if (!node) {
                    node = {
                        name: part,
                        path,
                        isDirectory: !isLast,
                        children: [],
                        file: isLast ? file : undefined
                    }
                    current.children.push(node)
                }

                current = node
            })
        })

        // Sort: directories first, then alphabetically
        const sortNodes = (nodes: FileTreeNode[]) => {
            nodes.sort((a, b) => {
                if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
                return a.name.localeCompare(b.name)
            })
            nodes.forEach(node => sortNodes(node.children))
        }
        sortNodes(root.children)

        return root
    }, [files])

    const selectedFileData = files.find(f => f.path === selectedFile)

    const toggleFolder = (path: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev)
            if (next.has(path)) {
                next.delete(path)
            } else {
                next.add(path)
            }
            return next
        })
    }

    const copyCode = () => {
        if (selectedFileData?.content) {
            navigator.clipboard.writeText(selectedFileData.content)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const downloadFile = () => {
        if (selectedFileData) {
            const blob = new Blob([selectedFileData.content], { type: "text/plain" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = selectedFileData.path.split("/").pop() || "file.txt"
            a.click()
            URL.revokeObjectURL(url)
        }
    }

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split(".").pop()?.toLowerCase()
        switch (ext) {
            case "ts":
            case "tsx":
                return <FileCode className="h-4 w-4 text-blue-400" />
            case "js":
            case "jsx":
                return <FileCode className="h-4 w-4 text-yellow-400" />
            case "json":
                return <FileJson className="h-4 w-4 text-amber-400" />
            case "css":
            case "scss":
                return <FileType className="h-4 w-4 text-pink-400" />
            case "prisma":
                return <Database className="h-4 w-4 text-emerald-400" />
            default:
                return <File className="h-4 w-4 text-slate-400" />
        }
    }

    const getAgentInfo = (agentId: string) => {
        return agents.find(a => a.id === agentId)
    }

    return (
        <div className="flex-1 flex bg-slate-900">
            {/* File Tree Sidebar */}
            <div className="w-64 border-r border-slate-700 flex flex-col">
                <div className="p-3 border-b border-slate-700 bg-slate-800/50">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-amber-400" />
                        Generated Files
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {files.length} files
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <FileCode className="h-10 w-10 mb-3 opacity-50" />
                            <p className="text-sm">No files generated yet</p>
                        </div>
                    ) : (
                        <FileTreeView
                            node={fileTree}
                            selectedFile={selectedFile}
                            expandedFolders={expandedFolders}
                            onSelectFile={setSelectedFile}
                            onToggleFolder={toggleFolder}
                            getFileIcon={getFileIcon}
                            getAgentInfo={getAgentInfo}
                            depth={0}
                        />
                    )}
                </div>
            </div>

            {/* Code Viewer */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        {selectedFileData ? (
                            <>
                                {getFileIcon(selectedFileData.path)}
                                <span className="text-sm font-medium text-white">
                                    {selectedFileData.path.split("/").pop()}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {selectedFileData.lineCount} lines
                                </span>
                                {selectedFileData.agentId && (
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-xs bg-gradient-to-r",
                                        getAgentInfo(selectedFileData.agentId)?.color || "from-slate-500 to-slate-600"
                                    )}>
                                        {getAgentInfo(selectedFileData.agentId)?.emoji}{" "}
                                        {getAgentInfo(selectedFileData.agentId)?.name}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-sm text-slate-500">Select a file to view</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View mode toggle */}
                        <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode("code")}
                                className={cn(
                                    "p-1.5 rounded transition-colors",
                                    viewMode === "code" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"
                                )}
                                title="Code view"
                            >
                                <Code className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("preview")}
                                className={cn(
                                    "p-1.5 rounded transition-colors",
                                    viewMode === "preview" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"
                                )}
                                title="Preview"
                            >
                                <Eye className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("split")}
                                className={cn(
                                    "p-1.5 rounded transition-colors",
                                    viewMode === "split" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"
                                )}
                                title="Split view"
                            >
                                <Split className="h-4 w-4" />
                            </button>
                        </div>

                        {selectedFileData && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copyCode}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={downloadFile}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Code content */}
                <div className="flex-1 overflow-auto">
                    {selectedFileData ? (
                        <div className={cn(
                            "h-full",
                            viewMode === "split" && "grid grid-cols-2 divide-x divide-slate-700"
                        )}>
                            {/* Code view */}
                            {(viewMode === "code" || viewMode === "split") && (
                                <div className="h-full overflow-auto">
                                    <pre className="p-4 text-sm font-mono">
                                        <code className="text-slate-300">
                                            {selectedFileData.content.split("\n").map((line, i) => (
                                                <div key={i} className="flex">
                                                    <span className="w-12 text-slate-600 select-none pr-4 text-right">
                                                        {i + 1}
                                                    </span>
                                                    <span className="flex-1">{line || " "}</span>
                                                </div>
                                            ))}
                                        </code>
                                    </pre>
                                </div>
                            )}

                            {/* Preview view */}
                            {(viewMode === "preview" || viewMode === "split") && (
                                <div className="h-full bg-white overflow-auto">
                                    <iframe
                                        className="w-full h-full"
                                        srcDoc={`
                                            <!DOCTYPE html>
                                            <html>
                                            <head>
                                                <style>
                                                    body { font-family: system-ui, sans-serif; padding: 20px; }
                                                    pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow: auto; }
                                                </style>
                                            </head>
                                            <body>
                                                <p style="color: #666;">Preview not available for ${selectedFileData.language} files</p>
                                                <pre>${selectedFileData.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
                                            </body>
                                            </html>
                                        `}
                                        title="Preview"
                                        sandbox="allow-scripts"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <FileCode className="h-16 w-16 mb-4 opacity-30" />
                            <p>Select a file from the sidebar</p>
                            <p className="text-sm mt-1 text-slate-600">to view its contents</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Recursive File Tree Component
function FileTreeView({
    node,
    selectedFile,
    expandedFolders,
    onSelectFile,
    onToggleFolder,
    getFileIcon,
    getAgentInfo,
    depth
}: {
    node: FileTreeNode
    selectedFile: string | null
    expandedFolders: Set<string>
    onSelectFile: (path: string) => void
    onToggleFolder: (path: string) => void
    getFileIcon: (name: string) => React.ReactNode
    getAgentInfo: (agentId: string) => AgentCard | undefined
    depth: number
}) {
    const isExpanded = expandedFolders.has(node.path)

    // Skip rendering root node itself, just render children
    if (depth === 0) {
        return (
            <>
                {node.children.map(child => (
                    <FileTreeView
                        key={child.path}
                        node={child}
                        selectedFile={selectedFile}
                        expandedFolders={expandedFolders}
                        onSelectFile={onSelectFile}
                        onToggleFolder={onToggleFolder}
                        getFileIcon={getFileIcon}
                        getAgentInfo={getAgentInfo}
                        depth={depth + 1}
                    />
                ))}
            </>
        )
    }

    if (node.isDirectory) {
        return (
            <div>
                <button
                    onClick={() => onToggleFolder(node.path)}
                    className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-slate-700/50 transition-colors text-left"
                    style={{ paddingLeft: `${(depth - 1) * 12 + 8}px` }}
                >
                    {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    {isExpanded ? (
                        <FolderOpen className="h-4 w-4 text-amber-400" />
                    ) : (
                        <Folder className="h-4 w-4 text-amber-400" />
                    )}
                    <span className="text-sm text-slate-300">{node.name}</span>
                </button>

                {isExpanded && node.children.map(child => (
                    <FileTreeView
                        key={child.path}
                        node={child}
                        selectedFile={selectedFile}
                        expandedFolders={expandedFolders}
                        onSelectFile={onSelectFile}
                        onToggleFolder={onToggleFolder}
                        getFileIcon={getFileIcon}
                        getAgentInfo={getAgentInfo}
                        depth={depth + 1}
                    />
                ))}
            </div>
        )
    }

    // File node
    const agentInfo = node.file ? getAgentInfo(node.file.agentId) : undefined

    return (
        <button
            onClick={() => onSelectFile(node.path)}
            className={cn(
                "flex items-center gap-2 w-full p-1.5 rounded transition-colors text-left",
                selectedFile === node.path
                    ? "bg-violet-600/30 text-white"
                    : "hover:bg-slate-700/50 text-slate-300"
            )}
            style={{ paddingLeft: `${(depth - 1) * 12 + 24}px` }}
        >
            {getFileIcon(node.name)}
            <span className="text-sm flex-1 truncate">{node.name}</span>
            {agentInfo && (
                <span className="text-xs opacity-70">{agentInfo.emoji}</span>
            )}
        </button>
    )
}
