/**
 * Text-to-Speech API
 * POST /api/tts - Generate speech audio from text using OpenAI TTS
 */

import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { text, voice = "nova", speed = 1.0 } = body

        if (!text) {
            return NextResponse.json(
                { error: "Text is required" },
                { status: 400 }
            )
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OpenAI API key not configured" },
                { status: 500 }
            )
        }

        // Validate voice
        const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
        if (!validVoices.includes(voice)) {
            return NextResponse.json(
                { error: `Invalid voice. Must be one of: ${validVoices.join(", ")}` },
                { status: 400 }
            )
        }

        // Validate speed
        if (speed < 0.25 || speed > 4.0) {
            return NextResponse.json(
                { error: "Speed must be between 0.25 and 4.0" },
                { status: 400 }
            )
        }

        // Truncate text if too long (TTS has limits)
        const maxLength = 4096
        const truncatedText = text.length > maxLength
            ? text.substring(0, maxLength) + "..."
            : text

        // Generate speech
        const response = await openai.audio.speech.create({
            model: "tts-1",  // Use tts-1-hd for higher quality (slower, more expensive)
            voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
            input: truncatedText,
            speed: speed
        })

        // Get audio as ArrayBuffer
        const audioBuffer = await response.arrayBuffer()

        // Return audio as MP3
        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": String(audioBuffer.byteLength)
            }
        })

    } catch (error) {
        console.error("TTS error:", error)

        if (error instanceof OpenAI.APIError) {
            return NextResponse.json(
                { error: `OpenAI API error: ${error.message}` },
                { status: error.status || 500 }
            )
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "TTS failed" },
            { status: 500 }
        )
    }
}
