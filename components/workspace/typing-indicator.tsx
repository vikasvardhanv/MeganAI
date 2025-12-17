"use client"

import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TypingIndicatorProps {
    model?: string | null
}

export function TypingIndicator({ model }: TypingIndicatorProps) {
    return (
        <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted text-foreground">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" />
                    </div>
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
                {model && (
                    <Badge variant="outline" className="mt-2 text-xs">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        {model}
                    </Badge>
                )}
            </div>
        </div>
    )
}
