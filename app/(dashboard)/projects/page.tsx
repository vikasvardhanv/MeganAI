import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Plus, FolderOpen, Sparkles } from "lucide-react"

export default function ProjectsPage() {
    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground mt-2">
                        Manage your AI-generated applications
                    </p>
                </div>
                <Link href="/projects/new">
                    <Button size="lg" className="shadow-strong">
                        <Plus className="mr-2 h-5 w-5" />
                        New Project
                    </Button>
                </Link>
            </div>

            {/* Empty State */}
            <Card className="flex flex-col items-center justify-center p-16 border-dashed border-2 shadow-medium">
                <div className="flex flex-col items-center gap-6 text-center max-w-md">
                    {/* Icon */}
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <FolderOpen className="w-10 h-10 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold">
                            No Projects Yet
                        </h3>
                        <p className="text-muted-foreground">
                            Start building your first app with AI. Describe what you want, and we'll generate production-ready code in minutes.
                        </p>
                    </div>

                    {/* CTA */}
                    <Link href="/projects/new" className="mt-4">
                        <Button size="lg" className="shadow-strong">
                            <Sparkles className="mr-2 h-5 w-5" />
                            Create Your First Project
                        </Button>
                    </Link>

                    {/* Help Text */}
                    <p className="text-sm text-muted-foreground">
                        Free tier: 100 credits | Average project: ~20 credits
                    </p>
                </div>
            </Card>

            {/* Tips */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 shadow-medium">
                    <h3 className="font-semibold mb-2">💡 Tip: Be Specific</h3>
                    <p className="text-sm text-muted-foreground">
                        The more details you provide, the better the AI can understand your vision
                    </p>
                </Card>

                <Card className="p-6 shadow-medium">
                    <h3 className="font-semibold mb-2">⚡ Tip: Iterate</h3>
                    <p className="text-sm text-muted-foreground">
                        Chat with the AI to refine your app - add features, change designs, fix bugs
                    </p>
                </Card>

                <Card className="p-6 shadow-medium">
                    <h3 className="font-semibold mb-2">🚀 Tip: Deploy Fast</h3>
                    <p className="text-sm text-muted-foreground">
                        One-click deploy to Vercel or download the complete source code
                    </p>
                </Card>
            </div>
        </div>
    )
}
