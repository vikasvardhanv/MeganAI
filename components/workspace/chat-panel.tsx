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
        if (!input.trim() || isLoading) return

        const userMessage = { role: "user", content: input }
        setInput("") // Optimistic clear

        try {
            await append(userMessage as any)
        } catch (error) {
            console.error("Chat error:", error)
            // Restore input if failed (optional, but good UX)
            // setInput(userMessage.content) 
        }
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
                                "flex w-full items-start gap-3 animate-fade-in",
                                m.role === "user" ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <div className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm",
                                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-white dark:bg-slate-800 border"
                            )}>
                                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                            </div>

                            <div className={cn(
                                "relative px-4 py-3 text-sm shadow-sm max-w-[80%]",
                                m.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                    : "bg-white dark:bg-slate-800 border rounded-2xl rounded-tl-sm"
                            )}>
                                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                            </div>
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
