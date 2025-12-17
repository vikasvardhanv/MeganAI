"use client"

import { cn } from "@/lib/utils"

interface DeviceFrameProps {
    device: "desktop" | "tablet" | "mobile"
    children: React.ReactNode
}

export function DeviceFrame({ device, children }: DeviceFrameProps) {
    const dimensions = {
        desktop: "w-full h-full",
        tablet: "w-[768px] h-[1024px]",
        mobile: "w-[375px] h-[667px]",
    }

    return (
        <div
            className={cn(
                "bg-white dark:bg-zinc-900 rounded-lg shadow-xl overflow-hidden border border-border",
                dimensions[device]
            )}
        >
            {device !== "desktop" && (
                <div className="h-8 bg-zinc-100 dark:bg-zinc-800 border-b border-border flex items-center justify-center">
                    <div className="w-16 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                </div>
            )}
            <div className="h-full overflow-auto">{children}</div>
        </div>
    )
}
