"use client"

import { File, Folder, ChevronRight, ChevronDown } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface FileTreeProps {
    files: Record<string, string>
    selectedFile: string | null
    onSelectFile: (file: string) => void
}

export function FileTree({ files, selectedFile, onSelectFile }: FileTreeProps) {
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set([""]))

    // Build tree structure from flat file paths
    const tree = buildTree(Object.keys(files))

    return (
        <div className="p-2">
            <TreeNode
                node={tree}
                path=""
                level={0}
                selectedFile={selectedFile}
                expandedDirs={expandedDirs}
                onToggleDir={(dir) => {
                    setExpandedDirs((prev) => {
                        const next = new Set(prev)
                        if (next.has(dir)) {
                            next.delete(dir)
                        } else {
                            next.add(dir)
                        }
                        return next
                    })
                }}
                onSelectFile={onSelectFile}
            />
        </div>
    )
}

interface TreeNodeType {
    name: string
    type: "file" | "directory"
    children?: TreeNodeType[]
}

function TreeNode({
    node,
    path,
    level,
    selectedFile,
    expandedDirs,
    onToggleDir,
    onSelectFile,
}: {
    node: TreeNodeType
    path: string
    level: number
    selectedFile: string | null
    expandedDirs: Set<string>
    onToggleDir: (dir: string) => void
    onSelectFile: (file: string) => void
}) {
    const fullPath = path ? `${path}/${node.name}` : node.name
    const isExpanded = expandedDirs.has(fullPath)
    const isSelected = selectedFile === fullPath

    if (node.type === "file") {
        return (
            <button
                onClick={() => onSelectFile(fullPath)}
                className={cn(
                    "w-full flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-accent",
                    isSelected && "bg-accent text-accent-foreground"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                <File className="h-4 w-4 text-muted-foreground" />
                <span>{node.name}</span>
            </button>
        )
    }

    return (
        <div>
            <button
                onClick={() => onToggleDir(fullPath)}
                className="w-full flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-accent"
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span>{node.name}</span>
            </button>
            {isExpanded &&
                node.children?.map((child) => (
                    <TreeNode
                        key={child.name}
                        node={child}
                        path={fullPath}
                        level={level + 1}
                        selectedFile={selectedFile}
                        expandedDirs={expandedDirs}
                        onToggleDir={onToggleDir}
                        onSelectFile={onSelectFile}
                    />
                ))}
        </div>
    )
}

function buildTree(files: string[]): TreeNodeType {
    const root: TreeNodeType = { name: "", type: "directory", children: [] }

    files.forEach((file) => {
        const parts = file.split("/")
        let current = root

        parts.forEach((part, i) => {
            const isLast = i === parts.length - 1
            const existing = current.children?.find((c) => c.name === part)

            if (existing) {
                current = existing
            } else {
                const node: TreeNodeType = {
                    name: part,
                    type: isLast ? "file" : "directory",
                    children: isLast ? undefined : [],
                }
                current.children!.push(node)
                if (!isLast) current = node
            }
        })
    })

    return root
}
