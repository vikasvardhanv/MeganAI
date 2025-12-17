// types/project.ts

export interface Message {
    id: string
    role: "USER" | "ASSISTANT" | "SYSTEM"
    content: string
    createdAt: Date
    codeChanges?: Record<string, string>
    model?: string
}

export interface Project {
    id: string
    name: string
    description?: string
    slug: string
    status: "DRAFT" | "GENERATING" | "READY" | "DEPLOYED" | "ERROR"
    framework: "NEXTJS" | "REACT" | "VUE" | "SVELTE"
    database: "POSTGRESQL" | "MYSQL" | "SQLITE" | "ORACLE" | "NONE"
    prompt: string
    code?: Record<string, string>
    previewUrl?: string
    deployUrl?: string
    createdAt: Date
    updatedAt: Date
}

export interface ProjectWithMessages extends Project {
    messages: Message[]
}
