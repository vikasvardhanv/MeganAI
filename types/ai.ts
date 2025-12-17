// types/ai.ts

export interface ModelUsageLog {
    task: string
    model: string
    timestamp: Date
    tokensUsed?: number
    cost?: number
    latencyMs?: number
}

export interface ProjectConfig {
    name: string
    framework: "NEXTJS" | "REACT" | "VUE" | "SVELTE"
    database: "POSTGRESQL" | "MYSQL" | "SQLITE" | "ORACLE" | "NONE"
}

export interface Architecture {
    fileStructure: {
        directories: string[]
        files: string[]
    }
    components: {
        pages: string[]
        shared: string[]
        features: string[]
    }
    dataModels: DataModel[]
    apiEndpoints: ApiEndpoint[]
    stateManagement: Record<string, any>
    integrations: string[]
    envVars: string[]
}

export interface DataModel {
    name: string
    fields: {
        name: string
        type: string
        required: boolean
        relation?: string
    }[]
}

export interface ApiEndpoint {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
    path: string
    description: string
    requestBody?: Record<string, any>
    responseType?: Record<string, any>
}

export interface SharedContext {
    projectName: string
    prompt: string
    framework: string
    database: string
    architecture?: Architecture
    files: Record<string, string>
    dependencies: Record<string, string>
    apiContracts: Record<string, any>
}

export interface GenerationResult {
    success: boolean
    files: Record<string, string>
    dependencies?: Record<string, string>
    modelsUsed?: ModelUsageLog[]
    preview?: string
    error?: string
}
