"use client"

import Link from "next/link"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "forever",
        description: "Perfect for trying out MeganAi",
        features: [
            { name: "3 projects", included: true },
            { name: "Basic AI models", included: true },
            { name: "Community support", included: true },
            { name: "100 credits/month", included: true },
            { name: "Download code", included: false },
            { name: "Priority AI models", included: false },
            { name: "Custom branding", included: false },
        ],
        cta: "Get Started",
        href: "/register",
        highlighted: false
    },
    {
        name: "Pro",
        price: "$19",
        period: "per month",
        description: "For serious builders and freelancers",
        features: [
            { name: "Unlimited projects", included: true },
            { name: "All AI models", included: true },
            { name: "Priority support", included: true },
            { name: "Unlimited credits", included: true },
            { name: "Download code", included: true },
            { name: "Priority AI models", included: true },
            { name: "Remove MeganAi branding", included: true },
        ],
        cta: "Start Free Trial",
        href: "/register?plan=pro",
        highlighted: true
    },
    {
        name: "Team",
        price: "$49",
        period: "per month",
        description: "For teams and agencies",
        features: [
            { name: "Everything in Pro", included: true },
            { name: "5 team members", included: true },
            { name: "Shared workspace", included: true },
            { name: "Team analytics", included: true },
            { name: "Dedicated support", included: true },
            { name: "Custom AI training", included: true },
            { name: "SLA guarantee", included: true },
        ],
        cta: "Contact Sales",
        href: "/contact",
        highlighted: false
    }
]

export function PricingCards() {
    return (
        <section id="pricing" className="py-24 bg-background">
            <div className="container px-4 mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <div className="max-w-2xl mx-auto text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Start free. Scale when you're ready. Cancel anytime.
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl p-8 border ${plan.highlighted
                                ? 'border-primary shadow-dramatic bg-card'
                                : 'border-border shadow-medium bg-card hover:shadow-strong'
                                } transition-all duration-300 animate-fade-in`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Popular Badge */}
                            {plan.highlighted && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium shadow-strong">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            {/* Plan Header */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-muted-foreground text-sm">{plan.description}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground">{plan.period}</span>
                                </div>
                            </div>

                            {/* CTA */}
                            <Link href={plan.href} className="block mb-6">
                                <Button
                                    className="w-full"
                                    size="lg"
                                    variant={plan.highlighted ? "default" : "outline"}
                                >
                                    {plan.cta}
                                </Button>
                            </Link>

                            {/* Features */}
                            <div className="space-y-3 pt-6 border-t border-border">
                                {plan.features.map((feature) => (
                                    <div key={feature.name} className="flex items-center gap-3">
                                        {feature.included ? (
                                            <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                        ) : (
                                            <X className="w-5 h-5 text-muted-foreground/30 flex-shrink-0" />
                                        )}
                                        <span className={feature.included ? "text-foreground" : "text-muted-foreground/50"}>
                                            {feature.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Note */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-muted-foreground">
                        All plans include SSL, 99.9% uptime, and daily backups.{" "}
                        <Link href="/pricing" className="text-primary hover:underline">
                            Compare plans →
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    )
}
