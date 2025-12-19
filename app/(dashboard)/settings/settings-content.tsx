"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Key, Palette, Eye, EyeOff, Check, AlertCircle, Terminal, Copy, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApiKeyConfig {
    id: string
    name: string
    provider: string
    envVar: string
    placeholder: string
    docsUrl: string
}

const LLM_PROVIDERS: ApiKeyConfig[] = [
    {
        id: "openai",
        name: "OpenAI",
        provider: "GPT-4, GPT-3.5",
        envVar: "OPENAI_API_KEY",
        placeholder: "sk-...",
        docsUrl: "https://platform.openai.com/api-keys"
    },
    {
        id: "anthropic",
        name: "Anthropic",
        provider: "Claude 3.5, Claude 3",
        envVar: "ANTHROPIC_API_KEY",
        placeholder: "sk-ant-...",
        docsUrl: "https://console.anthropic.com/"
    },
    {
        id: "google",
        name: "Google AI",
        provider: "Gemini Pro, Gemini Flash",
        envVar: "GOOGLE_GENERATIVE_AI_API_KEY",
        placeholder: "AIza...",
        docsUrl: "https://aistudio.google.com/app/apikey"
    },
    {
        id: "groq",
        name: "Groq",
        provider: "LLaMA 3, Mixtral",
        envVar: "GROQ_API_KEY",
        placeholder: "gsk_...",
        docsUrl: "https://console.groq.com/keys"
    },
    {
        id: "together",
        name: "Together AI",
        provider: "Open Source Models",
        envVar: "TOGETHER_API_KEY",
        placeholder: "...",
        docsUrl: "https://api.together.xyz/"
    }
]

export default function SettingsContent() {
    const { data: session, status } = useSession()
    const [activeTab, setActiveTab] = useState("profile")
    const [isLoading, setIsLoading] = useState(false)
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
    const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({})
    const [fullName, setFullName] = useState("")

    useEffect(() => {
        if (session?.user?.name) {
            setFullName(session.user.name)
        }
    }, [session])

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "api-keys", label: "API Keys", icon: Key },
        { id: "cli", label: "CLI", icon: Terminal },
        { id: "appearance", label: "Appearance", icon: Palette },
    ]

    if (status === "loading") {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        )
    }

    const handleSaveProfile = async () => {
        setIsLoading(true)
        try {
            await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: fullName })
            })
        } catch (error) {
            console.error("Failed to save profile:", error)
        }
        setIsLoading(false)
    }

    const handleSaveKey = async (providerId: string) => {
        setIsLoading(true)
        try {
            await fetch("/api/user/api-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: providerId,
                    key: apiKeys[providerId]
                })
            })
            setSavedKeys(prev => ({ ...prev, [providerId]: true }))
        } catch (error) {
            console.error("Failed to save key:", error)
        }
        setIsLoading(false)
    }

    const toggleShowKey = (id: string) => {
        setShowKeys(prev => ({ ...prev, [id]: !prev[id] }))
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
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                                        {session?.user?.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <p className="font-medium">{session?.user?.name || "User"}</p>
                                        <p className="text-sm text-muted-foreground">{session?.user?.email || "Not logged in"}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        value={session?.user?.email || ""}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">Contact support to change email.</p>
                                </div>
                                {status === "unauthenticated" && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Not logged in</p>
                                            <p className="text-xs text-amber-600 dark:text-amber-400">Sign in to save your settings.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveProfile} disabled={isLoading || status !== "authenticated"}>
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {activeTab === "api-keys" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>LLM Provider Keys</CardTitle>
                                <CardDescription>
                                    Configure API keys for AI providers. Keys are encrypted and stored securely.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {LLM_PROVIDERS.map((provider) => (
                                    <div key={provider.id} className="space-y-2 p-4 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-sm font-medium">{provider.name}</label>
                                                <p className="text-xs text-muted-foreground">{provider.provider}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {savedKeys[provider.id] && (
                                                    <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
                                                        <Check className="h-3 w-3" />
                                                        Saved
                                                    </Badge>
                                                )}
                                                <a
                                                    href={provider.docsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Get key →
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type={showKeys[provider.id] ? "text" : "password"}
                                                placeholder={provider.placeholder}
                                                value={apiKeys[provider.id] || ""}
                                                onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                            />
                                            <Button variant="outline" size="icon" onClick={() => toggleShowKey(provider.id)}>
                                                {showKeys[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            <Button variant="outline" onClick={() => handleSaveKey(provider.id)} disabled={!apiKeys[provider.id] || isLoading}>
                                                Save
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">{provider.envVar}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "cli" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>MeganAi CLI</CardTitle>
                                    <CardDescription>Generate code from your terminal using the MeganAi CLI.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Install CLI</label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-slate-900 text-slate-100 px-4 py-3 rounded-lg text-sm font-mono">
                                                npm install -g @meganai/cli
                                            </code>
                                            <Button variant="outline" size="icon"><Copy className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Login with CLI</label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-slate-900 text-slate-100 px-4 py-3 rounded-lg text-sm font-mono">
                                                meganai login
                                            </code>
                                            <Button variant="outline" size="icon"><Copy className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Generate a Project</label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-slate-900 text-slate-100 px-4 py-3 rounded-lg text-sm font-mono">
                                                meganai generate &quot;Build a SaaS with Stripe&quot;
                                            </code>
                                            <Button variant="outline" size="icon"><Copy className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">API Token</label>
                                        <p className="text-xs text-muted-foreground">Use this token with the CLI or API.</p>
                                        <div className="flex gap-2">
                                            <Input type="password" value="megan_live_xxxxxxxxxxxxxxxxxxxx" readOnly className="font-mono" />
                                            <Button variant="outline" size="icon"><Copy className="h-4 w-4" /></Button>
                                            <Button variant="outline">Regenerate</Button>
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
                                <Button className="w-full sm:w-auto">Update Theme</Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
