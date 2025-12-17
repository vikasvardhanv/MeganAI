"use client"

import { useSession } from "next-auth/react"
import { ReactNode } from "react"

interface PermissionGuardProps {
    children: ReactNode
    requiredPlan?: "FREE" | "PRO" | "TEAM" | "ENTERPRISE"
    fallback?: ReactNode
}

const PLAN_LEVELS = {
    FREE: 0,
    PRO: 1,
    TEAM: 2,
    ENTERPRISE: 3,
}

export function PermissionGuard({
    children,
    requiredPlan = "FREE",
    fallback = null
}: PermissionGuardProps) {
    const { data: session } = useSession()

    if (!session?.user) {
        return null
    }

    const userPlan = session.user.plan || "FREE"
    const currentLevel = PLAN_LEVELS[userPlan as keyof typeof PLAN_LEVELS] || 0
    const requiredLevel = PLAN_LEVELS[requiredPlan]

    if (currentLevel < requiredLevel) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
