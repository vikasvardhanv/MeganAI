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
        <div className="container relative flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 min-h-screen">
            {/* Left: Visual Side */}
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/90 via-accent/80 to-secondary/90" />
                <div className="absolute inset-0 bg-grid-pattern opacity-10" />

                {/* Content */}
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <Rocket className="mr-2 h-6 w-6" />
                    MeganAi Builder
                </div>

                <div className="relative z-20 mt-auto">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold mb-4">
                                Start Building
                                <span className="block mt-2">Amazing Apps Today</span>
                            </h2>
                            <p className="text-lg opacity-90">
                                Join thousands of developers using AI to build faster
                            </p>
                        </div>

                        {/* Benefits */}
                        <div className="space-y-4 pt-8">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Code2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Production Ready Code</h3>
                                    <p className="text-sm opacity-75">
                                        Complete Next.js apps with TypeScript & Prisma
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Palette className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Unique Designs</h3>
                                    <p className="text-sm opacity-75">
                                        No generic templates - every app is custom
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Rocket className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">One-Click Deploy</h3>
                                    <p className="text-sm opacity-75">
                                        Deploy to Vercel instantly or download code
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial */}
                        <div className="pt-8 border-t border-white/20">
                            <p className="text-lg mb-4 italic">
                                "MeganAi saved me weeks of work. The quality is incredible."
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <span className="text-sm font-bold">SC</span>
                                </div>
                                <div>
                                    <div className="font-semibold">Sarah Chen</div>
                                    <div className="text-sm opacity-75">Freelance Developer</div>
                                </div>
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
