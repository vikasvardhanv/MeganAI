"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, Code2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-background via-accent/10 to-background">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

            {/* Gradient Orbs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />

            <div className="container relative px-4 py-24 mx-auto sm:px-6 lg:px-8 lg:py-32">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                    {/* Left: Content */}
                    <div className="space-y-8 animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">AI-Powered Development</span>
                        </div>

                        <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                            Build Apps Like
                            <span className="block mt-2 text-gradient-primary">
                                Magic Happens
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                            Generate production-grade web applications with AI that actually understands your vision.
                            No more generic templates. No more purple gradients. Just beautiful, unique apps.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/register">
                                <Button size="lg" className="group shadow-strong hover:shadow-dramatic transition-all duration-300">
                                    Start Building Free
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button size="lg" variant="outline" className="shadow-medium hover:shadow-strong transition-all duration-300">
                                    View Demo
                                    <Code2 className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
                            <div>
                                <div className="text-3xl font-bold text-foreground">10k+</div>
                                <div className="text-sm text-muted-foreground">Apps Generated</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-foreground">99%</div>
                                <div className="text-sm text-muted-foreground">Success Rate</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-foreground">5min</div>
                                <div className="text-sm text-muted-foreground">Avg. Build Time</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Visual */}
                    <div className="relative animate-fade-in animation-delay-200">
                        <div className="relative z-10 rounded-2xl bg-card border border-border shadow-dramatic overflow-hidden">
                            {/* Mock Code Editor */}
                            <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-destructive" />
                                    <div className="w-3 h-3 rounded-full bg-accent" />
                                    <div className="w-3 h-3 rounded-full bg-secondary" />
                                </div>
                                <span className="text-sm text-muted-foreground ml-2">app.tsx</span>
                            </div>
                            <div className="p-6 bg-card">
                                <div className="space-y-3 font-mono text-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground">1</span>
                                        <span className="text-secondary">import</span>
                                        <span className="text-foreground">{"{ useState }"}</span>
                                        <span className="text-secondary">from</span>
                                        <span className="text-primary">'react'</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground">2</span>
                                        <span className="text-foreground">{"  "}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground">3</span>
                                        <span className="text-secondary">export</span>
                                        <span className="text-secondary">function</span>
                                        <span className="text-accent-foreground">App()</span>
                                        <span className="text-foreground">{"{"}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground">4</span>
                                        <span className="text-foreground pl-4">{"return ("}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground">5</span>
                                        <span className="text-foreground pl-8">{"<div>"}</span>
                                        <Zap className="w-4 h-4 text-primary animate-pulse" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground">6</span>
                                        <span className="text-foreground pl-12 text-muted-foreground italic">✨ AI generating...</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-strong animate-bounce">
                            <div className="text-xs font-medium">Next.js 14</div>
                        </div>
                        <div className="absolute -bottom-4 -left-4 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg shadow-strong animate-bounce animation-delay-1000">
                            <div className="text-xs font-medium">TypeScript</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
