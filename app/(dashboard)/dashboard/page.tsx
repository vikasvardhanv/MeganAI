import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, FolderOpen, Zap, TrendingUp } from "lucide-react"

export default function DashboardPage() {
    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground mt-2">
                        Welcome back! Here's your project overview.
                    </p>
                </div>
                <Link href="/projects/new">
                    <Button size="lg" className="shadow-strong">
                        <Plus className="mr-2 h-5 w-5" />
                        New Project
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border shadow-medium hover:shadow-strong transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Projects
                        </CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderOpen className="h-5 w-5 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            No projects yet
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-medium hover:shadow-strong transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Credits Remaining
                        </CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-secondary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">100</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Free tier
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-medium hover:shadow-strong transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Apps Generated
                        </CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-accent/40 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-accent-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Get started
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5 shadow-medium hover:shadow-strong transition-all duration-300">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Quick Start
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href="/projects/new">
                            <Button className="w-full" variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Create First App
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Getting Started Section */}
            <Card className="border-border shadow-medium">
                <CardHeader>
                    <CardTitle>Getting Started with MeganAi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-bold">1</span>
                            </div>
                            <h3 className="font-semibold">Describe Your App</h3>
                            <p className="text-sm text-muted-foreground">
                                Tell us what you want to build in plain English
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
                            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                                <span className="text-secondary font-bold">2</span>
                            </div>
                            <h3 className="font-semibold">AI Generates Code</h3>
                            <p className="text-sm text-muted-foreground">
                                Watch AI create production-ready code in real-time
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
                            <div className="w-8 h-8 rounded-lg bg-accent/40 flex items-center justify-center">
                                <span className="text-accent-foreground font-bold">3</span>
                            </div>
                            <h3 className="font-semibold">Deploy or Download</h3>
                            <p className="text-sm text-muted-foreground">
                                One-click deploy to Vercel or download the code
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
