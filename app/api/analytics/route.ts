/**
 * Analytics API
 * Get usage statistics and summaries
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/analytics - Get usage summary
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const range = searchParams.get("range") || "30d"
        const projectId = searchParams.get("projectId")

        // Calculate date range
        const days = range === "7d" ? 7 : range === "90d" ? 90 : 30
        const since = new Date()
        since.setDate(since.getDate() - days)

        // Build where clause
        const where: any = {
            userId: session.user.id,
            createdAt: { gte: since }
        }
        if (projectId) {
            where.projectId = projectId
        }

        // Fetch usage logs (using type assertion since prisma client may not be generated)
        const logs: any[] = await (db as any).usageLog.findMany({
            where,
            orderBy: { createdAt: "asc" }
        })

        // Calculate aggregates
        const totalTokens = logs.reduce((sum: number, log: any) => sum + log.tokensIn + log.tokensOut, 0)
        const totalCost = logs.reduce((sum: number, log: any) => sum + log.cost, 0)
        const avgLatency = logs.length > 0
            ? logs.reduce((sum: number, log: any) => sum + log.durationMs, 0) / logs.length
            : 0
        const successCount = logs.length // Assuming all logged are successful
        const successRate = logs.length > 0 ? 100 : 0

        // Group by model
        const byModel: Record<string, { tokens: number; cost: number; requests: number }> = {}
        logs.forEach((log: any) => {
            if (!byModel[log.model]) {
                byModel[log.model] = { tokens: 0, cost: 0, requests: 0 }
            }
            byModel[log.model].tokens += log.tokensIn + log.tokensOut
            byModel[log.model].cost += log.cost
            byModel[log.model].requests += 1
        })

        // Group by task
        const byTask: Record<string, { tokens: number; cost: number; requests: number }> = {}
        logs.forEach((log: any) => {
            if (!byTask[log.taskType]) {
                byTask[log.taskType] = { tokens: 0, cost: 0, requests: 0 }
            }
            byTask[log.taskType].tokens += log.tokensIn + log.tokensOut
            byTask[log.taskType].cost += log.cost
            byTask[log.taskType].requests += 1
        })

        // Daily trend
        const dailyTrend: Record<string, { tokens: number; cost: number }> = {}
        logs.forEach((log: any) => {
            const date = log.createdAt.toISOString().split("T")[0]
            if (!dailyTrend[date]) {
                dailyTrend[date] = { tokens: 0, cost: 0 }
            }
            dailyTrend[date].tokens += log.tokensIn + log.tokensOut
            dailyTrend[date].cost += log.cost
        })

        return NextResponse.json({
            summary: {
                totalTokens,
                totalCost,
                avgLatency,
                requestCount: logs.length,
                successRate,
                byModel,
                byTask,
                dailyTrend: Object.entries(dailyTrend).map(([date, data]) => ({
                    date,
                    ...data
                }))
            }
        })

    } catch (error) {
        console.error("Analytics GET error:", error)
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        )
    }
}

// POST /api/analytics - Log usage
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { model, taskType, tokensIn, tokensOut, cost, durationMs, projectId, taskId, stepId, metadata } = body

        if (!model || !taskType) {
            return NextResponse.json(
                { error: "model and taskType required" },
                { status: 400 }
            )
        }

        const log = await (db as any).usageLog.create({
            data: {
                model,
                taskType,
                tokensIn: tokensIn || 0,
                tokensOut: tokensOut || 0,
                cost: cost || 0,
                durationMs: durationMs || 0,
                userId: session.user.id,
                projectId,
                taskId,
                stepId,
                metadata
            }
        })

        return NextResponse.json({ log })

    } catch (error) {
        console.error("Analytics POST error:", error)
        return NextResponse.json(
            { error: "Failed to log usage" },
            { status: 500 }
        )
    }
}
