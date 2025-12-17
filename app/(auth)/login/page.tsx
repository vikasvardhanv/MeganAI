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
        <div className="container relative flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 min-h-screen">
            {/* Left: Visual Side */}
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-secondary/80 to-primary/90" />
                <div className="absolute inset-0 bg-grid-pattern opacity-10" />

                {/* Content */}
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <Sparkles className="mr-2 h-6 w-6" />
                    MeganAi
                </div>

                <div className="relative z-20 mt-auto">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold mb-4">
                                Welcome Back to
                                <span className="block mt-2">MeganAi</span>
                            </h2>
                            <p className="text-lg opacity-90">
                                Continue building amazing applications with AI
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-4 pt-8">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Multi-Model AI</h3>
                                    <p className="text-sm opacity-75">
                                        Routes to the best AI for each task
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Lightning Fast</h3>
                                    <p className="text-sm opacity-75">
                                        Generate apps in just minutes
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Secure by Default</h3>
                                    <p className="text-sm opacity-75">
                                        Production-ready security built-in
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                            <div>
                                <div className="text-2xl font-bold">10k+</div>
                                <div className="text-xs opacity-75">Apps Built</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">99%</div>
                                <div className="text-xs opacity-75">Success</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">5min</div>
                                <div className="text-xs opacity-75">Avg Time</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Form Side */}
            <div className="lg:p-8 relative h-full flex flex-col justify-center">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Welcome Back
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your email to sign in to your account
                        </p>
                    </div>

                    <Suspense fallback={<div className="text-center">Loading...</div>}>
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
