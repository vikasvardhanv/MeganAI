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
        <div className="grid lg:grid-cols-2 min-h-screen">
            {/* Left: Visual Side */}
            <div className="relative hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-secondary/90 via-accent/80 to-secondary/90 text-secondary-foreground">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10" />

                {/* Content */}
                <div className="relative z-10 space-y-8">
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

            {/* Right: Form Side */}
            <div className="flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Create Your Account
                        </h1>
                        <p className="text-muted-foreground">
                            Start building amazing apps with AI
                        </p>
                    </div>

                    <RegisterForm />

                    <div className="space-y-4">
                        <p className="text-center text-xs text-muted-foreground">
                            By creating an account, you agree to our{" "}
                            <Link href="/terms" className="text-primary hover:underline">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                            </Link>
                        </p>

                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="text-primary hover:underline font-medium"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
