/**
 * Voice Output Hook
 * Uses OpenAI TTS API for high-quality text-to-speech
 */

"use client"

import { useState, useCallback, useRef } from "react"

interface UseVoiceOutputOptions {
    voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
    speed?: number  // 0.25 to 4.0
    autoPlay?: boolean
}

interface UseVoiceOutputReturn {
    isSpeaking: boolean
    isLoading: boolean
    speak: (text: string) => Promise<void>
    stop: () => void
    error: string | null
}

export function useVoiceOutput(options: UseVoiceOutputOptions = {}): UseVoiceOutputReturn {
    const { voice = "nova", speed = 1.0, autoPlay = true } = options

    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            audioRef.current = null
        }
        setIsSpeaking(false)
    }, [])

    const speak = useCallback(async (text: string) => {
        if (!text.trim()) return

        // Stop any current playback
        stop()
        setError(null)
        setIsLoading(true)

        try {
            const response = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, voice, speed })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "TTS request failed")
            }

            // Get audio blob
            const blob = await response.blob()
            const audioUrl = URL.createObjectURL(blob)

            // Create audio element
            const audio = new Audio(audioUrl)
            audioRef.current = audio

            audio.onended = () => {
                setIsSpeaking(false)
                URL.revokeObjectURL(audioUrl)
            }

            audio.onerror = () => {
                setError("Failed to play audio")
                setIsSpeaking(false)
                URL.revokeObjectURL(audioUrl)
            }

            if (autoPlay) {
                await audio.play()
                setIsSpeaking(true)
            }

        } catch (err) {
            console.error("TTS error:", err)
            setError(err instanceof Error ? err.message : "TTS failed")
        } finally {
            setIsLoading(false)
        }
    }, [voice, speed, autoPlay, stop])

    return {
        isSpeaking,
        isLoading,
        speak,
        stop,
        error
    }
}

/**
 * Fallback: Browser TTS (less natural but free)
 */
export function useBrowserTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

    const speak = useCallback((text: string) => {
        if (!("speechSynthesis" in window)) {
            console.warn("Browser TTS not supported")
            return
        }

        // Cancel any current speech
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1.0
        utterance.pitch = 1.0

        // Try to find a natural-sounding voice
        const voices = window.speechSynthesis.getVoices()
        const preferredVoice = voices.find(v =>
            v.name.includes("Samantha") ||
            v.name.includes("Google") ||
            v.name.includes("Natural")
        )
        if (preferredVoice) {
            utterance.voice = preferredVoice
        }

        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)

        utteranceRef.current = utterance
        window.speechSynthesis.speak(utterance)
    }, [])

    const stop = useCallback(() => {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
    }, [])

    return { isSpeaking, speak, stop }
}
