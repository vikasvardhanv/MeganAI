/**
 * Voice Input Hook
 * Uses Web Speech API for speech-to-text (free, built into browsers)
 */

"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseVoiceInputOptions {
    continuous?: boolean
    interimResults?: boolean
    language?: string
    onResult?: (transcript: string, isFinal: boolean) => void
    onError?: (error: string) => void
}

interface UseVoiceInputReturn {
    transcript: string
    interimTranscript: string
    isListening: boolean
    isSupported: boolean
    startListening: () => void
    stopListening: () => void
    resetTranscript: () => void
}

// Extend Window for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
}

interface SpeechRecognitionResult {
    isFinal: boolean
    [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
}

interface SpeechRecognitionResultList {
    length: number
    [index: number]: SpeechRecognitionResult
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start: () => void
    stop: () => void
    abort: () => void
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: { error: string }) => void) | null
    onend: (() => void) | null
    onstart: (() => void) | null
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition
        webkitSpeechRecognition: new () => SpeechRecognition
    }
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
    const {
        continuous = true,
        interimResults = true,
        language = "en-US",
        onResult,
        onError
    } = options

    const [transcript, setTranscript] = useState("")
    const [interimTranscript, setInterimTranscript] = useState("")
    const [isListening, setIsListening] = useState(false)
    const [isSupported, setIsSupported] = useState(false)

    const recognitionRef = useRef<SpeechRecognition | null>(null)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
            setIsSupported(!!SpeechRecognitionAPI)

            if (SpeechRecognitionAPI) {
                const recognition = new SpeechRecognitionAPI()
                recognition.continuous = continuous
                recognition.interimResults = interimResults
                recognition.lang = language

                recognition.onstart = () => {
                    setIsListening(true)
                }

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    let finalTranscript = ""
                    let interim = ""

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const result = event.results[i]
                        const text = result[0].transcript

                        if (result.isFinal) {
                            finalTranscript += text
                        } else {
                            interim += text
                        }
                    }

                    if (finalTranscript) {
                        setTranscript(prev => prev + finalTranscript)
                        onResult?.(finalTranscript, true)
                    }

                    setInterimTranscript(interim)
                    if (interim) {
                        onResult?.(interim, false)
                    }
                }

                recognition.onerror = (event) => {
                    console.error("Speech recognition error:", event.error)
                    onError?.(event.error)
                    setIsListening(false)
                }

                recognition.onend = () => {
                    setIsListening(false)
                    setInterimTranscript("")
                }

                recognitionRef.current = recognition
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort()
            }
        }
    }, [continuous, interimResults, language, onResult, onError])

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start()
            } catch (error) {
                console.error("Failed to start recognition:", error)
            }
        }
    }, [isListening])

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
        }
    }, [isListening])

    const resetTranscript = useCallback(() => {
        setTranscript("")
        setInterimTranscript("")
    }, [])

    return {
        transcript,
        interimTranscript,
        isListening,
        isSupported,
        startListening,
        stopListening,
        resetTranscript
    }
}
