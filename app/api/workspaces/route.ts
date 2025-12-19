/**
 * Workspaces API
 * CRUD operations for workspaces and team management
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/workspaces - List user's workspaces
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get workspaces where user is owner or member
        const workspaces = await (db as any).workspace.findMany({
            where: {
                OR: [
                    { ownerId: session.user.id },
                    { members: { some: { userId: session.user.id } } }
                ]
            },
            include: {
                members: { select: { id: true } },
                owner: { select: { id: true, name: true } }
            }
        })

        // Add computed fields and user's role
        const workspacesWithRole = workspaces.map((ws: any) => ({
            id: ws.id,
            name: ws.name,
            slug: ws.slug,
            description: ws.description,
            memberCount: ws.members.length + 1, // +1 for owner
            role: ws.ownerId === session.user.id ? "OWNER" : "MEMBER"
        }))

        return NextResponse.json({ workspaces: workspacesWithRole })

    } catch (error) {
        console.error("Workspaces GET error:", error)
        return NextResponse.json(
            { error: "Failed to fetch workspaces" },
            { status: 500 }
        )
    }
}

// POST /api/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name, description } = body

        if (!name) {
            return NextResponse.json(
                { error: "name is required" },
                { status: 400 }
            )
        }

        // Generate slug
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            + "-" + Date.now().toString(36)

        const workspace = await (db as any).workspace.create({
            data: {
                name,
                slug,
                description,
                ownerId: session.user.id
            }
        })

        return NextResponse.json({
            workspace: {
                ...workspace,
                memberCount: 1,
                role: "OWNER"
            }
        })

    } catch (error) {
        console.error("Workspaces POST error:", error)
        return NextResponse.json(
            { error: "Failed to create workspace" },
            { status: 500 }
        )
    }
}
