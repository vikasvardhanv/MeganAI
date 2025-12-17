import Workspace from "@/components/workspace/workspace"

export default async function ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <div className="flex flex-col h-screen">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
                <span className="font-semibold">Project Workspace</span>
            </header>
            <main className="flex-1 overflow-hidden">
                <Workspace />
            </main>
        </div>
    )
}
