"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import settings component to prevent SSR issues with useSession
const SettingsContent = dynamic(() => import("./settings-content"), {
    ssr: false,
    loading: () => (
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading settings...</p>
            </div>
        </div>
    )
})

export default function SettingsPage() {
    return <SettingsContent />
}
