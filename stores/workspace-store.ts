// stores/workspace-store.ts

import { create } from "zustand"
import { Project } from "@/types/project"

interface WorkspaceState {
    project: Project | null
    isLoading: boolean
    error: string | null
    loadProject: (projectId: string) => Promise<void>
    updateProject: (updates: Partial<Project>) => void
    reset: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    project: null,
    isLoading: false,
    error: null,

    loadProject: async (projectId) => {
        set({ isLoading: true, error: null })
        try {
            const response = await fetch(`/api/projects/${projectId}`)
            if (!response.ok) throw new Error("Failed to load project")
            const project = await response.json()
            set({ project, isLoading: false })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Unknown error",
                isLoading: false,
            })
        }
    },

    updateProject: (updates) => {
        set((state) => ({
            project: state.project ? { ...state.project, ...updates } : null,
        }))
    },

    reset: () => set({ project: null, isLoading: false, error: null }),
}))
