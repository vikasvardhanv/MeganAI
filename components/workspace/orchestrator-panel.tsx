"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Loader2, CheckCircle2, XCircle, Activity, Sparkles, Hammer } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    role: "user" | "assistant" | "system"
    content: string
    action?: "ask_question" | "summarize_plan" | "start_building"
}

interface ConversationState {
    phase: "gathering" | "planning" | "building" | "complete"
    projectSpec?: {
        name?: string
        description?: string
        features?: string[]
    }
    confidence?: number
}

export function OrchestratorPanel() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "👋 Hey! I'm Megan, your AI architect. Tell me about the app you want to build - what problem should it solve?"
        }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [state, setState] = useState<ConversationState>({ phase: "gathering" })
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = { role: "user", content: input }
        const allMessages = [...messages, userMessage]
        setMessages(allMessages)
        setInput("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: allMessages.map(m => ({ role: m.role, content: m.content })),
                    state
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Chat failed")
            }

            const data = await response.json()

            // Update state
            if (data.state) {
                setState(data.state)
            }

            // Add assistant response
            setMessages(prev => [...prev, {
                role: "assistant",
                content: data.message,
                action: data.action
            }])

            // If ready to build, trigger orchestration
            if (data.action === "start_building" || (data.confidence && data.confidence >= 80)) {
                setTimeout(() => {
                    handleStartBuilding()
                }, 1000)
            }

        } catch (error) {
            console.error("Chat error:", error)
            setMessages(prev => [...prev, {
                role: "system",
                content: `Error: ${error instanceof Error ? error.message : "Failed to respond"}`
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleStartBuilding = async () => {
        setMessages(prev => [...prev, {
            role: "assistant",
            content: "🚀 **Starting to build your app!**\n\nI'm generating the code now..."
        }])

        setState(prev => ({ ...prev, phase: "building" }))

        // Trigger the full orchestration
        try {
            const buildPrompt = state.projectSpec
                ? `Build: ${state.projectSpec.name || 'App'} - ${state.projectSpec.description || ''}\nFeatures: ${(state.projectSpec.features || []).join(', ')}`
                : messages.filter(m => m.role === "user").map(m => m.content).join(". ")

            const response = await fetch("/api/orchestrate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: buildPrompt })
            })

            if (!response.ok) throw new Error("Build failed")

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
                            try {
                                const event = JSON.parse(line.slice(6))
                                if (event.message) {
                                    setMessages(prev => [...prev, {
                                        role: "assistant",
                                        content: event.message
                                    }])
                                }
                            } catch { }
                        }
                    }
                }
            }

            setState(prev => ({ ...prev, phase: "complete" }))
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "✅ **Your app is ready!** Check the code viewer on the right to see the generated files."
            }])

        } catch (error) {
            setMessages(prev => [...prev, {
                role: "system",
                content: "Build failed. Please try again."
            }])
        }
    }

    const getPhaseDisplay = () => {
        switch (state.phase) {
            case "gathering": return { icon: Sparkles, text: "Understanding", color: "text-blue-500" }
            case "planning": return { icon: Activity, text: "Planning", color: "text-purple-500" }
            case "building": return { icon: Hammer, text: "Building", color: "text-orange-500" }
            case "complete": return { icon: CheckCircle2, text: "Complete", color: "text-green-500" }
        }
    }

    const phase = getPhaseDisplay()
    const PhaseIcon = phase.icon

    return (
        <div className="flex h-full flex-col border-r bg-muted/10">
            {/* Header */}
            <div className="flex h-14 items-center border-b px-4 justify-between bg-background/80 backdrop-blur">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Megan</span>
                </div>
                <Badge variant="secondary" className={cn("gap-1", phase.color)}>
                    <PhaseIcon className="w-3 h-3" />
                    {phase.text}
                </Badge>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
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
                                        : "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                            )}>
                                {m.role === "user" ? (
                                    <User className="h-4 w-4" />
                                ) : m.role === "system" ? (
                                    <XCircle className="h-4 w-4" />
                                ) : (
                                    <Bot className="h-4 w-4" />
                                )}
                            </div>

                            <div className={cn(
                                "relative px-4 py-3 text-sm shadow-sm max-w-[85%]",
                                m.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                    : "bg-white dark:bg-slate-800 border rounded-2xl rounded-tl-sm"
                            )}>
                                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                                <Loader2 className="h-4 w-4 text-white animate-spin" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 border px-4 py-3 rounded-2xl rounded-tl-sm">
                                <span className="text-sm text-muted-foreground">Thinking...</span>
                            </div>
                        </div>
                    )}

                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-background/50">
                {state.phase === "building" ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Building your app...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Tell me about your app..."
                            className="flex-1"
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    )
}

