/**
 * Tasks API
 * CRUD operations for tasks in workflows
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/tasks - List tasks for a workflow
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const workflowId = searchParams.get("workflowId")

        if (!workflowId) {
            return NextResponse.json({ error: "workflowId required" }, { status: 400 })
        }

        const tasks = await db.task.findMany({
            where: { workflowId },
            include: {
                assignee: {
                    select: { id: true, name: true, image: true }
                },
                createdBy: {
                    select: { id: true, name: true }
                },
                steps: {
                    orderBy: { order: "asc" }
                },
                workflow: {
                    select: { template: true }
                }
            },
            orderBy: [
                { status: "asc" },
                { position: "asc" }
            ]
        })

        // Add computed fields
        const tasksWithComputed = tasks.map(task => ({
            ...task,
            workflowTemplate: task.workflow?.template,
            stepsCount: task.steps.length,
            stepsCompleted: task.steps.filter(s => s.status === "COMPLETE").length
        }))

        return NextResponse.json({ tasks: tasksWithComputed })

    } catch (error) {
        console.error("Tasks GET error:", error)
        return NextResponse.json(
            { error: "Failed to fetch tasks" },
            { status: 500 }
        )
    }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { workflowId, title, description, priority, assigneeId } = body

        if (!workflowId || !title) {
            return NextResponse.json(
                { error: "workflowId and title required" },
                { status: 400 }
            )
        }

        // Get workflow to access stages
        const workflow = await db.workflow.findUnique({
            where: { id: workflowId }
        })

        if (!workflow) {
            return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
        }

        // Get max position for ordering
        const maxPosition = await db.task.aggregate({
            where: { workflowId, status: "TODO" },
            _max: { position: true }
        })

        // Create task with steps based on workflow stages
        const stages = workflow.stages as string[]

        const task = await db.task.create({
            data: {
                title,
                description,
                priority: priority || "MEDIUM",
                position: (maxPosition._max.position || 0) + 1,
                currentStage: stages[0],
                workflowId,
                createdById: session.user.id,
                assigneeId,
                steps: {
                    create: stages.map((stage, i) => ({
                        name: stage,
                        order: i,
                        status: "PENDING"
                    }))
                }
            },
            include: {
                steps: true,
                assignee: {
                    select: { id: true, name: true, image: true }
                },
                createdBy: {
                    select: { id: true, name: true }
                }
            }
        })

        return NextResponse.json({ task })

    } catch (error) {
        console.error("Tasks POST error:", error)
        return NextResponse.json(
            { error: "Failed to create task" },
            { status: 500 }
        )
    }
}
