/**
 * Usage Tracker
 * Tracks API usage, tokens, costs, and performance metrics across all operations
 */

import { MODEL_REGISTRY } from "../ai/model-registry"

// ============ Types ============

export interface UsageRecord {
    id: string
    timestamp: Date

    // Model info
    model: string
    provider: string
    task: string

    // Token usage
    tokensIn: number
    tokensOut: number
    totalTokens: number

    // Cost (in cents)
    cost: number

    // Performance
    durationMs: number

    // Context
    userId?: string
    projectId?: string
    sessionId?: string

    // Additional metadata
    metadata?: Record<string, any>
}

export interface UsageSummary {
    // Totals
    totalRecords: number
    totalTokens: number
    totalCost: number  // in cents
    totalDuration: number  // ms

    // Averages
    avgTokensPerRequest: number
    avgCostPerRequest: number
    avgLatency: number

    // Breakdowns
    byModel: Record<string, ModelUsage>
    byTask: Record<string, TaskUsage>
    byDay: Record<string, DayUsage>

    // Time range
    periodStart?: Date
    periodEnd?: Date
}

export interface ModelUsage {
    model: string
    provider: string
    requests: number
    tokens: number
    cost: number
    avgLatency: number
    successRate: number
}

export interface TaskUsage {
    task: string
    requests: number
    tokens: number
    cost: number
    avgLatency: number
    topModels: string[]
}

export interface DayUsage {
    date: string
    requests: number
    tokens: number
    cost: number
}

export interface UsageTrackerConfig {
    // Callback when a record is added
    onRecord?: (record: UsageRecord) => Promise<void>

    // Max records to keep in memory
    maxRecords?: number

    // Auto-persist interval (ms)
    persistInterval?: number

    // Persist callback
    onPersist?: (records: UsageRecord[]) => Promise<void>
}

// ============ Usage Tracker ============

export class UsageTracker {
    private records: UsageRecord[] = []
    private config: UsageTrackerConfig
    private persistTimer?: NodeJS.Timeout

    constructor(config: UsageTrackerConfig = {}) {
        this.config = {
            maxRecords: config.maxRecords || 10000,
            ...config
        }

        // Setup auto-persist if configured
        if (config.persistInterval && config.onPersist) {
            this.persistTimer = setInterval(() => {
                this.persist()
            }, config.persistInterval)
        }
    }

    /**
     * Track a new usage record
     */
    async track(data: {
        model: string
        task: string
        tokensIn: number
        tokensOut: number
        durationMs: number
        userId?: string
        projectId?: string
        sessionId?: string
        metadata?: Record<string, any>
    }): Promise<UsageRecord> {
        const modelConfig = MODEL_REGISTRY[data.model]
        const totalTokens = data.tokensIn + data.tokensOut

        // Calculate cost
        const cost = modelConfig
            ? (totalTokens / 1000) * modelConfig.costPer1kTokens * 100  // Convert to cents
            : 0

        const record: UsageRecord = {
            id: this.generateId(),
            timestamp: new Date(),
            model: data.model,
            provider: modelConfig?.provider || "unknown",
            task: data.task,
            tokensIn: data.tokensIn,
            tokensOut: data.tokensOut,
            totalTokens,
            cost,
            durationMs: data.durationMs,
            userId: data.userId,
            projectId: data.projectId,
            sessionId: data.sessionId,
            metadata: data.metadata
        }

        // Add to records
        this.records.push(record)

        // Trim if exceeds max
        if (this.records.length > this.config.maxRecords!) {
            this.records = this.records.slice(-this.config.maxRecords!)
        }

        // Callback
        if (this.config.onRecord) {
            await this.config.onRecord(record)
        }

        return record
    }

    /**
     * Get usage summary
     */
    getSummary(options?: {
        since?: Date
        until?: Date
        userId?: string
        projectId?: string
    }): UsageSummary {
        let filtered = [...this.records]

        // Apply filters
        if (options?.since) {
            filtered = filtered.filter(r => r.timestamp >= options.since!)
        }
        if (options?.until) {
            filtered = filtered.filter(r => r.timestamp <= options.until!)
        }
        if (options?.userId) {
            filtered = filtered.filter(r => r.userId === options.userId)
        }
        if (options?.projectId) {
            filtered = filtered.filter(r => r.projectId === options.projectId)
        }

        if (filtered.length === 0) {
            return this.getEmptySummary()
        }

        // Calculate totals
        let totalTokens = 0
        let totalCost = 0
        let totalDuration = 0

        const byModel: Record<string, ModelUsage> = {}
        const byTask: Record<string, TaskUsage> = {}
        const byDay: Record<string, DayUsage> = {}

        for (const record of filtered) {
            totalTokens += record.totalTokens
            totalCost += record.cost
            totalDuration += record.durationMs

            // By model
            if (!byModel[record.model]) {
                byModel[record.model] = {
                    model: record.model,
                    provider: record.provider,
                    requests: 0,
                    tokens: 0,
                    cost: 0,
                    avgLatency: 0,
                    successRate: 1
                }
            }
            byModel[record.model].requests++
            byModel[record.model].tokens += record.totalTokens
            byModel[record.model].cost += record.cost

            // By task
            if (!byTask[record.task]) {
                byTask[record.task] = {
                    task: record.task,
                    requests: 0,
                    tokens: 0,
                    cost: 0,
                    avgLatency: 0,
                    topModels: []
                }
            }
            byTask[record.task].requests++
            byTask[record.task].tokens += record.totalTokens
            byTask[record.task].cost += record.cost

            // By day
            const dayKey = record.timestamp.toISOString().split("T")[0]
            if (!byDay[dayKey]) {
                byDay[dayKey] = {
                    date: dayKey,
                    requests: 0,
                    tokens: 0,
                    cost: 0
                }
            }
            byDay[dayKey].requests++
            byDay[dayKey].tokens += record.totalTokens
            byDay[dayKey].cost += record.cost
        }

        // Calculate averages
        for (const model of Object.values(byModel)) {
            const modelRecords = filtered.filter(r => r.model === model.model)
            model.avgLatency = modelRecords.reduce((sum, r) => sum + r.durationMs, 0) / modelRecords.length
        }

        for (const task of Object.values(byTask)) {
            const taskRecords = filtered.filter(r => r.task === task.task)
            task.avgLatency = taskRecords.reduce((sum, r) => sum + r.durationMs, 0) / taskRecords.length

            // Find top models for this task
            const modelCounts: Record<string, number> = {}
            for (const r of taskRecords) {
                modelCounts[r.model] = (modelCounts[r.model] || 0) + 1
            }
            task.topModels = Object.entries(modelCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([model]) => model)
        }

        return {
            totalRecords: filtered.length,
            totalTokens,
            totalCost,
            totalDuration,
            avgTokensPerRequest: totalTokens / filtered.length,
            avgCostPerRequest: totalCost / filtered.length,
            avgLatency: totalDuration / filtered.length,
            byModel,
            byTask,
            byDay,
            periodStart: options?.since || filtered[0]?.timestamp,
            periodEnd: options?.until || filtered[filtered.length - 1]?.timestamp
        }
    }

    /**
     * Get recent records
     */
    getRecords(options?: {
        limit?: number
        offset?: number
        model?: string
        task?: string
        userId?: string
        since?: Date
    }): UsageRecord[] {
        let filtered = [...this.records]

        if (options?.model) {
            filtered = filtered.filter(r => r.model === options.model)
        }
        if (options?.task) {
            filtered = filtered.filter(r => r.task === options.task)
        }
        if (options?.userId) {
            filtered = filtered.filter(r => r.userId === options.userId)
        }
        if (options?.since) {
            filtered = filtered.filter(r => r.timestamp >= options.since!)
        }

        // Sort by most recent first
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        // Apply pagination
        const offset = options?.offset || 0
        const limit = options?.limit || 100

        return filtered.slice(offset, offset + limit)
    }

    /**
     * Estimate cost for a hypothetical request
     */
    estimateCost(model: string, tokensIn: number, tokensOut: number): number {
        const modelConfig = MODEL_REGISTRY[model]
        if (!modelConfig) return 0

        const totalTokens = tokensIn + tokensOut
        return (totalTokens / 1000) * modelConfig.costPer1kTokens * 100  // cents
    }

    /**
     * Get cost breakdown by model
     */
    getCostBreakdown(since?: Date): Record<string, { cost: number; percentage: number }> {
        const summary = this.getSummary({ since })
        const breakdown: Record<string, { cost: number; percentage: number }> = {}

        for (const [model, usage] of Object.entries(summary.byModel)) {
            breakdown[model] = {
                cost: usage.cost,
                percentage: summary.totalCost > 0
                    ? (usage.cost / summary.totalCost) * 100
                    : 0
            }
        }

        return breakdown
    }

    /**
     * Get performance metrics by model
     */
    getPerformanceMetrics(): Record<string, {
        avgLatency: number
        p50Latency: number
        p95Latency: number
        p99Latency: number
        requestsPerMinute: number
    }> {
        const metrics: Record<string, any> = {}
        const modelRecords: Record<string, UsageRecord[]> = {}

        // Group by model
        for (const record of this.records) {
            if (!modelRecords[record.model]) {
                modelRecords[record.model] = []
            }
            modelRecords[record.model].push(record)
        }

        // Calculate metrics for each model
        for (const [model, records] of Object.entries(modelRecords)) {
            const latencies = records.map(r => r.durationMs).sort((a, b) => a - b)
            const len = latencies.length

            // Calculate time span for RPM
            const timeSpanMs = records.length > 1
                ? records[records.length - 1].timestamp.getTime() - records[0].timestamp.getTime()
                : 60000

            metrics[model] = {
                avgLatency: latencies.reduce((sum, l) => sum + l, 0) / len,
                p50Latency: latencies[Math.floor(len * 0.5)] || 0,
                p95Latency: latencies[Math.floor(len * 0.95)] || 0,
                p99Latency: latencies[Math.floor(len * 0.99)] || 0,
                requestsPerMinute: (len / timeSpanMs) * 60000
            }
        }

        return metrics
    }

    /**
     * Get daily usage trend
     */
    getDailyTrend(days: number = 30): Array<{
        date: string
        requests: number
        tokens: number
        cost: number
    }> {
        const since = new Date()
        since.setDate(since.getDate() - days)

        const summary = this.getSummary({ since })

        return Object.values(summary.byDay).sort((a, b) =>
            a.date.localeCompare(b.date)
        )
    }

    /**
     * Export records
     */
    export(): UsageRecord[] {
        return [...this.records]
    }

    /**
     * Import records
     */
    import(records: UsageRecord[]): void {
        this.records.push(...records)

        // Trim if exceeds max
        if (this.records.length > this.config.maxRecords!) {
            this.records = this.records.slice(-this.config.maxRecords!)
        }
    }

    /**
     * Clear all records
     */
    clear(): void {
        this.records = []
    }

    /**
     * Persist records (if callback configured)
     */
    async persist(): Promise<void> {
        if (this.config.onPersist && this.records.length > 0) {
            await this.config.onPersist(this.records)
        }
    }

    /**
     * Cleanup (call when done)
     */
    dispose(): void {
        if (this.persistTimer) {
            clearInterval(this.persistTimer)
        }
    }

    private getEmptySummary(): UsageSummary {
        return {
            totalRecords: 0,
            totalTokens: 0,
            totalCost: 0,
            totalDuration: 0,
            avgTokensPerRequest: 0,
            avgCostPerRequest: 0,
            avgLatency: 0,
            byModel: {},
            byTask: {},
            byDay: {}
        }
    }

    private generateId(): string {
        return `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
}

// ============ Factory ============

/**
 * Create a usage tracker instance
 */
export function createUsageTracker(config?: UsageTrackerConfig): UsageTracker {
    return new UsageTracker(config)
}
