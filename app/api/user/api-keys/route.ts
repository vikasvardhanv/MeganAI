/**
 * User API Keys Management
 * Securely store and retrieve user's LLM provider API keys
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// In production, use proper encryption (e.g., AES-256-GCM)
// This is a simplified version
function encryptKey(key: string): string {
    // Base64 encode (in production, use proper encryption)
    return Buffer.from(key).toString('base64')
}

function decryptKey(encrypted: string): string {
    // Base64 decode
    return Buffer.from(encrypted, 'base64').toString('utf8')
}

function maskKey(key: string): string {
    if (key.length < 8) return "•".repeat(key.length)
    return key.slice(0, 4) + "•".repeat(key.length - 8) + key.slice(-4)
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { provider, key } = body

        if (!provider || !key) {
            return NextResponse.json(
                { error: "Provider and key are required" },
                { status: 400 }
            )
        }

        // Get user
        const user = await (db as any).user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // Store encrypted key in user settings
        // In production, use a dedicated secrets table with proper encryption
        const encryptedKey = encryptKey(key)

        // Update or create in settings JSON field
        const currentSettings = user.settings || {}
        const apiKeys = currentSettings.apiKeys || {}

        apiKeys[provider] = {
            value: encryptedKey,
            masked: maskKey(key),
            updatedAt: new Date().toISOString()
        }

        await (db as any).user.update({
            where: { id: user.id },
            data: {
                settings: {
                    ...currentSettings,
                    apiKeys
                }
            }
        })

        return NextResponse.json({
            success: true,
            provider,
            masked: maskKey(key)
        })
    } catch (error) {
        console.error("[API] Save key error:", error)
        return NextResponse.json(
            { error: "Failed to save API key" },
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
            select: { settings: true }
        })

        const apiKeys = user?.settings?.apiKeys || {}

        // Return only masked versions
        const maskedKeys: Record<string, { masked: string; updatedAt: string }> = {}
        for (const [provider, data] of Object.entries(apiKeys as Record<string, any>)) {
            maskedKeys[provider] = {
                masked: data.masked,
                updatedAt: data.updatedAt
            }
        }

        return NextResponse.json(maskedKeys)
    } catch (error) {
        console.error("[API] Fetch keys error:", error)
        return NextResponse.json(
            { error: "Failed to fetch API keys" },
            { status: 500 }
        )
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(req.url)
        const provider = searchParams.get("provider")

        if (!provider) {
            return NextResponse.json(
                { error: "Provider is required" },
                { status: 400 }
            )
        }

        const user = await (db as any).user.findUnique({
            where: { email: session.user.email },
            select: { id: true, settings: true }
        })

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        const currentSettings = user.settings || {}
        const apiKeys = currentSettings.apiKeys || {}

        delete apiKeys[provider]

        await (db as any).user.update({
            where: { id: user.id },
            data: {
                settings: {
                    ...currentSettings,
                    apiKeys
                }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[API] Delete key error:", error)
        return NextResponse.json(
            { error: "Failed to delete API key" },
            { status: 500 }
        )
    }
}
