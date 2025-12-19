/**
 * Workflows API
 * CRUD operations for workflow templates
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/workflows - List workflows for a workspace
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const workspaceId = searchParams.get("workspaceId")

        const workflows = await db.workflow.findMany({
            where: workspaceId ? { workspaceId } : undefined,
            include: {
                tasks: {
                    select: { id: true, status: true }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        // Add task counts
        const workflowsWithCounts = workflows.map(wf => ({
            ...wf,
            taskCount: wf.tasks.length,
            completedCount: wf.tasks.filter(t => t.status === "DONE").length,
            inProgressCount: wf.tasks.filter(t => t.status === "IN_PROGRESS").length
        }))

        return NextResponse.json({ workflows: workflowsWithCounts })

    } catch (error) {
        console.error("Workflows GET error:", error)
        return NextResponse.json(
            { error: "Failed to fetch workflows" },
            { status: 500 }
        )
    }
}

// POST /api/workflows - Create a new workflow
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { workspaceId, name, description, template, stages, autoStart, icon, color } = body

        if (!workspaceId || !name) {
            return NextResponse.json(
                { error: "workspaceId and name required" },
                { status: 400 }
            )
        }

        // Default stages based on template
        let workflowStages = stages
        if (!stages && template) {
            const templateStages = {
                NEW_FEATURE: ["Requirements", "Technical Spec", "Planning", "Implementation", "Review"],
                FIX_BUG: ["Investigate", "Diagnose", "Fix", "Test", "Review"],
                VIBE_CODE: ["Describe", "Generate", "Refine", "Deploy"],
                REFACTOR: ["Analyze", "Plan", "Refactor", "Test", "Review"],
                CUSTOM: ["Step 1", "Step 2", "Step 3"]
            }
            workflowStages = templateStages[template as keyof typeof templateStages] || templateStages.CUSTOM
        }

        const workflow = await db.workflow.create({
            data: {
                name,
                description,
                template: template || "CUSTOM",
                stages: workflowStages,
                autoStart: autoStart ?? true,
                icon,
                color,
                workspaceId
            }
        })

        return NextResponse.json({ workflow })

    } catch (error) {
        console.error("Workflows POST error:", error)
        return NextResponse.json(
            { error: "Failed to create workflow" },
            { status: 500 }
        )
    }
}
