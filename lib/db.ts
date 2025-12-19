/**
 * Database Client
 * Uses Prisma with graceful fallback when not configured
 */

// Use dynamic import to handle case where Prisma client isn't generated
let PrismaClient: any

try {
    PrismaClient = require("@prisma/client").PrismaClient
} catch {
    // Prisma not generated - create mock client
    PrismaClient = class MockPrismaClient {
        user = createMockModel("user")
        project = createMockModel("project")
        task = createMockModel("task")
        message = createMockModel("message")
        workflow = createMockModel("workflow")
        workspace = createMockModel("workspace")
        version = createMockModel("version")

        async $connect() { console.log("[DB] Mock: $connect") }
        async $disconnect() { console.log("[DB] Mock: $disconnect") }
    }
}

function createMockModel(name: string) {
    return {
        findMany: async () => {
            console.log(`[DB Mock] ${name}.findMany`)
            return []
        },
        findUnique: async () => {
            console.log(`[DB Mock] ${name}.findUnique`)
            return null
        },
        findFirst: async () => {
            console.log(`[DB Mock] ${name}.findFirst`)
            return null
        },
        create: async (data: any) => {
            console.log(`[DB Mock] ${name}.create`, data)
            return { id: "mock-id", ...data.data }
        },
        update: async (data: any) => {
            console.log(`[DB Mock] ${name}.update`, data)
            return { id: data.where.id, ...data.data }
        },
        delete: async () => {
            console.log(`[DB Mock] ${name}.delete`)
            return { id: "deleted" }
        },
        count: async () => {
            console.log(`[DB Mock] ${name}.count`)
            return 0
        }
    }
}

const globalForPrisma = globalThis as unknown as {
    prisma: any | undefined
}

function createPrismaClient() {
    try {
        // Try to use adapter if pg pool is available
        if (process.env.DATABASE_URL) {
            const { Pool } = require("pg")
            const { PrismaPg } = require("@prisma/adapter-pg")
            const pool = new Pool({ connectionString: process.env.DATABASE_URL })
            const adapter = new PrismaPg(pool)
            return new PrismaClient({ adapter })
        }
    } catch (e) {
        console.log("[DB] Using basic Prisma client (no adapter)")
    }

    return new PrismaClient()
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db
}
