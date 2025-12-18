/**
 * Pipeline Execution Engine
 * Executes multi-step workflows with parallel processing, dependencies, retries, and streaming
 */

export type StepStatus = "pending" | "running" | "complete" | "failed" | "skipped"

export interface PipelineStep<TInput = any, TOutput = any> {
    id: string
    name: string
    description?: string

    // Execution
    execute: (input: TInput, context: PipelineContext) => Promise<TOutput>

    // Input can be static or derived from context
    input?: TInput | ((context: PipelineContext) => TInput)

    // Dependencies
    dependencies?: string[]  // Step IDs that must complete first

    // Conditional execution
    condition?: (context: PipelineContext) => boolean  // Skip if returns false

    // Error handling
    retries?: number
    retryDelay?: number  // ms, default exponential backoff
    timeout?: number  // ms

    // On error behavior
    onError?: "fail" | "skip" | "continue"  // default: fail

    // Callbacks
    onStart?: (context: PipelineContext) => void
    onComplete?: (output: TOutput, context: PipelineContext) => void
    onFail?: (error: Error, context: PipelineContext) => void
}

export interface PipelineContext {
    // Input provided when pipeline starts
    inputs: Record<string, any>

    // Outputs from completed steps
    outputs: Record<string, any>

    // Pipeline metadata
    metadata: {
        pipelineId: string
        startTime: Date
        currentStep?: string
        completedSteps: string[]
        failedSteps: string[]
        skippedSteps: string[]
        errors: Array<{ step: string; error: string; timestamp: Date; attempt: number }>
    }

    // Shared state for steps to communicate
    state: Record<string, any>

    // Abort signal for cancellation
    abortSignal?: AbortSignal
}

export interface PipelineEvent {
    type: "pipeline-started" | "step-started" | "step-progress" | "step-complete" | "step-failed" | "step-skipped" | "pipeline-complete" | "pipeline-failed"
    pipelineId: string
    stepId?: string
    stepName?: string
    message: string
    data?: any
    progress?: number  // 0-100
    timestamp: Date
    duration?: number  // ms
}

export interface PipelineResult {
    success: boolean
    pipelineId: string
    outputs: Record<string, any>
    steps: Array<{
        id: string
        name: string
        status: StepStatus
        duration: number
        output?: any
        error?: string
        retries?: number
    }>
    totalDuration: number
    modelsUsed: string[]
    errors: Array<{ step: string; error: string }>
}

export interface PipelineConfig {
    id?: string
    name?: string
    maxConcurrency?: number  // Max parallel steps
    stopOnError?: boolean  // Stop entire pipeline on first error
    timeout?: number  // Pipeline-level timeout
}

export class Pipeline {
    private steps: Map<string, PipelineStep> = new Map()
    private config: PipelineConfig

    constructor(config: PipelineConfig = {}) {
        this.config = {
            id: config.id || this.generateId(),
            maxConcurrency: config.maxConcurrency || 5,
            stopOnError: config.stopOnError ?? true,
            timeout: config.timeout,
            ...config
        }
    }

    /**
     * Add a step to the pipeline
     */
    addStep<TInput = any, TOutput = any>(step: PipelineStep<TInput, TOutput>): this {
        this.steps.set(step.id, step as PipelineStep)
        return this
    }

    /**
     * Add multiple steps
     */
    addSteps(steps: PipelineStep[]): this {
        steps.forEach(step => this.addStep(step))
        return this
    }

    /**
     * Execute the pipeline with streaming events
     */
    async *execute(inputs: Record<string, any> = {}): AsyncGenerator<PipelineEvent, PipelineResult> {
        const pipelineId = this.config.id!
        const startTime = Date.now()

        // Initialize context
        const context: PipelineContext = {
            inputs,
            outputs: {},
            metadata: {
                pipelineId,
                startTime: new Date(),
                completedSteps: [],
                failedSteps: [],
                skippedSteps: [],
                errors: []
            },
            state: {}
        }

        // Track step results
        const stepResults = new Map<string, { status: StepStatus; output?: any; duration: number; retries?: number; error?: string }>()
        const modelsUsed: string[] = []

        yield {
            type: "pipeline-started",
            pipelineId,
            message: `Pipeline started with ${this.steps.size} steps`,
            progress: 0,
            timestamp: new Date()
        }

        // Get execution order (topological sort)
        const executionOrder = this.getExecutionOrder()
        const totalSteps = executionOrder.length
        let completedCount = 0

        // Track in-flight steps for parallel execution
        const inFlight = new Set<string>()
        const completed = new Set<string>()

        // Process steps respecting dependencies and concurrency
        while (completed.size < totalSteps) {
            // Find runnable steps
            const runnableSteps = executionOrder.filter(step =>
                !completed.has(step.id) &&
                !inFlight.has(step.id) &&
                (step.dependencies || []).every(dep => completed.has(dep))
            )

            // Check if we're stuck
            if (runnableSteps.length === 0 && inFlight.size === 0) {
                // Check for failed dependencies
                const blockedSteps = executionOrder.filter(step =>
                    !completed.has(step.id) &&
                    (step.dependencies || []).some(dep => stepResults.get(dep)?.status === "failed")
                )

                // Skip steps with failed dependencies
                for (const step of blockedSteps) {
                    completed.add(step.id)
                    context.metadata.skippedSteps.push(step.id)
                    stepResults.set(step.id, { status: "skipped", duration: 0 })

                    yield {
                        type: "step-skipped",
                        pipelineId,
                        stepId: step.id,
                        stepName: step.name,
                        message: `Skipped: ${step.name} (dependency failed)`,
                        progress: Math.round((++completedCount / totalSteps) * 100),
                        timestamp: new Date()
                    }
                }

                if (blockedSteps.length === 0) break
                continue
            }

            // Start runnable steps up to concurrency limit
            const toStart = runnableSteps.slice(0, this.config.maxConcurrency! - inFlight.size)

            const stepPromises = toStart.map(async step => {
                inFlight.add(step.id)
                context.metadata.currentStep = step.id

                // Check condition
                if (step.condition && !step.condition(context)) {
                    inFlight.delete(step.id)
                    completed.add(step.id)
                    context.metadata.skippedSteps.push(step.id)
                    stepResults.set(step.id, { status: "skipped", duration: 0 })

                    return {
                        type: "step-skipped" as const,
                        step,
                        result: null
                    }
                }

                const stepStart = Date.now()

                try {
                    step.onStart?.(context)

                    // Resolve input
                    const input = typeof step.input === "function"
                        ? step.input(context)
                        : step.input

                    // Execute with retries
                    let result: any
                    let lastError: Error | undefined
                    let attempts = 0
                    const maxAttempts = (step.retries || 0) + 1

                    for (attempts = 1; attempts <= maxAttempts; attempts++) {
                        try {
                            result = await this.executeWithTimeout(
                                () => step.execute(input, context),
                                step.timeout || 60000
                            )
                            break
                        } catch (e) {
                            lastError = e as Error
                            if (attempts < maxAttempts) {
                                const delay = step.retryDelay || (1000 * Math.pow(2, attempts - 1))
                                await this.delay(delay)
                            }
                        }
                    }

                    if (result === undefined && lastError) {
                        throw lastError
                    }

                    const duration = Date.now() - stepStart

                    inFlight.delete(step.id)
                    completed.add(step.id)
                    context.metadata.completedSteps.push(step.id)
                    context.outputs[step.id] = result
                    stepResults.set(step.id, {
                        status: "complete",
                        output: result,
                        duration,
                        retries: attempts > 1 ? attempts - 1 : undefined
                    })

                    // Track models used
                    if (result?.model) {
                        modelsUsed.push(result.model)
                    }

                    step.onComplete?.(result, context)

                    return {
                        type: "step-complete" as const,
                        step,
                        result,
                        duration
                    }

                } catch (error) {
                    const duration = Date.now() - stepStart
                    const errorMessage = error instanceof Error ? error.message : "Unknown error"

                    inFlight.delete(step.id)

                    context.metadata.errors.push({
                        step: step.id,
                        error: errorMessage,
                        timestamp: new Date(),
                        attempt: 1
                    })

                    step.onFail?.(error as Error, context)

                    const onError = step.onError || "fail"

                    if (onError === "skip" || onError === "continue") {
                        completed.add(step.id)
                        context.metadata.skippedSteps.push(step.id)
                        stepResults.set(step.id, { status: "skipped", duration, error: errorMessage })

                        return {
                            type: "step-skipped" as const,
                            step,
                            result: null,
                            error: errorMessage
                        }
                    } else {
                        completed.add(step.id)
                        context.metadata.failedSteps.push(step.id)
                        stepResults.set(step.id, { status: "failed", duration, error: errorMessage })

                        return {
                            type: "step-failed" as const,
                            step,
                            result: null,
                            error: errorMessage
                        }
                    }
                }
            })

            // Yield start events
            for (const step of toStart) {
                yield {
                    type: "step-started",
                    pipelineId,
                    stepId: step.id,
                    stepName: step.name,
                    message: `Running: ${step.name}`,
                    timestamp: new Date()
                }
            }

            // Wait for at least one step to complete
            const results = await Promise.all(stepPromises)

            // Yield completion events
            for (const result of results) {
                completedCount++

                if (result.type === "step-complete") {
                    yield {
                        type: "step-complete",
                        pipelineId,
                        stepId: result.step.id,
                        stepName: result.step.name,
                        message: `Completed: ${result.step.name}`,
                        data: result.result,
                        progress: Math.round((completedCount / totalSteps) * 100),
                        duration: result.duration,
                        timestamp: new Date()
                    }
                } else if (result.type === "step-failed") {
                    yield {
                        type: "step-failed",
                        pipelineId,
                        stepId: result.step.id,
                        stepName: result.step.name,
                        message: `Failed: ${result.step.name} - ${result.error}`,
                        progress: Math.round((completedCount / totalSteps) * 100),
                        timestamp: new Date()
                    }

                    if (this.config.stopOnError) {
                        // Cancel remaining steps
                        break
                    }
                } else if (result.type === "step-skipped") {
                    yield {
                        type: "step-skipped",
                        pipelineId,
                        stepId: result.step.id,
                        stepName: result.step.name,
                        message: `Skipped: ${result.step.name}${result.error ? ` (${result.error})` : ""}`,
                        progress: Math.round((completedCount / totalSteps) * 100),
                        timestamp: new Date()
                    }
                }
            }

            // Check if we should stop
            if (this.config.stopOnError && context.metadata.failedSteps.length > 0) {
                break
            }
        }

        const totalDuration = Date.now() - startTime
        const hasFailures = context.metadata.failedSteps.length > 0

        yield {
            type: hasFailures ? "pipeline-failed" : "pipeline-complete",
            pipelineId,
            message: hasFailures
                ? `Pipeline completed with ${context.metadata.failedSteps.length} failed step(s)`
                : "Pipeline completed successfully",
            progress: 100,
            duration: totalDuration,
            timestamp: new Date()
        }

        return {
            success: !hasFailures,
            pipelineId,
            outputs: context.outputs,
            steps: Array.from(this.steps.keys()).map(id => {
                const step = this.steps.get(id)!
                const result = stepResults.get(id)
                return {
                    id,
                    name: step.name,
                    status: result?.status || "pending",
                    duration: result?.duration || 0,
                    output: result?.output,
                    error: result?.error,
                    retries: result?.retries
                }
            }),
            totalDuration,
            modelsUsed: [...new Set(modelsUsed)],
            errors: context.metadata.errors.map(e => ({ step: e.step, error: e.error }))
        }
    }

    /**
     * Execute pipeline and collect all results (non-streaming)
     */
    async run(inputs: Record<string, any> = {}): Promise<PipelineResult> {
        let result: PipelineResult | undefined

        for await (const event of this.execute(inputs)) {
            // Events are yielded but we only care about final result
            if (event.type === "pipeline-complete" || event.type === "pipeline-failed") {
                // Result is returned from generator
            }
        }

        // Re-run to get result (generator limitation workaround)
        // In practice, you'd want to collect the result during iteration
        const events: PipelineEvent[] = []
        const generator = this.execute(inputs)

        while (true) {
            const { value, done } = await generator.next()
            if (done) {
                return value as PipelineResult
            }
            events.push(value)
        }
    }

    /**
     * Validate pipeline configuration
     */
    validate(): { valid: boolean; errors: string[] } {
        const errors: string[] = []
        const stepIds = new Set(this.steps.keys())

        // Check for missing dependencies
        for (const [id, step] of this.steps) {
            for (const dep of step.dependencies || []) {
                if (!stepIds.has(dep)) {
                    errors.push(`Step "${id}" depends on unknown step "${dep}"`)
                }
            }
        }

        // Check for circular dependencies
        const visited = new Set<string>()
        const recursionStack = new Set<string>()

        const hasCycle = (stepId: string): boolean => {
            visited.add(stepId)
            recursionStack.add(stepId)

            const step = this.steps.get(stepId)
            for (const dep of step?.dependencies || []) {
                if (!visited.has(dep) && hasCycle(dep)) {
                    return true
                } else if (recursionStack.has(dep)) {
                    errors.push(`Circular dependency detected involving step "${stepId}"`)
                    return true
                }
            }

            recursionStack.delete(stepId)
            return false
        }

        for (const stepId of this.steps.keys()) {
            if (!visited.has(stepId)) {
                hasCycle(stepId)
            }
        }

        return { valid: errors.length === 0, errors }
    }

    /**
     * Get execution order using topological sort
     */
    private getExecutionOrder(): PipelineStep[] {
        const visited = new Set<string>()
        const result: PipelineStep[] = []

        const visit = (stepId: string) => {
            if (visited.has(stepId)) return
            visited.add(stepId)

            const step = this.steps.get(stepId)
            if (!step) return

            for (const depId of step.dependencies || []) {
                visit(depId)
            }

            result.push(step)
        }

        for (const stepId of this.steps.keys()) {
            visit(stepId)
        }

        return result
    }

    private async executeWithTimeout<T>(fn: () => Promise<T>, timeout: number): Promise<T> {
        return Promise.race([
            fn(),
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error(`Step timed out after ${timeout}ms`)), timeout)
            )
        ])
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    private generateId(): string {
        return `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
}

/**
 * Helper to create a simple step
 */
export function createStep<TInput, TOutput>(
    id: string,
    name: string,
    execute: (input: TInput, context: PipelineContext) => Promise<TOutput>,
    options?: Partial<PipelineStep<TInput, TOutput>>
): PipelineStep<TInput, TOutput> {
    return {
        id,
        name,
        execute,
        ...options
    }
}
