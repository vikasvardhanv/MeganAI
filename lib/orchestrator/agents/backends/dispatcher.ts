/**
 * Backend Dispatcher
 * Routes to the appropriate language-specific backend agent
 */

import { analyzeIntent, type Language, type DetectedIntent } from "../../analyzers/intent-analyzer"
import { generatePythonBackend } from "./python"
import { generateJavaBackend } from "./java"
import { generateGoBackend } from "./go"
import type { ProgressEvent } from "../../core"

export interface BackendDispatcherOptions {
    prompt: string
    appName: string
    forcedLanguage?: Language
    forcedFramework?: string
}

/**
 * Dispatch to appropriate backend generator based on intent
 */
export async function* dispatchBackendGeneration(
    options: BackendDispatcherOptions
): AsyncGenerator<ProgressEvent> {
    const { prompt, appName, forcedLanguage, forcedFramework } = options

    // Analyze intent
    const intent = analyzeIntent(prompt)

    // Override with forced values if provided
    const language = forcedLanguage || intent.language
    const framework = forcedFramework || intent.framework

    yield {
        type: "thinking",
        agent: "Backend Dispatcher",
        message: `Detected: ${language.toUpperCase()} with ${framework}`,
        progress: 5
    }

    // Route to appropriate generator
    switch (language) {
        case 'python':
            yield* generatePythonBackend(prompt, {
                framework: framework as 'fastapi' | 'django' | 'flask',
                database: intent.database,
                apis: intent.apis,
                features: intent.features,
                appName
            })
            break

        case 'java':
            yield* generateJavaBackend(prompt, {
                framework: framework as 'spring' | 'quarkus' | 'micronaut',
                database: intent.database,
                apis: intent.apis,
                features: intent.features,
                appName
            })
            break

        case 'go':
            yield* generateGoBackend(prompt, {
                framework: framework as 'gin' | 'echo' | 'fiber',
                database: intent.database,
                apis: intent.apis,
                features: intent.features,
                appName
            })
            break

        case 'typescript':
        default:
            // Use existing Node.js/TypeScript generation
            yield {
                type: "generating",
                agent: "Backend (TypeScript)",
                message: "Using TypeScript/Node.js backend generator",
                progress: 10
            }
            // The existing backend.ts handles TypeScript
            break
    }
}

/**
 * Get available frameworks for a language
 */
export function getFrameworksForLanguage(language: Language): string[] {
    const frameworks: Record<Language, string[]> = {
        typescript: ['nextjs', 'express', 'nestjs', 'fastify'],
        python: ['fastapi', 'django', 'flask'],
        java: ['spring', 'quarkus', 'micronaut'],
        go: ['gin', 'echo', 'fiber'],
        rust: ['actix', 'axum']
    }
    return frameworks[language] || []
}

/**
 * Get display name for language
 */
export function getLanguageDisplayName(language: Language): string {
    const names: Record<Language, string> = {
        typescript: 'TypeScript/Node.js',
        python: 'Python',
        java: 'Java',
        go: 'Go',
        rust: 'Rust'
    }
    return names[language] || language
}
