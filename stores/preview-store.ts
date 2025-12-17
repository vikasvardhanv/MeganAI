// stores/preview-store.ts

import { create } from "zustand"

interface PreviewState {
    previewUrl: string | null
    files: Record<string, string>
    selectedFile: string | null
    setPreviewUrl: (url: string | null) => void
    setFiles: (files: Record<string, string>) => void
    setSelectedFile: (file: string | null) => void
    reset: () => void
}

export const usePreviewStore = create<PreviewState>((set) => ({
    previewUrl: null,
    files: {},
    selectedFile: null,

    setPreviewUrl: (url) => set({ previewUrl: url }),
    setFiles: (files) => set({ files }),
    setSelectedFile: (file) => set({ selectedFile: file }),
    reset: () => set({ previewUrl: null, files: {}, selectedFile: null }),
}))
