import { Metadata } from "next"
import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"
import { Code2, Palette, Rocket } from "lucide-react"

export const metadata: Metadata = {
    title: "Sign Up - MeganAi",
    description: "Create your MeganAi account",
}

export default function RegisterPage() {
    return (
        <div className="w-full min-h-screen grid lg:grid-cols-2">
            {/* Left: Visual Side */}
            <div className="hidden h-full flex-col justify-between bg-zinc-900 p-10 text-white lg:flex relative overflow-hidden">
                {/* Backgrounds */}
                <div className="absolute inset-0 bg-gradient-to-br from-secondary via-accent to-secondary opacity-90" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

                {/* Header */}
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <Rocket className="mr-2 h-6 w-6" />
                    MeganAi Builder
                </div>

                {/* Content */}
                <div className="relative z-20 mt-auto">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold tracking-tight mb-4">
                                Start Building
                                <span className="block mt-2">Amazing Apps Today</span>
                            </h2>
                            <p className="text-lg opacity-90">
                                Join thousands of developers using AI to build faster
                            </p>
                        </div>

                        {/* Benefits */}
                        <div className="space-y-6 pt-8">
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                                    <Code2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Production Ready</h3>
                                    <p className="text-sm opacity-80">Full-stack Next.js + TypeScript apps</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                                    <Palette className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Unique Designs</h3>
                                    <p className="text-sm opacity-80">No generic templates, always custom</p>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial */}
                        <div className="pt-8 border-t border-white/20">
                            <p className="text-lg italic leading-relaxed opacity-90">
                                "This platform completely changed how I build prototypes. What used to take days now takes minutes."
                            </p>
                            <div className="flex items-center gap-4 mt-6">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                                    SC
                                </div>
                                <div>
                                    <div className="font-semibold">Sarah Chen</div>
                                    <div className="text-sm opacity-75">Senior Developer @ TechCo</div>
                                </div>
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
                            Create an account
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your email below to create your account
                        </p>
                    </div>

                    <RegisterForm />

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        By clicking continue, you agree to our{" "}
                        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                            Privacy Policy
                        </Link>
                        .
                    </p>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        <Link
                            href="/login"
                            className="hover:text-primary underline underline-offset-4"
                        >
                            Already have an account? Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
