"use client"

import { Sparkles, Zap, Shield, Code2, Palette, Rocket } from "lucide-react"

const features = [
    {
        icon: Sparkles,
        title: "Multi-Model AI",
        description: "Routes tasks to the best AI model. Claude for architecture, GPT-4 for UI, Gemini for speed.",
        color: "primary"
    },
    {
        icon: Palette,
        title: "Unique Designs",
        description: "No more purple gradients. Each app gets a bold, custom color palette and editorial layouts.",
        color: "secondary"
    },
    {
        icon: Code2,
        title: "Production Ready",
        description: "Complete Next.js apps with TypeScript, Prisma, authentication, and deployment configs.",
        color: "accent"
    },
    {
        icon: Zap,
        title: "Lightning Fast",
        description: "Generate full-stack apps in 5 minutes. Real-time streaming shows progress as it builds.",
        color: "primary"
    },
    {
        icon: Shield,
        title: "Secure by Default",
        description: "Built-in auth, input validation, API security, and encrypted user data. Production-grade from day one.",
        color: "secondary"
    },
    {
        icon: Rocket,
        title: "One-Click Deploy",
        description: "Push to GitHub and deploy to Vercel instantly. Or download the complete source code.",
        color: "accent"
    }
]

export function Features() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="container px-4 mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <div className="max-w-2xl mx-auto text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                        Everything You Need
                        <span className="block text-primary mt-2">Nothing You Don't</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Powered by the world's best AI models, customized for each specific task
                    </p>
                </div>

                {/* Features Grid - Magazine Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        const isLarge = index === 0 || index === 5

                        return (
                            <div
                                key={feature.title}
                                className={`group relative bg-card rounded-2xl p-8 border border-border shadow-medium hover:shadow-strong transition-all duration-300 ${isLarge ? 'md:col-span-2 lg:col-span-1' : ''
                                    } animate-fade-in`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className={`w-7 h-7 text-${feature.color}`} />
                                </div>

                                {/* Content */}
                                <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Hover Effect */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            </div>
                        )
                    })}
                </div>

                {/* Bottom CTA */}
                <div className="mt-16 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                        Trusted by developers at top companies
                    </p>
                    <div className="flex justify-center items-center gap-8 opacity-50">
                        <div className="text-sm font-medium">Google</div>
                        <div className="text-sm font-medium">Meta</div>
                        <div className="text-sm font-medium">Amazon</div>
                        <div className="text-sm font-medium">Stripe</div>
                    </div>
                </div>
            </div>
        </section>
    )
}
