/**
 * Workflow Editor Page
 * Voice-controlled marketing workflow builder
 */

"use client"

import { WorkflowCanvas } from "@/components/workflow/workflow-canvas"

export default function WorkflowEditorPage() {
    return (
        <div className="h-screen flex flex-col bg-slate-950">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🔧</span>
                        <h1 className="text-xl font-bold text-white">VoiceFlow Builder</h1>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        Marketing Automation
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-slate-400">
                        Say <span className="text-violet-400">"Add email node"</span> or <span className="text-violet-400">"Connect trigger to delay"</span>
                    </p>
                </div>
            </header>

            {/* Canvas */}
            <main className="flex-1 overflow-hidden">
                <WorkflowCanvas
                    onSave={(nodes, edges) => {
                        console.log("Saving workflow:", { nodes, edges })
                        // TODO: Save to API
                    }}
                />
            </main>
        </div>
    )
}
