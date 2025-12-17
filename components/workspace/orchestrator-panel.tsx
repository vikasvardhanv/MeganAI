"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Loader2, CheckCircle2, XCircle, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    role: "user" | "assistant" | "system"
    content: string
}

interface ProgressEvent {
    type: "thinking" | "generating" | "complete" | "error"
    agent?: string
    message: string
    progress?: number
}

export function OrchestratorPanel() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isOrchestrating, setIsOrchestrating] = useState(false)
    const [currentAgent, setCurrentAgent] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isOrchestrating) return

        const userMessage: Message = { role: "user", content: input }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setIsOrchestrating(true)

        try {
            const response = await fetch("/api/orchestrate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: input })
            })

            if (!response.ok) throw new Error("Orchestration failed")

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value)
                    const lines = chunk.split("\n\n")

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const event: ProgressEvent = JSON.parse(line.slice(6))
                            handleProgressEvent(event)
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Orchestration error:", error)
            setMessages(prev => [...prev, {
                role: "system",
                content: "Error: Failed to orchestrate. Please try again."
            }])
        } finally {
            setIsOrchestrating(false)
            setCurrentAgent(null)
            setProgress(0)
        }
    }

    const handleProgressEvent = (event: ProgressEvent) => {
        if (event.agent) setCurrentAgent(event.agent)
        if (event.progress) setProgress(event.progress)

        setMessages(prev => [...prev, {
            role: "assistant",
            content: event.message
        }])
    }

    const getAgentBadgeColor = (agent: string) => {
        const colors: Record<string, string> = {
            "Architect": "bg-blue-500",
            "UI Designer": "bg-purple-500",
            "Backend Developer": "bg-green-500",
            "Integration Specialist": "bg-orange-500",
        }
        return colors[agent] || "bg-gray-500"
    }

    return (
        <div className="flex h-full flex-col border-r bg-muted/10">
            {/* Header */}
            <div className="flex h-14 items-center border-b px-4 justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="font-semibold">AI Orchestrator</span>
                </div>
                {currentAgent && (
                    <Badge className={cn("text-white", getAgentBadgeColor(currentAgent))}>
                        {currentAgent}
                    </Badge>
                )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bot className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-sm">Describe your app to start building...</p>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex w-full items-start gap-3 animate-fade-in",
                                m.role === "user" ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <div className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm",
                                m.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : m.role === "system"
                                        ? "bg-destructive/10 text-destructive"
                                        : "bg-white dark:bg-slate-800 border"
                            )}>
                                {m.role === "user" ? (
                                    <User className="h-4 w-4" />
                                ) : m.role === "system" ? (
                                    <XCircle className="h-4 w-4" />
                                ) : (
                                    <Bot className="h-4 w-4 text-primary" />
                                )}
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

                    {isOrchestrating && progress > 0 && (
                        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground bg-muted/50 rounded-lg">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span>Orchestrating...</span>
                                    <span className="text-xs">{progress}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Build me a todo app with user auth..."
                        className="flex-1"
                        disabled={isOrchestrating}
                    />
                    <Button type="submit" size="icon" disabled={isOrchestrating}>
                        {isOrchestrating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </div>
        </div>
    )
}
