"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function ChatPanel() {
    const { messages, append, isLoading } = useChat({
        api: "/api/generate",
        body: {
            task: "architecture-planning",
        }
    } as any) as any // Type assertion to bypass strict checks for now

    const [input, setInput] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return
        const value = input
        setInput("")
        await append({ role: "user", content: value })
    }

    return (
        <div className="flex h-full flex-col border-r bg-muted/10">
            <div className="flex h-14 items-center border-b px-4 font-semibold">
                AI Assistant
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((m: any) => (
                        <div
                            key={m.id}
                            className={cn(
                                "flex w-full items-start gap-2 rounded-lg p-3 text-sm",
                                m.role === "user"
                                    ? "bg-primary text-primary-foreground ml-auto max-w-[80%]"
                                    : "bg-muted text-foreground max-w-[90%]"
                            )}
                        >
                            {m.role === "user" ? <User className="h-4 w-4 mt-1" /> : <Bot className="h-4 w-4 mt-1" />}
                            <div className="whitespace-pre-wrap">{m.content}</div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                            <Bot className="h-4 w-4" />
                            <span className="animate-pulse">Thinking...</span>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your app..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isLoading}>
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </div>
        </div>
    )
}
