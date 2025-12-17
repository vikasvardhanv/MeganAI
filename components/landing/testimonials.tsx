"use client"

import { Quote } from "lucide-react"

const testimonials = [
    {
        quote: "MeganAi generated a production-ready dashboard in 5 minutes. The design was unique and the code was clean. Saved me weeks of work.",
        author: "Sarah Chen",
        role: "Freelance Developer",
        avatar: "SC"
    },
    {
        quote: "Finally, an AI tool that doesn't spit out generic purple gradients. The multi-model approach actually makes a difference in quality.",
        author: "Marcus Rodriguez",
        role: "Startup Founder",
        avatar: "MR"
    },
    {
        quote: "The fact that it routes to different AI models for different tasks is genius. Claude for architecture, GPT-4 for UI – it shows.",
        author: "Aisha Patel",
        role: "Senior Engineer @ Meta",
        avatar: "AP"
    }
]

export function Testimonials() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="container px-4 mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <div className="max-w-2xl mx-auto text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                        Loved by Developers
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Thousands of developers trust MeganAi for their projects
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={testimonial.author}
                            className="bg-card rounded-2xl p-8 border border-border shadow-medium hover:shadow-strong transition-all duration-300 animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Quote Icon */}
                            <Quote className="w-10 h-10 text-primary/20 mb-4" />

                            {/* Quote */}
                            <p className="text-foreground mb-6 leading-relaxed">
                                "{testimonial.quote}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-sm font-bold text-primary">
                                        {testimonial.avatar}
                                    </span>
                                </div>
                                <div>
                                    <div className="font-semibold">{testimonial.author}</div>
                                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
