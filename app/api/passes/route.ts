/**
 * Passes API
 * CRUD for user passes and credit management
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/passes - Get user's active passes
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const passes: any[] = await (db as any).pass.findMany({
            where: {
                userId: session.user.id,
                validUntil: { gte: new Date() }
            },
            orderBy: { validUntil: "asc" }
        })

        // Calculate remaining credits
        const totalCredits = passes.reduce((sum: number, p: any) => sum + p.credits, 0)
        const usedCredits = passes.reduce((sum: number, p: any) => sum + p.usedCredits, 0)
        const remainingCredits = totalCredits - usedCredits

        return NextResponse.json({
            passes,
            summary: {
                totalCredits,
                usedCredits,
                remainingCredits,
                activePasses: passes.length
            }
        })

    } catch (error) {
        console.error("Passes GET error:", error)
        return NextResponse.json(
            { error: "Failed to fetch passes" },
            { status: 500 }
        )
    }
}

// POST /api/passes - Purchase a new pass
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { type } = body

        if (!type) {
            return NextResponse.json(
                { error: "type is required" },
                { status: 400 }
            )
        }

        // Pass configurations
        const passConfig: Record<string, { name: string; credits: number; price: number; durationDays: number }> = {
            DAILY: { name: "Day Pass", credits: 100, price: 2.99, durationDays: 1 },
            WEEKLY: { name: "Week Pass", credits: 500, price: 9.99, durationDays: 7 },
            MONTHLY: { name: "Month Pass", credits: 2500, price: 29.99, durationDays: 30 },
            ANNUAL: { name: "Annual Pass", credits: 36000, price: 249.99, durationDays: 365 },
            TEAM: { name: "Team Pass", credits: 10000, price: 99.99, durationDays: 30 }
        }

        const config = passConfig[type]
        if (!config) {
            return NextResponse.json(
                { error: "Invalid pass type" },
                { status: 400 }
            )
        }

        // Calculate validity
        const validFrom = new Date()
        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + config.durationDays)

        // In production, this would integrate with Stripe
        // For now, we create the pass directly
        const pass = await (db as any).pass.create({
            data: {
                type: type as any,
                name: config.name,
                credits: config.credits,
                price: config.price,
                validFrom,
                validUntil,
                userId: session.user.id
            }
        })

        return NextResponse.json({ pass })

    } catch (error) {
        console.error("Passes POST error:", error)
        return NextResponse.json(
            { error: "Failed to purchase pass" },
            { status: 500 }
        )
    }
}

// PATCH /api/passes - Use credits from pass
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { credits } = body

        if (!credits || credits <= 0) {
            return NextResponse.json(
                { error: "credits must be a positive number" },
                { status: 400 }
            )
        }

        // Get active passes sorted by expiration (use expiring ones first)
        const passes: any[] = await (db as any).pass.findMany({
            where: {
                userId: session.user.id,
                validUntil: { gte: new Date() },
                isActive: true
            },
            orderBy: { validUntil: "asc" }
        })

        // Calculate available credits
        const availableCredits = passes.reduce((sum: number, p: any) => sum + (p.credits - p.usedCredits), 0)

        if (credits > availableCredits) {
            return NextResponse.json(
                { error: "Insufficient credits", availableCredits },
                { status: 402 }
            )
        }

        // Deduct credits from passes
        let remaining = credits
        for (const pass of passes) {
            const available = pass.credits - pass.usedCredits
            if (available > 0 && remaining > 0) {
                const deduct = Math.min(available, remaining)
                await (db as any).pass.update({
                    where: { id: pass.id },
                    data: { usedCredits: pass.usedCredits + deduct }
                })
                remaining -= deduct
            }
            if (remaining === 0) break
        }

        return NextResponse.json({
            success: true,
            creditsUsed: credits,
            remainingCredits: availableCredits - credits
        })

    } catch (error) {
        console.error("Passes PATCH error:", error)
        return NextResponse.json(
            { error: "Failed to use credits" },
            { status: 500 }
        )
    }
}
