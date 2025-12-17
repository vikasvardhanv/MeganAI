"use client"

import { ChatPanel } from "./chat-panel"
import { PreviewPanel } from "./preview-panel"

export default function Workspace() {
    return (
        <div className="grid h-[calc(100vh-4rem)] w-full grid-cols-1 md:grid-cols-[400px_1fr]">
            <ChatPanel />
            <PreviewPanel />
        </div>
    )
}
