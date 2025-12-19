/**
 * WebContainer Manager
 * Singleton manager for browser-based Node.js runtime
 * Used to run generated React/Next.js apps in the browser
 */

import { WebContainer, type FileSystemTree } from "@webcontainer/api"

// Singleton instance
let webcontainerInstance: WebContainer | null = null
let bootPromise: Promise<WebContainer> | null = null

export interface ProcessOutput {
    type: "stdout" | "stderr"
    data: string
}

/**
 * Boot the WebContainer instance
 * Returns the same instance if already booted
 */
export async function bootWebContainer(): Promise<WebContainer> {
    if (webcontainerInstance) {
        return webcontainerInstance
    }

    if (bootPromise) {
        return bootPromise
    }

    bootPromise = WebContainer.boot().then((instance) => {
        webcontainerInstance = instance
        console.log("[WebContainer] Booted successfully")
        return instance
    })

    return bootPromise
}

/**
 * Get the WebContainer instance (must be booted first)
 */
export function getWebContainer(): WebContainer | null {
    return webcontainerInstance
}

/**
 * Check if WebContainer is supported in this browser
 */
export function isWebContainerSupported(): boolean {
    // WebContainers require SharedArrayBuffer which needs specific headers
    return typeof SharedArrayBuffer !== "undefined"
}

/**
 * Convert flat file list to WebContainer file system tree
 */
export function filesToFileSystemTree(files: Record<string, string>): FileSystemTree {
    const tree: FileSystemTree = {}

    for (const [path, content] of Object.entries(files)) {
        const parts = path.split("/").filter(Boolean)
        let current: any = tree

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            const isLast = i === parts.length - 1

            if (isLast) {
                // It's a file
                current[part] = {
                    file: { contents: content }
                }
            } else {
                // It's a directory
                if (!current[part]) {
                    current[part] = { directory: {} }
                }
                current = current[part].directory
            }
        }
    }

    return tree
}

/**
 * Write files to the WebContainer
 */
export async function writeFilesToContainer(
    container: WebContainer,
    files: Record<string, string>
): Promise<void> {
    const tree = filesToFileSystemTree(files)
    await container.mount(tree)
    console.log(`[WebContainer] Mounted ${Object.keys(files).length} files`)
}

/**
 * Run a command in the WebContainer
 */
export async function runCommand(
    container: WebContainer,
    command: string,
    args: string[] = [],
    onOutput?: (output: ProcessOutput) => void
): Promise<number> {
    const process = await container.spawn(command, args)

    // Stream stdout
    process.output.pipeTo(
        new WritableStream({
            write(data) {
                onOutput?.({ type: "stdout", data })
            }
        })
    )

    // Wait for process to exit
    const exitCode = await process.exit
    return exitCode
}

/**
 * Install npm dependencies
 */
export async function installDependencies(
    container: WebContainer,
    onOutput?: (output: ProcessOutput) => void
): Promise<boolean> {
    console.log("[WebContainer] Installing dependencies...")
    onOutput?.({ type: "stdout", data: "📦 Installing dependencies...\n" })

    const exitCode = await runCommand(container, "npm", ["install"], onOutput)

    if (exitCode === 0) {
        console.log("[WebContainer] Dependencies installed successfully")
        onOutput?.({ type: "stdout", data: "✅ Dependencies installed!\n" })
        return true
    } else {
        console.error("[WebContainer] Failed to install dependencies")
        onOutput?.({ type: "stderr", data: "❌ Failed to install dependencies\n" })
        return false
    }
}

/**
 * Start the development server
 * Returns the server URL
 */
export async function startDevServer(
    container: WebContainer,
    onOutput?: (output: ProcessOutput) => void,
    onServerReady?: (url: string) => void
): Promise<void> {
    console.log("[WebContainer] Starting dev server...")
    onOutput?.({ type: "stdout", data: "🚀 Starting development server...\n" })

    // Listen for server-ready event
    container.on("server-ready", (port, url) => {
        console.log(`[WebContainer] Server ready at ${url}`)
        onOutput?.({ type: "stdout", data: `\n✨ Server ready at port ${port}\n` })
        onServerReady?.(url)
    })

    // Start the dev server (don't await - it runs indefinitely)
    runCommand(container, "npm", ["run", "dev"], onOutput)
}

/**
 * Teardown the WebContainer
 */
export async function teardownWebContainer(): Promise<void> {
    if (webcontainerInstance) {
        await webcontainerInstance.teardown()
        webcontainerInstance = null
        bootPromise = null
        console.log("[WebContainer] Teardown complete")
    }
}

/**
 * WebContainer hook state
 */
export interface WebContainerState {
    isSupported: boolean
    isBooting: boolean
    isReady: boolean
    isInstalling: boolean
    isRunning: boolean
    previewUrl: string | null
    error: string | null
    consoleOutput: string[]
}

export const initialWebContainerState: WebContainerState = {
    isSupported: false,
    isBooting: false,
    isReady: false,
    isInstalling: false,
    isRunning: false,
    previewUrl: null,
    error: null,
    consoleOutput: []
}
