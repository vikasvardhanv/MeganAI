"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge" // Assuming we have Badge
import { User, Key, Palette, Save } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("profile")
    const [isLoading, setIsLoading] = useState(false)

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "api-keys", label: "API Keys", icon: Key },
        { id: "appearance", label: "Appearance", icon: Palette },
    ]

    const handleSave = () => {
        setIsLoading(true)
        setTimeout(() => setIsLoading(false), 1000)
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl mx-auto">
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-64 space-y-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center w-full gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                                    activeTab === tab.id
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </aside>

                {/* Content Area */}
                <div className="flex-1 space-y-6">
                    {activeTab === "profile" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>Update your profile details and public info.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input defaultValue="Vikash Vardhan" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input defaultValue="vikash@example.com" disabled />
                                    <p className="text-xs text-muted-foreground">Contact support to change email.</p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSave} disabled={isLoading}>
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {activeTab === "api-keys" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>LLM Provider Keys</CardTitle>
                                    <CardDescription>Manage keys for AI providers (OpenAI, Anthropic, Gemini).</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">OpenAI API Key</label>
                                        <div className="flex gap-2">
                                            <Input type="password" value="sk-........................" readOnly />
                                            <Button variant="outline" size="icon">
                                                <Key className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Anthropic API Key</label>
                                        <div className="flex gap-2">
                                            <Input type="password" placeholder="sk-ant-..." />
                                            <Button variant="outline">Save</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "appearance" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Theme Preferences</CardTitle>
                                <CardDescription>Customize how MeganAi looks for you.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2 cursor-pointer">
                                        <div className="h-24 rounded-lg bg-white border-2 border-muted hover:border-primary shadow-sm"></div>
                                        <p className="text-center text-sm font-medium">Light</p>
                                    </div>
                                    <div className="space-y-2 cursor-pointer">
                                        <div className="h-24 rounded-lg bg-slate-950 border-2 border-muted hover:border-primary shadow-sm"></div>
                                        <p className="text-center text-sm font-medium">Dark</p>
                                    </div>
                                    <div className="space-y-2 cursor-pointer">
                                        <div className="h-24 rounded-lg bg-gradient-to-br from-white to-slate-900 border-2 border-primary shadow-md"></div>
                                        <p className="text-center text-sm font-medium">System</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSave} className="w-full sm:w-auto">
                                    Update Theme
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
