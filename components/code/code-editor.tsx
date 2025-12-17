"use client"

import { useEffect, useRef } from "react"

interface CodeEditorProps {
    file: string | null
    content: string
}

export function CodeEditor({ file, content }: CodeEditorProps) {
    const codeRef = useRef<HTMLPreElement>(null)

    useEffect(() => {
        // Future: Add syntax highlighting with Prism.js or similar
    }, [content])

    if (!file) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Select a file to view its content</p>
            </div>
        )
    }

    return (
        <div className="h-full overflow-auto bg-muted/30">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-2">
                <span className="text-sm font-medium">{file}</span>
            </div>
            <pre
                ref={codeRef}
                className="p-4 text-sm font-mono overflow-auto"
            >
                <code>{content}</code>
            </pre>
        </div>
    )
}
