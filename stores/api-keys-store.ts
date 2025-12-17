// stores/api-keys-store.ts

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface APIKeysState {
    keys: Record<string, string>
    validationStatus: Record<string, "valid" | "invalid" | "unknown">
    isValidating: Record<string, boolean>
    setKey: (key: string, value: string) => void
    validateKey: (key: string) => Promise<void>
    getAllKeys: () => Record<string, string>
}

export const useApiKeysStore = create<APIKeysState>()(
    persist(
        (set, get) => ({
            keys: {},
            validationStatus: {},
            isValidating: {},

            setKey: (key, value) => {
                set((state) => ({
                    keys: { ...state.keys, [key]: value },
                    validationStatus: { ...state.validationStatus, [key]: "unknown" },
                }))
            },

            validateKey: async (key) => {
                const value = get().keys[key]
                if (!value) return

                set((state) => ({
                    isValidating: { ...state.isValidating, [key]: true },
                }))

                try {
                    const response = await fetch("/api/settings/validate-key", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ key, value }),
                    })

                    const { valid } = await response.json()

                    set((state) => ({
                        validationStatus: {
                            ...state.validationStatus,
                            [key]: valid ? "valid" : "invalid",
                        },
                    }))
                } catch {
                    set((state) => ({
                        validationStatus: { ...state.validationStatus, [key]: "invalid" },
                    }))
                } finally {
                    set((state) => ({
                        isValidating: { ...state.isValidating, [key]: false },
                    }))
                }
            },

            getAllKeys: () => get().keys,
        }),
        {
            name: "meganai-api-keys",
            // Only persist keys, not validation status
            partialize: (state) => ({ keys: state.keys }),
        }
    )
)
