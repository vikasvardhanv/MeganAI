/**
 * Workspace Selector & Team Components
 * Switch between workspaces and manage team members
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Building2, ChevronDown, Plus, Settings, Users, Check, Crown, UserPlus } from "lucide-react"

interface Workspace {
    id: string
    name: string
    slug: string
    description?: string
    memberCount: number
    role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
}

interface WorkspaceSelectorProps {
    currentWorkspaceId?: string
    onWorkspaceChange: (workspaceId: string) => void
}

export function WorkspaceSelector({ currentWorkspaceId, onWorkspaceChange }: WorkspaceSelectorProps) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [newWorkspaceName, setNewWorkspaceName] = useState("")

    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                const response = await fetch("/api/workspaces")
                if (response.ok) {
                    const data = await response.json()
                    setWorkspaces(data.workspaces || [])
                }
            } catch (error) {
                console.error("Failed to fetch workspaces:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchWorkspaces()
    }, [])

    const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId)

    const handleCreate = async () => {
        if (!newWorkspaceName.trim()) return

        try {
            const response = await fetch("/api/workspaces", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newWorkspaceName })
            })

            if (response.ok) {
                const data = await response.json()
                setWorkspaces([...workspaces, data.workspace])
                onWorkspaceChange(data.workspace.id)
                setShowCreateDialog(false)
                setNewWorkspaceName("")
            }
        } catch (error) {
            console.error("Failed to create workspace:", error)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 min-w-[180px] justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate max-w-[120px]">
                                {currentWorkspace?.name || "Select Workspace"}
                            </span>
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[220px]">
                    <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {workspaces.map((workspace) => (
                        <DropdownMenuItem
                            key={workspace.id}
                            onClick={() => onWorkspaceChange(workspace.id)}
                            className="gap-2"
                        >
                            <Building2 className="h-4 w-4" />
                            <div className="flex-1 truncate">
                                <span>{workspace.name}</span>
                            </div>
                            {workspace.role === "OWNER" && (
                                <Crown className="h-3 w-3 text-yellow-500" />
                            )}
                            {workspace.id === currentWorkspaceId && (
                                <Check className="h-4 w-4" />
                            )}
                        </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Workspace
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Workspace</DialogTitle>
                        <DialogDescription>
                            Create a new workspace to collaborate with your team
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Workspace Name</Label>
                            <Input
                                id="name"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                placeholder="My Team"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

// Team Member List
interface TeamMember {
    id: string
    userId: string
    role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
    user: {
        id: string
        name: string
        email: string
        image?: string
    }
}

interface MemberListProps {
    workspaceId: string
    onInvite?: () => void
}

export function MemberList({ workspaceId, onInvite }: MemberListProps) {
    const [members, setMembers] = useState<TeamMember[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await fetch(`/api/workspaces/${workspaceId}/members`)
                if (response.ok) {
                    const data = await response.json()
                    setMembers(data.members || [])
                }
            } catch (error) {
                console.error("Failed to fetch members:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (workspaceId) {
            fetchMembers()
        }
    }, [workspaceId])

    const roleConfig = {
        OWNER: { label: "Owner", color: "bg-yellow-100 text-yellow-700" },
        ADMIN: { label: "Admin", color: "bg-purple-100 text-purple-700" },
        MEMBER: { label: "Member", color: "bg-blue-100 text-blue-700" },
        VIEWER: { label: "Viewer", color: "bg-gray-100 text-gray-700" }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                    <Badge variant="secondary">{members.length}</Badge>
                </h3>
                {onInvite && (
                    <Button size="sm" variant="outline" onClick={onInvite}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite
                    </Button>
                )}
            </div>

            <div className="space-y-2">
                {members.map((member) => {
                    const config = roleConfig[member.role]
                    return (
                        <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={member.user.image} />
                                    <AvatarFallback>
                                        {member.user.name?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{member.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                                </div>
                            </div>
                            <Badge className={cn("text-xs", config.color)}>
                                {member.role === "OWNER" && <Crown className="h-3 w-3 mr-1" />}
                                {config.label}
                            </Badge>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
