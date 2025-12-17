import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function ProjectsPage() {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between space-y-2 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">
                        Manage your AI-generated applications.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/projects/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                        No projects added
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        You have not created any projects yet.
                    </p>
                    <Link href="/projects/new" className="mt-4">
                        <Button>Create Project</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
