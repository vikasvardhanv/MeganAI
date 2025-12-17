import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"

interface MarketingLayoutProps {
    children: React.ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="container z-40 bg-background">
                <div className="flex h-20 items-center justify-between py-6">
                    <div className="flex gap-6 md:gap-10">
                        <Link href="/" className="flex items-center space-x-2">
                            <Logo />
                        </Link>
                        <nav className="flex gap-6">
                            <Link
                                href="/#features"
                                className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            >
                                Features
                            </Link>
                            <Link
                                href="/#pricing"
                                className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            >
                                Pricing
                            </Link>
                        </nav>
                    </div>
                    <nav>
                        <Link href="/login" passHref>
                            <Button variant="secondary" size="sm" className="px-4">
                                Login
                            </Button>
                        </Link>
                    </nav>
                </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="container">
                <div className="flex flex-col items-center justify-between gap-4 border-t py-10 md:h-24 md:flex-row md:py-0">
                    <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                        <Logo className="h-6 w-6" />
                        <p className="text-center text-sm leading-loose md:text-left">
                            Built by MeganAi. Hosted on Vercel.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
