import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await (db as any).user.findUnique({
            where: { email: email.toLowerCase() },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            )
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create the user
        const user = await (db as any).user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
            },
        })

        return NextResponse.json(
            { message: "User created successfully", userId: user.id },
            { status: 201 }
        )
    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
