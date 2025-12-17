import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { PricingCards } from "@/components/landing/pricing-cards"
import { Testimonials } from "@/components/landing/testimonials"

export default function IndexPage() {
    return (
        <>
            <Hero />
            <Features />
            <Testimonials />
            <PricingCards />
        </>
    )
}
