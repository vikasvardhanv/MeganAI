import { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { Sparkles, Zap, Shield } from "lucide-react"
import { Suspense } from "react"

export const metadata: Metadata = {
    title: "Sign In - MeganAi",
    description: "Sign in to your Megan Ai account",
}

export default function LoginPage() {
    return (
        <div className="w-full min-h-screen grid lg:grid-cols-2">
            {/* Left: Visual Side */}
            <div className="hidden h-full flex-col justify-between bg-zinc-900 p-10 text-white lg:flex relative overflow-hidden">
                {/* Backgrounds */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-primary opacity-90" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

                {/* Header */}
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <Sparkles className="mr-2 h-6 w-6" />
                    MeganAi
                </div>

                {/* Content */}
                <div className="relative z-20 mt-auto">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold tracking-tight mb-4">
                                Welcome Back to
                                <span className="block mt-2">MeganAi</span>
                            </h2>
                            <p className="text-lg opacity-90">
                                Continue building amazing applications with AI
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="space-y-6 pt-8">
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Multi-Model AI</h3>
                                    <p className="text-sm opacity-80">Routes tasks to the best AI model</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Lightning Fast</h3>
                                    <p className="text-sm opacity-80">Generate production apps in minutes</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/20">
                            <div>
                                <div className="text-2xl font-bold">10k+</div>
                                <div className="text-xs opacity-75 uppercase tracking-wider">Apps Built</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">99%</div>
                                <div className="text-xs opacity-75 uppercase tracking-wider">Success Rate</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">5m</div>
                                <div className="text-xs opacity-75 uppercase tracking-wider">Avg Build Time</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Form Side */}
            <div className="flex items-center justify-center p-8 lg:p-12 h-full bg-background">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Welcome Back
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your email to sign in to your account
                        </p>
                    </div>

                    <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
                        <LoginForm />
                    </Suspense>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        <Link
                            href="/register"
                            className="hover:text-primary underline underline-offset-4"
                        >
                            Don&apos;t have an account? Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
