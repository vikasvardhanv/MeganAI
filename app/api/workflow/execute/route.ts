/**
 * Workflow Execution API
 * Execute and manage marketing automation workflows
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { WorkflowNode, WorkflowEdge, NODE_CONFIGS } from "@/lib/workflow/types"

interface ExecutionContext {
    variables: Record<string, unknown>
    logs: string[]
    nodeResults: Map<string, unknown>
}

// POST /api/workflow/execute - Execute a workflow
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { nodes, edges, initialData } = body as {
            nodes: WorkflowNode[]
            edges: WorkflowEdge[]
            initialData?: Record<string, unknown>
        }

        if (!nodes || !Array.isArray(nodes)) {
            return NextResponse.json({ error: "Invalid workflow" }, { status: 400 })
        }

        // Build execution order using topological sort
        const executionOrder = topologicalSort(nodes, edges)

        // Execute workflow
        const context: ExecutionContext = {
            variables: initialData || {},
            logs: [],
            nodeResults: new Map()
        }

        for (const nodeId of executionOrder) {
            const node = nodes.find(n => n.id === nodeId)
            if (!node) continue

            try {
                const result = await executeNode(node, context)
                context.nodeResults.set(nodeId, result)
                context.logs.push(`✅ ${node.data.label} completed`)
            } catch (error) {
                context.logs.push(`❌ ${node.data.label} failed: ${error}`)
                return NextResponse.json({
                    success: false,
                    error: `Node ${node.data.label} failed`,
                    logs: context.logs
                }, { status: 500 })
            }
        }

        return NextResponse.json({
            success: true,
            logs: context.logs,
            result: Object.fromEntries(context.nodeResults)
        })

    } catch (error) {
        console.error("Workflow execution error:", error)
        return NextResponse.json(
            { error: "Failed to execute workflow" },
            { status: 500 }
        )
    }
}

// Topological sort for execution order
function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    const inDegree = new Map<string, number>()
    const adjacency = new Map<string, string[]>()

    // Initialize
    for (const node of nodes) {
        inDegree.set(node.id, 0)
        adjacency.set(node.id, [])
    }

    // Build graph
    for (const edge of edges) {
        const targets = adjacency.get(edge.source) || []
        targets.push(edge.target)
        adjacency.set(edge.source, targets)
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    }

    // Find starting nodes (no dependencies)
    const queue: string[] = []
    for (const [nodeId, degree] of inDegree) {
        if (degree === 0) queue.push(nodeId)
    }

    // Process
    const result: string[] = []
    while (queue.length > 0) {
        const nodeId = queue.shift()!
        result.push(nodeId)

        for (const target of adjacency.get(nodeId) || []) {
            const newDegree = (inDegree.get(target) || 1) - 1
            inDegree.set(target, newDegree)
            if (newDegree === 0) queue.push(target)
        }
    }

    return result
}

// Execute individual node
async function executeNode(node: WorkflowNode, context: ExecutionContext): Promise<unknown> {
    const config = node.data.config

    switch (node.type) {
        case "trigger":
            context.logs.push(`⚡ Trigger: ${config.triggerType || 'manual'}`)
            return { triggered: true, timestamp: new Date().toISOString() }

        case "email":
            context.logs.push(`✉️ Sending email to: ${config.to}`)
            // In production, integrate with email service
            await simulateDelay(500)
            return { sent: true, to: config.to, subject: config.subject }

        case "sms":
            context.logs.push(`📱 Sending SMS to: ${config.to}`)
            await simulateDelay(300)
            return { sent: true, to: config.to }

        case "social":
            context.logs.push(`📢 Posting to ${config.platform}`)
            await simulateDelay(400)
            return { posted: true, platform: config.platform }

        case "delay":
            const delayMs = parseDelay(config.duration as number, config.unit as string)
            context.logs.push(`⏰ Waiting ${config.duration} ${config.unit}`)
            // In production, use job queue for long delays
            await simulateDelay(Math.min(delayMs, 2000))
            return { waited: true, duration: config.duration, unit: config.unit }

        case "condition":
            const value = context.variables[config.field as string]
            const result = evaluateCondition(value, config.operator as string, config.value)
            context.logs.push(`🔀 Condition: ${config.field} ${config.operator} ${config.value} = ${result}`)
            return { result, branch: result ? "true" : "false" }

        case "crm":
            context.logs.push(`👤 CRM ${config.action}: ${config.entity}`)
            await simulateDelay(400)
            return { updated: true, action: config.action, entity: config.entity }

        case "webhook":
            context.logs.push(`🌐 Webhook: ${config.method} ${config.url}`)
            // In production, make actual HTTP request
            await simulateDelay(600)
            return { called: true, url: config.url, status: 200 }

        case "transform":
            context.logs.push(`🔧 Transform: ${config.expression}`)
            return { transformed: true }

        default:
            return { executed: true }
    }
}

function simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function parseDelay(duration: number, unit: string): number {
    const multipliers: Record<string, number> = {
        seconds: 1000,
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000
    }
    return duration * (multipliers[unit] || 1000)
}

function evaluateCondition(value: unknown, operator: string, expected: unknown): boolean {
    switch (operator) {
        case "equals": return value === expected
        case "not_equals": return value !== expected
        case "contains": return String(value).includes(String(expected))
        case "greater_than": return Number(value) > Number(expected)
        case "less_than": return Number(value) < Number(expected)
        default: return false
    }
}
