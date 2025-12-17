// stores/chat-store.ts

import { create } from "zustand"
import { Message } from "@/types/project"

interface ChatState {
    messages: Message[]
    isGenerating: boolean
    currentModel: string | null
    sendMessage: (projectId: string, content: string) => Promise<void>
    enhancePrompt: (prompt: string) => Promise<string>
    loadMessages: (projectId: string) => Promise<void>
    reset: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
    messages: [],
    isGenerating: false,
    currentModel: null,

    sendMessage: async (projectId, content) => {
        set({ isGenerating: true })

        // Add user message immediately
        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "USER",
            content,
            createdAt: new Date(),
        }
        set((state) => ({ messages: [...state.messages, userMessage] }))

        try {
            const response = await fetch("/api/generate/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, message: content }),
            })

            const reader = response.body?.getReader()
            if (!reader) throw new Error("No response body")

            const decoder = new TextDecoder()
            let assistantContent = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split("\n")

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6))

                            if (data.type === "status") {
                                assistantContent = data.status
                                set({ currentModel: data.model })
                                // Update assistant message in real-time
                                set((state) => {
                                    const lastMessage = state.messages[state.messages.length - 1]
                                    if (lastMessage?.role === "ASSISTANT") {
                                        return {
                                            messages: [
                                                ...state.messages.slice(0, -1),
                                                { ...lastMessage, content: assistantContent, model: data.model },
                                            ],
                                        }
                                    }
                                    return {
                                        messages: [
                                            ...state.messages,
                                            {
                                                id: crypto.randomUUID(),
                                                role: "ASSISTANT",
                                                content: assistantContent,
                                                createdAt: new Date(),
                                                model: data.model,
                                            },
                                        ],
                                    }
                                })
                            } else if (data.type === "complete") {
                                assistantContent = data.success
                                    ? "✅ App generated successfully! Check the preview."
                                    : `❌ Generation failed: ${data.error}`
                            }
                        } catch {
                            // Ignore JSON parse errors
                        }
                    }
                }
            }

            // Final assistant message
            set((state) => {
                const lastMessage = state.messages[state.messages.length - 1]
                if (lastMessage?.role === "ASSISTANT") {
                    return {
                        messages: [
                            ...state.messages.slice(0, -1),
                            { ...lastMessage, content: assistantContent },
                        ],
                    }
                }
                return state
            })
        } catch (error) {
            console.error("Failed to send message:", error)
            set((state) => ({
                messages: [
                    ...state.messages,
                    {
                        id: crypto.randomUUID(),
                        role: "ASSISTANT",
                        content: "❌ Something went wrong. Please try again.",
                        createdAt: new Date(),
                    },
                ],
            }))
        } finally {
            set({ isGenerating: false, currentModel: null })
        }
    },

    enhancePrompt: async (prompt) => {
        try {
            const response = await fetch("/api/generate/enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            })
            const { enhanced } = await response.json()
            return enhanced || prompt
        } catch {
            return prompt
        }
    },

    loadMessages: async (projectId) => {
        try {
            const response = await fetch(`/api/projects/${projectId}/messages`)
            const messages = await response.json()
            set({ messages })
        } catch {
            set({ messages: [] })
        }
    },

    reset: () => set({ messages: [], isGenerating: false, currentModel: null }),
}))
