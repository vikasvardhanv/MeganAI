/**
 * Workflow Node Types
 * Marketing automation node definitions
 */

export type NodeType =
    | "trigger"
    | "email"
    | "sms"
    | "social"
    | "delay"
    | "condition"
    | "crm"
    | "webhook"
    | "transform"

export interface Position {
    x: number
    y: number
}

export interface WorkflowNode {
    id: string
    type: NodeType
    position: Position
    data: {
        label: string
        config: Record<string, unknown>
        inputs?: string[]
        outputs?: string[]
    }
}

export interface WorkflowEdge {
    id: string
    source: string
    target: string
    sourceHandle?: string
    targetHandle?: string
}

export interface Workflow {
    id: string
    name: string
    description?: string
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
    createdAt: string
    updatedAt: string
}

// Node configurations
export const NODE_CONFIGS: Record<NodeType, {
    label: string
    icon: string
    color: string
    description: string
    defaultConfig: Record<string, unknown>
}> = {
    trigger: {
        label: "Trigger",
        icon: "⚡",
        color: "from-yellow-500 to-orange-500",
        description: "Start the workflow when an event occurs",
        defaultConfig: {
            triggerType: "manual",
            schedule: null
        }
    },
    email: {
        label: "Send Email",
        icon: "✉️",
        color: "from-blue-500 to-indigo-500",
        description: "Send an email to contacts",
        defaultConfig: {
            to: "",
            subject: "",
            body: "",
            template: null
        }
    },
    sms: {
        label: "Send SMS",
        icon: "📱",
        color: "from-green-500 to-teal-500",
        description: "Send an SMS message",
        defaultConfig: {
            to: "",
            message: ""
        }
    },
    social: {
        label: "Social Post",
        icon: "📢",
        color: "from-pink-500 to-rose-500",
        description: "Post to social media platforms",
        defaultConfig: {
            platform: "twitter",
            content: "",
            schedule: null
        }
    },
    delay: {
        label: "Wait/Delay",
        icon: "⏰",
        color: "from-purple-500 to-violet-500",
        description: "Wait for a specified time",
        defaultConfig: {
            duration: 1,
            unit: "days"
        }
    },
    condition: {
        label: "Condition",
        icon: "🔀",
        color: "from-amber-500 to-yellow-500",
        description: "Branch based on conditions",
        defaultConfig: {
            field: "",
            operator: "equals",
            value: ""
        }
    },
    crm: {
        label: "CRM Action",
        icon: "👤",
        color: "from-cyan-500 to-blue-500",
        description: "Update CRM records",
        defaultConfig: {
            action: "update",
            entity: "contact",
            data: {}
        }
    },
    webhook: {
        label: "Webhook",
        icon: "🌐",
        color: "from-gray-500 to-slate-500",
        description: "Send or receive webhooks",
        defaultConfig: {
            url: "",
            method: "POST",
            headers: {}
        }
    },
    transform: {
        label: "Transform Data",
        icon: "🔧",
        color: "from-emerald-500 to-green-500",
        description: "Transform and map data",
        defaultConfig: {
            expression: "",
            outputField: ""
        }
    }
}

// Voice command patterns for nodes
export const VOICE_NODE_PATTERNS: Record<string, NodeType> = {
    "send email": "email",
    "email": "email",
    "send sms": "sms",
    "text message": "sms",
    "sms": "sms",
    "social media": "social",
    "post to twitter": "social",
    "post to instagram": "social",
    "facebook post": "social",
    "wait": "delay",
    "delay": "delay",
    "pause": "delay",
    "condition": "condition",
    "if": "condition",
    "branch": "condition",
    "split": "condition",
    "crm": "crm",
    "contact": "crm",
    "lead": "crm",
    "webhook": "webhook",
    "api call": "webhook",
    "http request": "webhook",
    "transform": "transform",
    "map data": "transform",
    "convert": "transform",
    "trigger": "trigger",
    "start": "trigger",
    "when": "trigger"
}
