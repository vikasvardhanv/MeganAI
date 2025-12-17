"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FolderOpen, Settings, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-primary"
    },
    {
        label: "Projects",
        icon: FolderOpen,
        href: "/projects",
        color: "text-secondary"
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/settings",
        color: "text-muted-foreground"
    },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="space-y-4 py-4 flex flex-col h-full">
            <div className="px-3 py-2 flex-1">
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-muted rounded-lg transition",
                                pathname === route.href
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Credits Section */}
            <div className="px-3 py-2">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Credits</p>
                            <p className="text-lg font-bold">100</p>
                        </div>
                    </div>
                    <Link href="/pricing">
                        <button className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition">
                            Upgrade
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
