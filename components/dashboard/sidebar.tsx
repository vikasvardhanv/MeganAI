"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Command, LayoutDashboard, Settings, Braces } from "lucide-react"

import { cn } from "@/lib/utils"

export function Sidebar() {
    const pathname = usePathname()

    return (
        <nav className="grid items-start gap-2">
            <div className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2">
                <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                    <Link
                        href="/dashboard"
                        className={cn(
                            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                            pathname === "/dashboard" ? "bg-accent" : "transparent"
                        )}
                    >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Overview</span>
                    </Link>
                    <Link
                        href="/projects"
                        className={cn(
                            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                            pathname?.startsWith("/projects") ? "bg-accent" : "transparent"
                        )}
                    >
                        <Braces className="mr-2 h-4 w-4" />
                        <span>Projects</span>
                    </Link>
                    <Link
                        href="/settings"
                        className={cn(
                            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                            pathname === "/settings" ? "bg-accent" : "transparent"
                        )}
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                </nav>
            </div>
        </nav>
    )
}
