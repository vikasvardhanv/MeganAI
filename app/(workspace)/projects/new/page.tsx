"use client"

import { useState } from "react"
import { ChatPanel } from "@/components/workspace/chat-panel"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Play, Moon, Sun, Monitor, Smartphone, Tablet } from "lucide-react"

export default function NewProjectPage() {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Left Panel: Chat & Orchestrator */}
            <div className="w-1/3 min-w-[350px] border-r flex flex-col bg-muted/5">
                <div className="h-14 border-b flex items-center px-4 justify-between bg-background">
                    <span className="font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        MeganAi Architect
                    </span>
                    <div className="flex gap-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                            Planning Mode
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <ChatPanel />
                </div>
            </div>

            {/* Right Panel: Preview & Code */}
            <div className="flex-1 flex flex-col min-w-0 bg-secondary/5">
                <div className="h-14 border-b flex items-center px-4 justify-between bg-background">
                    <Tabs defaultValue="preview" className="h-full">
                        <TabsList className="h-9">
                            <TabsTrigger value="preview">Live Preview</TabsTrigger>
                            <TabsTrigger value="code">Code</TabsTrigger>
                            <TabsTrigger value="console">Console</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-md bg-muted/20 mr-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r">
                                <Monitor className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r">
                                <Tablet className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none">
                                <Smartphone className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button size="sm" className="gap-2">
                            <Play className="h-3 w-3" />
                            Deploy
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    {/* Placeholder for Preview */}
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground flex-col gap-4">
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                            <Monitor className="w-8 h-8 opacity-20" />
                        </div>
                        <p>Describe your app in the chat to start building...</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
