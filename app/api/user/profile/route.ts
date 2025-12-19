/**
 * User Profile API
 * Update logged-in user's profile information
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { name } = body

        // Update user in database
        const updatedUser = await (db as any).user.update({
            where: { email: session.user.email },
            data: { name },
            select: {
                id: true,
                name: true,
                email: true
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("[API] Profile update error:", error)
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const user = await (db as any).user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true
            }
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("[API] Profile fetch error:", error)
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        )
    }
}
