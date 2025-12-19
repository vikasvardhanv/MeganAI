/**
 * Pass Card & Purchase Components
 * Display passes and purchase flow for credits
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Zap, Clock, Star, Crown, Users, Check, Sparkles } from "lucide-react"

interface Pass {
    id: string
    type: "DAILY" | "WEEKLY" | "MONTHLY" | "ANNUAL" | "TEAM"
    name: string
    credits: number
    usedCredits: number
    price: number
    validFrom: string
    validUntil: string
    isActive: boolean
}

interface PassCardProps {
    pass: Pass
    showProgress?: boolean
}

export function PassCard({ pass, showProgress = true }: PassCardProps) {
    const remainingCredits = pass.credits - pass.usedCredits
    const usagePercent = (pass.usedCredits / pass.credits) * 100
    const daysRemaining = Math.ceil(
        (new Date(pass.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    const typeConfig = {
        DAILY: { icon: Clock, color: "from-blue-500 to-cyan-500" },
        WEEKLY: { icon: Zap, color: "from-purple-500 to-pink-500" },
        MONTHLY: { icon: Star, color: "from-orange-500 to-yellow-500" },
        ANNUAL: { icon: Crown, color: "from-amber-500 to-orange-500" },
        TEAM: { icon: Users, color: "from-green-500 to-emerald-500" }
    }

    const config = typeConfig[pass.type]
    const Icon = config.icon

    return (
        <Card className={cn(!pass.isActive && "opacity-60")}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "p-2 rounded-lg bg-gradient-to-br text-white",
                            config.color
                        )}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{pass.name}</CardTitle>
                            <CardDescription className="text-xs">
                                {pass.type} Pass
                            </CardDescription>
                        </div>
                    </div>
                    {pass.isActive ? (
                        <Badge variant="secondary" className="text-xs">
                            {daysRemaining}d left
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-xs">
                            Expired
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Credits</span>
                        <span className="font-medium">
                            {remainingCredits.toLocaleString()} / {pass.credits.toLocaleString()}
                        </span>
                    </div>
                    {showProgress && (
                        <Progress value={100 - usagePercent} className="h-2" />
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// Purchase Options
interface PassOption {
    type: "DAILY" | "WEEKLY" | "MONTHLY" | "ANNUAL" | "TEAM"
    name: string
    credits: number
    price: number
    savings?: string
    popular?: boolean
    features: string[]
}

const PASS_OPTIONS: PassOption[] = [
    {
        type: "DAILY",
        name: "Day Pass",
        credits: 100,
        price: 2.99,
        features: ["100 AI credits", "Valid 24 hours", "All features"]
    },
    {
        type: "WEEKLY",
        name: "Week Pass",
        credits: 500,
        price: 9.99,
        savings: "Save 33%",
        features: ["500 AI credits", "Valid 7 days", "Priority support"]
    },
    {
        type: "MONTHLY",
        name: "Month Pass",
        credits: 2500,
        price: 29.99,
        savings: "Save 50%",
        popular: true,
        features: ["2,500 AI credits", "Valid 30 days", "Priority support", "Advanced analytics"]
    },
    {
        type: "ANNUAL",
        name: "Annual Pass",
        credits: 36000,
        price: 249.99,
        savings: "Save 65%",
        features: ["36,000 AI credits", "Valid 1 year", "VIP support", "Team features", "Custom workflows"]
    },
    {
        type: "TEAM",
        name: "Team Pass",
        credits: 10000,
        price: 99.99,
        features: ["10,000 shared credits", "Up to 5 members", "Workspace collaboration", "Admin controls"]
    }
]

interface PassPurchaseProps {
    onPurchase: (passType: PassOption["type"]) => Promise<void>
}

export function PassPurchase({ onPurchase }: PassPurchaseProps) {
    const [selectedPass, setSelectedPass] = useState<PassOption | null>(null)
    const [isPurchasing, setIsPurchasing] = useState(false)

    const handlePurchase = async () => {
        if (!selectedPass) return
        setIsPurchasing(true)
        try {
            await onPurchase(selectedPass.type)
            setSelectedPass(null)
        } finally {
            setIsPurchasing(false)
        }
    }

    return (
        <>
            <div className="grid grid-cols-3 gap-4">
                {PASS_OPTIONS.filter(p => p.type !== "TEAM").map((option) => {
                    const typeConfig = {
                        DAILY: { icon: Clock, color: "from-blue-500 to-cyan-500" },
                        WEEKLY: { icon: Zap, color: "from-purple-500 to-pink-500" },
                        MONTHLY: { icon: Star, color: "from-orange-500 to-yellow-500" },
                        ANNUAL: { icon: Crown, color: "from-amber-500 to-orange-500" },
                        TEAM: { icon: Users, color: "from-green-500 to-emerald-500" }
                    }
                    const config = typeConfig[option.type]
                    const Icon = config.icon

                    return (
                        <Card
                            key={option.type}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-lg relative",
                                option.popular && "ring-2 ring-primary"
                            )}
                            onClick={() => setSelectedPass(option)}
                        >
                            {option.popular && (
                                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">
                                    Most Popular
                                </Badge>
                            )}
                            <CardHeader className="text-center pb-2">
                                <div className={cn(
                                    "mx-auto p-3 rounded-full bg-gradient-to-br text-white w-fit",
                                    config.color
                                )}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-lg mt-2">{option.name}</CardTitle>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-3xl font-bold">${option.price}</span>
                                </div>
                                {option.savings && (
                                    <Badge variant="secondary" className="text-xs mt-1">
                                        {option.savings}
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="text-center mb-4">
                                    <span className="text-2xl font-bold">{option.credits.toLocaleString()}</span>
                                    <span className="text-muted-foreground ml-1">credits</span>
                                </div>
                                <ul className="space-y-2 text-sm">
                                    {option.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant={option.popular ? "default" : "outline"}>
                                    Select
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>

            {/* Purchase Dialog */}
            <Dialog open={!!selectedPass} onOpenChange={() => setSelectedPass(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Purchase</DialogTitle>
                        <DialogDescription>
                            You're about to purchase the {selectedPass?.name} for ${selectedPass?.price}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium">{selectedPass?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedPass?.credits.toLocaleString()} credits
                                </p>
                            </div>
                            <p className="text-2xl font-bold">${selectedPass?.price}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedPass(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handlePurchase} disabled={isPurchasing}>
                            {isPurchasing ? "Processing..." : "Purchase"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
