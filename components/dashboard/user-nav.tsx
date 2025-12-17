"use client"

import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

export function UserNav() {
    return (
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" onClick={() => signOut()}>
            <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                <span className="text-xs font-bold">U</span>
            </div>
        </Button>
    )
}
