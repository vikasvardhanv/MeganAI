/**
 * Individual Task API
 * PATCH /api/tasks/[id] - Update a task
 * DELETE /api/tasks/[id] - Delete a task
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { status, priority, title, description, assigneeId, currentStage, branchName } = body

        // Build update data
        const updateData: Record<string, unknown> = {}
        if (status !== undefined) updateData.status = status
        if (priority !== undefined) updateData.priority = priority
        if (title !== undefined) updateData.title = title
        if (description !== undefined) updateData.description = description
        if (assigneeId !== undefined) updateData.assigneeId = assigneeId
        if (currentStage !== undefined) updateData.currentStage = currentStage
        if (branchName !== undefined) updateData.branchName = branchName

        // If status is changing to IN_PROGRESS, auto-assign if not assigned
        if (status === "IN_PROGRESS" && !assigneeId) {
            const task = await db.task.findUnique({ where: { id } })
            if (task && !task.assigneeId) {
                updateData.assigneeId = session.user.id
            }
        }

        const updatedTask = await db.task.update({
            where: { id },
            data: updateData,
            include: {
                assignee: { select: { id: true, name: true, image: true } },
                steps: { orderBy: { order: "asc" } }
            }
        })

        return NextResponse.json({ task: updatedTask })

    } catch (error) {
        console.error("Task PATCH error:", error)
        return NextResponse.json(
            { error: "Failed to update task" },
            { status: 500 }
        )
    }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await db.task.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Task DELETE error:", error)
        return NextResponse.json(
            { error: "Failed to delete task" },
            { status: 500 }
        )
    }
}
