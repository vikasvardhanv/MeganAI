/**
 * Usage Analytics Dashboard
 * Track tokens, costs, model performance, and trends
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
    Zap, DollarSign, Clock, TrendingUp, TrendingDown,
    BarChart3, PieChart, Activity, Calendar, Bot
} from "lucide-react"

interface UsageStatsProps {
    userId?: string
    projectId?: string
}

interface UsageSummary {
    totalTokens: number
    totalCost: number
    avgLatency: number
    requestCount: number
    successRate: number
    byModel: Record<string, { tokens: number; cost: number; requests: number }>
    byTask: Record<string, { tokens: number; cost: number; requests: number }>
    dailyTrend: { date: string; tokens: number; cost: number }[]
}

export function UsageAnalyticsDashboard({ userId, projectId }: UsageStatsProps) {
    const [summary, setSummary] = useState<UsageSummary | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")

    useEffect(() => {
        const fetchUsage = async () => {
            setIsLoading(true)
            try {
                const params = new URLSearchParams({ range: timeRange })
                if (userId) params.set("userId", userId)
                if (projectId) params.set("projectId", projectId)

                const response = await fetch(`/api/analytics?${params}`)
                if (response.ok) {
                    const data = await response.json()
                    setSummary(data.summary)
                }
            } catch (error) {
                console.error("Failed to fetch usage:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUsage()
    }, [userId, projectId, timeRange])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        )
    }

    // Use mock data if no summary
    const data = summary || {
        totalTokens: 1234567,
        totalCost: 12.34,
        avgLatency: 2345,
        requestCount: 456,
        successRate: 98.5,
        byModel: {
            "claude-sonnet-4": { tokens: 500000, cost: 5.00, requests: 200 },
            "gpt-4o": { tokens: 400000, cost: 4.00, requests: 150 },
            "gemini-2.0-flash": { tokens: 334567, cost: 3.34, requests: 106 }
        },
        byTask: {
            "content-writing": { tokens: 400000, cost: 4.00, requests: 100 },
            "seo-optimization": { tokens: 300000, cost: 3.00, requests: 150 },
            "quality-review": { tokens: 234567, cost: 2.34, requests: 106 },
            "auto-tagging": { tokens: 300000, cost: 3.00, requests: 100 }
        },
        dailyTrend: []
    }

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Usage Analytics</h2>
                <div className="flex gap-2">
                    {(["7d", "30d", "90d"] as const).map((range) => (
                        <Button
                            key={range}
                            variant={timeRange === range ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTimeRange(range)}
                        >
                            {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            Total Tokens
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(data.totalTokens / 1000).toFixed(0)}K
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Input & Output combined
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            Total Cost
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${data.totalCost.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all models
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            Avg Latency
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(data.avgLatency / 1000).toFixed(1)}s
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Average response time
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4 text-purple-500" />
                            Success Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.successRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {data.requestCount} total requests
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Breakdown Tabs */}
            <Tabs defaultValue="models" className="w-full">
                <TabsList>
                    <TabsTrigger value="models">By Model</TabsTrigger>
                    <TabsTrigger value="tasks">By Task Type</TabsTrigger>
                </TabsList>

                <TabsContent value="models" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Model Usage Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(data.byModel).map(([model, stats]) => {
                                    const percentage = (stats.tokens / data.totalTokens) * 100
                                    return (
                                        <div key={model} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <Bot className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium text-sm">{model}</span>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {(stats.tokens / 1000).toFixed(0)}K tokens • ${stats.cost.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tasks" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Task Type Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(data.byTask).map(([task, stats]) => {
                                    const percentage = (stats.tokens / data.totalTokens) * 100
                                    return (
                                        <div key={task} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-sm capitalize">
                                                    {task.replace(/-/g, " ")}
                                                </span>
                                                <div className="text-sm text-muted-foreground">
                                                    {stats.requests} requests • ${stats.cost.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
