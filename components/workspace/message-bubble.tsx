"use client"

import { Message } from "@/types/project"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface MessageBubbleProps {
    message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === "USER"

    return (
        <div
            className={cn(
                "flex",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3",
                    isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                )}
            >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                {message.model && (
                    <Badge variant="outline" className="mt-2 text-xs">
                        {message.model}
                    </Badge>
                )}
            </div>
        </div>
    )
}
