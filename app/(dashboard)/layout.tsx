import { Sidebar } from "@/components/dashboard/sidebar"
import { UserNav } from "@/components/dashboard/user-nav"
import { Logo } from "@/components/shared/logo"

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col space-y-6">
            <header className="sticky top-0 z-40 border-b bg-background">
                <div className="container flex h-16 items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                        <Logo />
                    </div>
                    <UserNav />
                </div>
            </header>
            <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
                <aside className="hidden w-[200px] flex-col md:flex">
                    <Sidebar />
                </aside>
                <main className="flex w-full flex-1 flex-col overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
