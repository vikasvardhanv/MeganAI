/**
 * ZenForge Orchestrator
 * Core exports for the intelligent content management orchestration system
 */

// ============ Main Orchestrator ============
export {
    CMOrchestrator,
    createCMOrchestrator,
    createBlogPost,
    createProductDescription,
    type CMConfig,
    type ContentOptions,
    type ContentOutput,
    type AnalysisOutput,
    type OptimizationOutput
} from "./cm-orchestrator"

// ============ Pipeline Engine ============
export {
    Pipeline,
    createStep,
    type PipelineStep,
    type PipelineContext,
    type PipelineEvent,
    type PipelineResult,
    type PipelineConfig,
    type StepStatus
} from "./pipeline"

// ============ Agents ============
export {
    ContentWriterAgent,
    type ContentSpec,
    type ContentResult,
    type RewriteOptions
} from "./agents/content-writer"

export {
    SEOAgent,
    type SEOAnalysis,
    type SEOOptimization,
    type SEOIssue,
    type KeywordAnalysis,
    type SchemaMarkup
} from "./agents/seo-agent"

export {
    NLPAgent,
    type Entity,
    type TagResult,
    type SentimentResult,
    type KeywordResult,
    type ClassificationResult,
    type SimilarityResult
} from "./agents/nlp-agent"

export {
    QualityReviewerAgent,
    type QualityReview,
    type QualityIssue,
    type FactCheckResult,
    type ImprovementResult,
    type BrandComplianceResult
} from "./agents/quality-reviewer"

// ============ Usage Tracking ============
export {
    UsageTracker,
    createUsageTracker,
    type UsageRecord,
    type UsageSummary,
    type ModelUsage,
    type TaskUsage,
    type DayUsage,
    type UsageTrackerConfig
} from "./usage-tracker"

// ============ Existing Exports ============
export { AppOrchestrator, type Task, type Artifact, type ProgressEvent } from "./core"
export { ArchitectAgent, type ArchitectPlan } from "./agents/architect"
export { BackendAgent } from "./agents/backend"
export { UIAgent } from "./agents/ui"
