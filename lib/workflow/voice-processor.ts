/**
 * Voice Command Processor
 * Interprets voice commands for workflow operations
 */

import { NodeType, VOICE_NODE_PATTERNS, NODE_CONFIGS } from "./types"

export interface VoiceCommand {
    type: "add_node" | "connect" | "delete" | "move" | "configure" | "run" | "save" | "undo" | "unknown"
    nodeType?: NodeType
    nodeId?: string
    targetId?: string
    config?: Record<string, unknown>
    rawText: string
    confidence: number
}

// Common voice command patterns
const COMMAND_PATTERNS = {
    add: /^(add|create|insert|place|put)\s+(a\s+)?(.+?)(\s+node)?$/i,
    connect: /^(connect|link|wire)\s+(.+?)\s+(to|with)\s+(.+)$/i,
    delete: /^(delete|remove|drop)\s+(the\s+)?(.+?)(\s+node)?$/i,
    move: /^move\s+(.+?)\s+(to|left|right|up|down)(.*)$/i,
    configure: /^(set|configure|change)\s+(.+?)\s+(to|as)\s+(.+)$/i,
    run: /^(run|execute|start|play)\s*(the\s+)?(workflow)?$/i,
    save: /^(save|store)\s*(the\s+)?(workflow)?$/i,
    undo: /^(undo|cancel|revert)(\s+last)?(\s+action)?$/i
}

export function processVoiceCommand(text: string): VoiceCommand {
    const normalizedText = text.toLowerCase().trim()

    // Check for ADD command
    const addMatch = normalizedText.match(COMMAND_PATTERNS.add)
    if (addMatch) {
        const nodeDescription = addMatch[3]
        const nodeType = findNodeType(nodeDescription)
        return {
            type: "add_node",
            nodeType,
            rawText: text,
            confidence: nodeType ? 0.9 : 0.5
        }
    }

    // Check for CONNECT command
    const connectMatch = normalizedText.match(COMMAND_PATTERNS.connect)
    if (connectMatch) {
        return {
            type: "connect",
            nodeId: connectMatch[2],
            targetId: connectMatch[4],
            rawText: text,
            confidence: 0.85
        }
    }

    // Check for DELETE command
    const deleteMatch = normalizedText.match(COMMAND_PATTERNS.delete)
    if (deleteMatch) {
        return {
            type: "delete",
            nodeId: deleteMatch[3],
            rawText: text,
            confidence: 0.9
        }
    }

    // Check for RUN command
    if (COMMAND_PATTERNS.run.test(normalizedText)) {
        return {
            type: "run",
            rawText: text,
            confidence: 0.95
        }
    }

    // Check for SAVE command
    if (COMMAND_PATTERNS.save.test(normalizedText)) {
        return {
            type: "save",
            rawText: text,
            confidence: 0.95
        }
    }

    // Check for UNDO command
    if (COMMAND_PATTERNS.undo.test(normalizedText)) {
        return {
            type: "undo",
            rawText: text,
            confidence: 0.95
        }
    }

    // Try to infer intent from keywords
    const inferredNodeType = findNodeType(normalizedText)
    if (inferredNodeType) {
        return {
            type: "add_node",
            nodeType: inferredNodeType,
            rawText: text,
            confidence: 0.6
        }
    }

    return {
        type: "unknown",
        rawText: text,
        confidence: 0
    }
}

function findNodeType(text: string): NodeType | undefined {
    const normalizedText = text.toLowerCase()

    // Check exact matches first
    for (const [pattern, nodeType] of Object.entries(VOICE_NODE_PATTERNS)) {
        if (normalizedText.includes(pattern)) {
            return nodeType
        }
    }

    // Check node type names
    for (const nodeType of Object.keys(NODE_CONFIGS) as NodeType[]) {
        if (normalizedText.includes(nodeType)) {
            return nodeType
        }
    }

    return undefined
}

// Generate confirmation response for voice feedback
export function generateCommandResponse(command: VoiceCommand): string {
    switch (command.type) {
        case "add_node":
            if (command.nodeType) {
                const config = NODE_CONFIGS[command.nodeType]
                return `Adding ${config.label} node to your workflow.`
            }
            return "I didn't understand which node type you want to add. Try saying 'add email node' or 'add delay'."

        case "connect":
            return `Connecting ${command.nodeId} to ${command.targetId}.`

        case "delete":
            return `Removing ${command.nodeId} from the workflow.`

        case "run":
            return "Starting workflow execution."

        case "save":
            return "Saving your workflow."

        case "undo":
            return "Undoing last action."

        default:
            return "I didn't understand that command. Try saying 'add email node', 'connect trigger to delay', or 'run workflow'."
    }
}
