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
        <div className="grid lg:grid-cols-2 min-h-screen">
            {/* Left: Visual Side */}
            <div className="relative hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-primary/90 via-secondary/80 to-primary/90 text-primary-foreground">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10" />

                {/* Content */}
                <div className="relative z-10 space-y-8">
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
                            <div className="text-3xl font-bold">10k+</div>
                            <div className="text-sm opacity-75">Apps Built</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold">99%</div>
                            <div className="text-sm opacity-75">Success</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold">5min</div>
                            <div className="text-sm opacity-75">Avg Time</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Form Side */}
            <div className="flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Welcome Back
                        </h1>
                        <p className="text-muted-foreground">
                            Sign in to your account to continue
                        </p>
                    </div>

                    <Suspense fallback={<div className="text-center">Loading...</div>}>
                        <LoginForm />
                    </Suspense>

                    <p className="text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link
                            href="/register"
                            className="text-primary hover:underline font-medium"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
