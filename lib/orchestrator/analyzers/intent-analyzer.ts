/**
 * Intent Analyzer
 * Analyzes user prompts to detect:
 * - Programming language preference
 * - Framework selection
 * - Database requirements
 * - API integrations needed
 * - Secret/credential requirements
 */

// Supported languages and their frameworks
export type Language = 'typescript' | 'python' | 'java' | 'go' | 'rust'

export interface FrameworkConfig {
    name: string
    language: Language
    type: 'backend' | 'frontend' | 'fullstack'
    package?: string
    description: string
}

export const FRAMEWORK_REGISTRY: Record<string, FrameworkConfig> = {
    // TypeScript/JavaScript
    'nextjs': { name: 'Next.js', language: 'typescript', type: 'fullstack', package: 'next', description: 'React framework with SSR' },
    'express': { name: 'Express', language: 'typescript', type: 'backend', package: 'express', description: 'Minimalist Node.js framework' },
    'nestjs': { name: 'NestJS', language: 'typescript', type: 'backend', package: '@nestjs/core', description: 'Enterprise Node.js framework' },
    'fastify': { name: 'Fastify', language: 'typescript', type: 'backend', package: 'fastify', description: 'High-performance Node.js' },

    // Python
    'fastapi': { name: 'FastAPI', language: 'python', type: 'backend', package: 'fastapi', description: 'Modern Python API framework' },
    'django': { name: 'Django', language: 'python', type: 'fullstack', package: 'django', description: 'Full-featured Python framework' },
    'flask': { name: 'Flask', language: 'python', type: 'backend', package: 'flask', description: 'Lightweight Python framework' },

    // Java
    'spring': { name: 'Spring Boot', language: 'java', type: 'backend', description: 'Enterprise Java framework' },
    'quarkus': { name: 'Quarkus', language: 'java', type: 'backend', description: 'Cloud-native Java' },
    'micronaut': { name: 'Micronaut', language: 'java', type: 'backend', description: 'Modern JVM framework' },

    // Go
    'gin': { name: 'Gin', language: 'go', type: 'backend', package: 'github.com/gin-gonic/gin', description: 'Fast Go HTTP framework' },
    'echo': { name: 'Echo', language: 'go', type: 'backend', package: 'github.com/labstack/echo', description: 'High-performance Go framework' },
    'fiber': { name: 'Fiber', language: 'go', type: 'backend', package: 'github.com/gofiber/fiber', description: 'Express-inspired Go framework' },

    // Rust
    'actix': { name: 'Actix Web', language: 'rust', type: 'backend', package: 'actix-web', description: 'Powerful Rust framework' },
    'axum': { name: 'Axum', language: 'rust', type: 'backend', package: 'axum', description: 'Ergonomic Rust framework' },
}

// Database types
export type DatabaseType = 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'sqlite' | 'supabase' | 'firebase'

export interface DatabaseConfig {
    name: string
    type: 'sql' | 'nosql' | 'cache' | 'baas'
    ormByLanguage: Partial<Record<Language, string>>
}

export const DATABASE_REGISTRY: Record<DatabaseType, DatabaseConfig> = {
    'postgresql': {
        name: 'PostgreSQL',
        type: 'sql',
        ormByLanguage: {
            typescript: 'prisma',
            python: 'sqlalchemy',
            java: 'hibernate',
            go: 'gorm',
            rust: 'diesel'
        }
    },
    'mysql': {
        name: 'MySQL',
        type: 'sql',
        ormByLanguage: {
            typescript: 'prisma',
            python: 'sqlalchemy',
            java: 'hibernate',
            go: 'gorm',
            rust: 'diesel'
        }
    },
    'mongodb': {
        name: 'MongoDB',
        type: 'nosql',
        ormByLanguage: {
            typescript: 'mongoose',
            python: 'pymongo',
            java: 'spring-data-mongodb',
            go: 'mongo-go-driver',
            rust: 'mongodb'
        }
    },
    'redis': {
        name: 'Redis',
        type: 'cache',
        ormByLanguage: {
            typescript: 'ioredis',
            python: 'redis-py',
            java: 'jedis',
            go: 'go-redis',
            rust: 'redis-rs'
        }
    },
    'sqlite': {
        name: 'SQLite',
        type: 'sql',
        ormByLanguage: {
            typescript: 'better-sqlite3',
            python: 'sqlite3',
            java: 'sqlite-jdbc',
            go: 'go-sqlite3',
            rust: 'rusqlite'
        }
    },
    'supabase': {
        name: 'Supabase',
        type: 'baas',
        ormByLanguage: {
            typescript: '@supabase/supabase-js',
            python: 'supabase',
            java: 'postgrest-java',
            go: 'supabase-go',
            rust: 'postgrest-rs'
        }
    },
    'firebase': {
        name: 'Firebase',
        type: 'baas',
        ormByLanguage: {
            typescript: 'firebase',
            python: 'firebase-admin',
            java: 'firebase-admin',
            go: 'firebase.google.com/go',
            rust: 'firebase-rs'
        }
    }
}

// API Integration types
export type APICategory = 'payment' | 'ai' | 'auth' | 'email' | 'sms' | 'storage' | 'maps' | 'analytics' | 'voice'

export interface APIIntegration {
    name: string
    category: APICategory
    secretsNeeded: string[]
    sdkByLanguage: Partial<Record<Language, string>>
    webhookSupport: boolean
    docsUrl: string
}

export const API_REGISTRY: Record<string, APIIntegration> = {
    // Payments
    'stripe': {
        name: 'Stripe',
        category: 'payment',
        secretsNeeded: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'],
        sdkByLanguage: {
            typescript: 'stripe',
            python: 'stripe',
            java: 'com.stripe:stripe-java',
            go: 'github.com/stripe/stripe-go',
            rust: 'stripe-rust'
        },
        webhookSupport: true,
        docsUrl: 'https://stripe.com/docs/api'
    },
    'paypal': {
        name: 'PayPal',
        category: 'payment',
        secretsNeeded: ['PAYPAL_CLIENT_ID', 'PAYPAL_SECRET'],
        sdkByLanguage: {
            typescript: '@paypal/checkout-server-sdk',
            python: 'paypalrestsdk',
            java: 'com.paypal.sdk:checkout-sdk',
            go: 'github.com/plutov/paypal'
        },
        webhookSupport: true,
        docsUrl: 'https://developer.paypal.com/docs/api'
    },
    'razorpay': {
        name: 'Razorpay',
        category: 'payment',
        secretsNeeded: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'],
        sdkByLanguage: {
            typescript: 'razorpay',
            python: 'razorpay',
            java: 'com.razorpay:razorpay-java',
            go: 'github.com/razorpay/razorpay-go'
        },
        webhookSupport: true,
        docsUrl: 'https://razorpay.com/docs/api'
    },

    // AI/ML
    'openai': {
        name: 'OpenAI',
        category: 'ai',
        secretsNeeded: ['OPENAI_API_KEY'],
        sdkByLanguage: {
            typescript: 'openai',
            python: 'openai',
            java: 'com.theokanning.openai-gpt3-java:service',
            go: 'github.com/sashabaranov/go-openai',
            rust: 'openai-api-rs'
        },
        webhookSupport: false,
        docsUrl: 'https://platform.openai.com/docs/api-reference'
    },
    'anthropic': {
        name: 'Anthropic Claude',
        category: 'ai',
        secretsNeeded: ['ANTHROPIC_API_KEY'],
        sdkByLanguage: {
            typescript: '@anthropic-ai/sdk',
            python: 'anthropic',
            go: 'github.com/anthropics/anthropic-sdk-go'
        },
        webhookSupport: false,
        docsUrl: 'https://docs.anthropic.com/en/api'
    },
    'google-ai': {
        name: 'Google AI (Gemini)',
        category: 'ai',
        secretsNeeded: ['GOOGLE_AI_API_KEY'],
        sdkByLanguage: {
            typescript: '@google/generative-ai',
            python: 'google-generativeai',
            java: 'com.google.cloud:google-cloud-aiplatform',
            go: 'github.com/google/generative-ai-go'
        },
        webhookSupport: false,
        docsUrl: 'https://ai.google.dev/docs'
    },
    'replicate': {
        name: 'Replicate',
        category: 'ai',
        secretsNeeded: ['REPLICATE_API_TOKEN'],
        sdkByLanguage: {
            typescript: 'replicate',
            python: 'replicate',
            go: 'github.com/replicate/replicate-go'
        },
        webhookSupport: true,
        docsUrl: 'https://replicate.com/docs'
    },

    // Auth
    'auth0': {
        name: 'Auth0',
        category: 'auth',
        secretsNeeded: ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET'],
        sdkByLanguage: {
            typescript: '@auth0/nextjs-auth0',
            python: 'authlib',
            java: 'com.auth0:auth0',
            go: 'github.com/auth0/go-auth0'
        },
        webhookSupport: true,
        docsUrl: 'https://auth0.com/docs'
    },
    'clerk': {
        name: 'Clerk',
        category: 'auth',
        secretsNeeded: ['CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
        sdkByLanguage: {
            typescript: '@clerk/nextjs',
            python: 'clerk-sdk-python',
            go: 'github.com/clerkinc/clerk-sdk-go'
        },
        webhookSupport: true,
        docsUrl: 'https://clerk.com/docs'
    },
    'supabase-auth': {
        name: 'Supabase Auth',
        category: 'auth',
        secretsNeeded: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
        sdkByLanguage: {
            typescript: '@supabase/supabase-js',
            python: 'supabase',
            go: 'github.com/supabase-community/supabase-go'
        },
        webhookSupport: true,
        docsUrl: 'https://supabase.com/docs/guides/auth'
    },

    // Email
    'sendgrid': {
        name: 'SendGrid',
        category: 'email',
        secretsNeeded: ['SENDGRID_API_KEY'],
        sdkByLanguage: {
            typescript: '@sendgrid/mail',
            python: 'sendgrid',
            java: 'com.sendgrid:sendgrid-java',
            go: 'github.com/sendgrid/sendgrid-go',
            rust: 'sendgrid'
        },
        webhookSupport: true,
        docsUrl: 'https://docs.sendgrid.com/api-reference'
    },
    'resend': {
        name: 'Resend',
        category: 'email',
        secretsNeeded: ['RESEND_API_KEY'],
        sdkByLanguage: {
            typescript: 'resend',
            python: 'resend',
            go: 'github.com/resendlabs/resend-go'
        },
        webhookSupport: true,
        docsUrl: 'https://resend.com/docs'
    },
    'postmark': {
        name: 'Postmark',
        category: 'email',
        secretsNeeded: ['POSTMARK_API_TOKEN'],
        sdkByLanguage: {
            typescript: 'postmark',
            python: 'postmarker',
            java: 'com.postmarkapp:postmark',
            go: 'github.com/keighl/postmark'
        },
        webhookSupport: true,
        docsUrl: 'https://postmarkapp.com/developer'
    },

    // SMS
    'twilio': {
        name: 'Twilio',
        category: 'sms',
        secretsNeeded: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
        sdkByLanguage: {
            typescript: 'twilio',
            python: 'twilio',
            java: 'com.twilio.sdk:twilio',
            go: 'github.com/twilio/twilio-go',
            rust: 'twilio-rs'
        },
        webhookSupport: true,
        docsUrl: 'https://www.twilio.com/docs/usage/api'
    },
    'messagebird': {
        name: 'MessageBird',
        category: 'sms',
        secretsNeeded: ['MESSAGEBIRD_API_KEY'],
        sdkByLanguage: {
            typescript: 'messagebird',
            python: 'messagebird',
            java: 'com.messagebird:messagebird-api',
            go: 'github.com/messagebird/go-rest-api'
        },
        webhookSupport: true,
        docsUrl: 'https://developers.messagebird.com/api/'
    },

    // Voice
    'elevenlabs': {
        name: 'ElevenLabs',
        category: 'voice',
        secretsNeeded: ['ELEVENLABS_API_KEY'],
        sdkByLanguage: {
            typescript: 'elevenlabs',
            python: 'elevenlabs'
        },
        webhookSupport: false,
        docsUrl: 'https://docs.elevenlabs.io/api-reference'
    },
    'deepgram': {
        name: 'Deepgram',
        category: 'voice',
        secretsNeeded: ['DEEPGRAM_API_KEY'],
        sdkByLanguage: {
            typescript: '@deepgram/sdk',
            python: 'deepgram-sdk',
            go: 'github.com/deepgram/deepgram-go-sdk'
        },
        webhookSupport: true,
        docsUrl: 'https://developers.deepgram.com/'
    },

    // Storage
    'aws-s3': {
        name: 'AWS S3',
        category: 'storage',
        secretsNeeded: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'],
        sdkByLanguage: {
            typescript: '@aws-sdk/client-s3',
            python: 'boto3',
            java: 'software.amazon.awssdk:s3',
            go: 'github.com/aws/aws-sdk-go-v2/service/s3',
            rust: 'aws-sdk-s3'
        },
        webhookSupport: false,
        docsUrl: 'https://docs.aws.amazon.com/s3/'
    },
    'cloudflare-r2': {
        name: 'Cloudflare R2',
        category: 'storage',
        secretsNeeded: ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_ENDPOINT'],
        sdkByLanguage: {
            typescript: '@aws-sdk/client-s3', // S3-compatible
            python: 'boto3',
            go: 'github.com/aws/aws-sdk-go-v2/service/s3'
        },
        webhookSupport: false,
        docsUrl: 'https://developers.cloudflare.com/r2/'
    },

    // Maps
    'google-maps': {
        name: 'Google Maps',
        category: 'maps',
        secretsNeeded: ['GOOGLE_MAPS_API_KEY'],
        sdkByLanguage: {
            typescript: '@googlemaps/google-maps-services-js',
            python: 'googlemaps',
            java: 'com.google.maps:google-maps-services',
            go: 'googlemaps.github.io/maps'
        },
        webhookSupport: false,
        docsUrl: 'https://developers.google.com/maps/documentation'
    },
    'mapbox': {
        name: 'Mapbox',
        category: 'maps',
        secretsNeeded: ['MAPBOX_ACCESS_TOKEN'],
        sdkByLanguage: {
            typescript: '@mapbox/mapbox-sdk',
            python: 'mapbox',
            java: 'com.mapbox.mapboxsdk:mapbox-java'
        },
        webhookSupport: false,
        docsUrl: 'https://docs.mapbox.com/'
    },

    // Analytics
    'mixpanel': {
        name: 'Mixpanel',
        category: 'analytics',
        secretsNeeded: ['MIXPANEL_TOKEN', 'MIXPANEL_SECRET'],
        sdkByLanguage: {
            typescript: 'mixpanel',
            python: 'mixpanel',
            java: 'com.mixpanel:mixpanel-java',
            go: 'github.com/mixpanel/mixpanel-go'
        },
        webhookSupport: false,
        docsUrl: 'https://developer.mixpanel.com/'
    },
    'posthog': {
        name: 'PostHog',
        category: 'analytics',
        secretsNeeded: ['POSTHOG_API_KEY', 'POSTHOG_HOST'],
        sdkByLanguage: {
            typescript: 'posthog-node',
            python: 'posthog',
            java: 'com.posthog.java:posthog',
            go: 'github.com/posthog/posthog-go'
        },
        webhookSupport: true,
        docsUrl: 'https://posthog.com/docs/api'
    }
}

// Detected feature types
export type FeatureType =
    | 'authentication'
    | 'payments'
    | 'subscriptions'
    | 'email'
    | 'sms'
    | 'voice'
    | 'file-upload'
    | 'real-time'
    | 'search'
    | 'analytics'
    | 'admin-dashboard'
    | 'api'
    | 'webhooks'
    | 'cron-jobs'

// Analysis result
export interface DetectedIntent {
    language: Language
    framework: string
    database: DatabaseType
    apis: string[]  // Keys from API_REGISTRY
    features: FeatureType[]
    secretsNeeded: string[]
    confidence: number  // 0-1
}

// Detection patterns
const LANGUAGE_PATTERNS: Record<Language, RegExp[]> = {
    python: [
        /\bpython\b/i,
        /\bfastapi\b/i,
        /\bdjango\b/i,
        /\bflask\b/i,
        /\bpydantic\b/i,
        /\bsqlalchemy\b/i
    ],
    java: [
        /\bjava\b/i,
        /\bspring\s*boot\b/i,
        /\bquarkus\b/i,
        /\bmicronaut\b/i,
        /\bhibernate\b/i,
        /\bjpa\b/i,
        /\bkotlin\b/i
    ],
    go: [
        /\bgolang\b/i,
        /\bgo\s+(backend|api|server)\b/i,
        /\bgin\b/i,
        /\becho\b/i,
        /\bfiber\b/i,
        /\bgorm\b/i
    ],
    rust: [
        /\brust\b/i,
        /\bactix\b/i,
        /\baxum\b/i,
        /\btokio\b/i
    ],
    typescript: [
        /\btypescript\b/i,
        /\bnext\.?js\b/i,
        /\bnode\.?js\b/i,
        /\bexpress\b/i,
        /\bnestjs\b/i,
        /\bprisma\b/i
    ]
}

const DATABASE_PATTERNS: Record<DatabaseType, RegExp[]> = {
    postgresql: [/\bpostgres(ql)?\b/i, /\bpg\b/i, /\bsupabase\b/i],
    mysql: [/\bmysql\b/i, /\bmariadb\b/i, /\bplanetscale\b/i],
    mongodb: [/\bmongo(db)?\b/i, /\bnosql\b/i],
    redis: [/\bredis\b/i, /\bcache\b/i, /\bupstash\b/i],
    sqlite: [/\bsqlite\b/i, /\bturso\b/i, /\blibsql\b/i],
    supabase: [/\bsupabase\b/i],
    firebase: [/\bfirebase\b/i, /\bfirestore\b/i]
}

const API_PATTERNS: Record<string, RegExp[]> = {
    // Payments
    'stripe': [/\bstripe\b/i, /\bpayment[s]?\b/i, /\bsubscription[s]?\b/i, /\bcheckout\b/i],
    'paypal': [/\bpaypal\b/i],
    'razorpay': [/\brazorpay\b/i],

    // AI
    'openai': [/\bopenai\b/i, /\bgpt\b/i, /\bchatgpt\b/i, /\bdall-?e\b/i, /\bwhisper\b/i],
    'anthropic': [/\banthropic\b/i, /\bclaude\b/i],
    'google-ai': [/\bgemini\b/i, /\bgoogle\s*ai\b/i, /\bvertex\b/i],
    'replicate': [/\breplicate\b/i, /\bstability\b/i, /\bimage\s*generation\b/i],

    // Auth
    'auth0': [/\bauth0\b/i],
    'clerk': [/\bclerk\b/i],
    'supabase-auth': [/\bsupabase\s*auth\b/i],

    // Email
    'sendgrid': [/\bsendgrid\b/i],
    'resend': [/\bresend\b/i],
    'postmark': [/\bpostmark\b/i],

    // SMS/Voice
    'twilio': [/\btwilio\b/i, /\bsms\b/i, /\bwhatsapp\b/i],
    'elevenlabs': [/\belevenlabs\b/i, /\btext[\s-]*to[\s-]*speech\b/i, /\btts\b/i],
    'deepgram': [/\bdeepgram\b/i, /\bspeech[\s-]*to[\s-]*text\b/i, /\btranscri(be|ption)\b/i],

    // Storage
    'aws-s3': [/\bs3\b/i, /\baws\b/i, /\bfile\s*upload\b/i],
    'cloudflare-r2': [/\br2\b/i, /\bcloudflare\s*storage\b/i],

    // Maps
    'google-maps': [/\bgoogle\s*maps?\b/i, /\bgeolocation\b/i, /\bplaces?\s*api\b/i],
    'mapbox': [/\bmapbox\b/i],

    // Analytics
    'mixpanel': [/\bmixpanel\b/i],
    'posthog': [/\bposthog\b/i, /\bproduct\s*analytics\b/i]
}

const FEATURE_PATTERNS: Record<FeatureType, RegExp[]> = {
    'authentication': [/\bauth(entication)?\b/i, /\blogin\b/i, /\bsign[\s-]?(up|in)\b/i, /\bsso\b/i, /\boauth\b/i],
    'payments': [/\bpayment[s]?\b/i, /\bcheckout\b/i, /\bbilling\b/i],
    'subscriptions': [/\bsubscription[s]?\b/i, /\brecurring\b/i, /\bsaas\b/i, /\bmembership\b/i],
    'email': [/\bemail\b/i, /\bnotification[s]?\b/i, /\bnewsletter\b/i],
    'sms': [/\bsms\b/i, /\btext\s*message\b/i, /\bwhatsapp\b/i],
    'voice': [/\bvoice\b/i, /\btts\b/i, /\bstt\b/i, /\bspeech\b/i, /\baudio\b/i],
    'file-upload': [/\bfile[\s-]*upload\b/i, /\bimage[\s-]*upload\b/i, /\bmedia\b/i],
    'real-time': [/\breal[\s-]*time\b/i, /\bwebsocket[s]?\b/i, /\blive\b/i, /\bchat\b/i],
    'search': [/\bsearch\b/i, /\bfull[\s-]*text\b/i, /\belgasticsearch\b/i, /\balgolia\b/i],
    'analytics': [/\banalytics\b/i, /\btracking\b/i, /\bmetrics\b/i, /\bdashboard\b/i],
    'admin-dashboard': [/\badmin\b/i, /\bbackoffice\b/i, /\bmanagement\b/i],
    'api': [/\bapi\b/i, /\brest\b/i, /\bgraphql\b/i, /\bendpoint[s]?\b/i],
    'webhooks': [/\bwebhook[s]?\b/i, /\bcallback[s]?\b/i],
    'cron-jobs': [/\bcron\b/i, /\bscheduled?\b/i, /\bbackground\s*job[s]?\b/i]
}

// Secret detection patterns (for warning users not to hardcode)
const SECRET_PATTERNS: RegExp[] = [
    /sk_live_[A-Za-z0-9]+/,  // Stripe live key
    /sk_test_[A-Za-z0-9]+/,  // Stripe test key
    /pk_live_[A-Za-z0-9]+/,  // Stripe publishable key
    /sk-[A-Za-z0-9]+/,       // OpenAI key
    /AIza[A-Za-z0-9]+/,      // Google API key
    /SG\.[A-Za-z0-9]+/,      // SendGrid key
    /AC[a-f0-9]{32}/,        // Twilio Account SID
    /[a-f0-9]{32}/,          // Generic 32-char hex (potential API key)
]

/**
 * Analyze user prompt to detect intent
 */
export function analyzeIntent(prompt: string): DetectedIntent {
    // Detect language
    const language = detectLanguage(prompt)

    // Detect framework
    const framework = detectFramework(prompt, language)

    // Detect database
    const database = detectDatabase(prompt)

    // Detect APIs
    const apis = detectAPIs(prompt)

    // Detect features
    const features = detectFeatures(prompt)

    // Collect required secrets
    const secretsNeeded = collectSecretsNeeded(apis)

    // Calculate confidence
    const confidence = calculateConfidence(prompt, language, framework, apis)

    return {
        language,
        framework,
        database,
        apis,
        features,
        secretsNeeded,
        confidence
    }
}

function detectLanguage(prompt: string): Language {
    const scores: Record<Language, number> = {
        typescript: 0,
        python: 0,
        java: 0,
        go: 0,
        rust: 0
    }

    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(prompt)) {
                scores[lang as Language] += 1
            }
        }
    }

    // Default to TypeScript if no strong signal
    const maxScore = Math.max(...Object.values(scores))
    if (maxScore === 0) {
        return 'typescript'
    }

    return Object.entries(scores).find(([, score]) => score === maxScore)?.[0] as Language || 'typescript'
}

function detectFramework(prompt: string, language: Language): string {
    const frameworksByLanguage = Object.entries(FRAMEWORK_REGISTRY)
        .filter(([, config]) => config.language === language)
        .map(([key]) => key)

    for (const framework of frameworksByLanguage) {
        const pattern = new RegExp(`\\b${framework}\\b`, 'i')
        if (pattern.test(prompt)) {
            return framework
        }
    }

    // Default frameworks by language
    const defaults: Record<Language, string> = {
        typescript: 'nextjs',
        python: 'fastapi',
        java: 'spring',
        go: 'gin',
        rust: 'axum'
    }

    return defaults[language]
}

function detectDatabase(prompt: string): DatabaseType {
    for (const [db, patterns] of Object.entries(DATABASE_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(prompt)) {
                return db as DatabaseType
            }
        }
    }
    return 'postgresql' // Default
}

function detectAPIs(prompt: string): string[] {
    const apis: string[] = []

    for (const [api, patterns] of Object.entries(API_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(prompt)) {
                if (!apis.includes(api)) {
                    apis.push(api)
                }
                break
            }
        }
    }

    return apis
}

function detectFeatures(prompt: string): FeatureType[] {
    const features: FeatureType[] = []

    for (const [feature, patterns] of Object.entries(FEATURE_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(prompt)) {
                if (!features.includes(feature as FeatureType)) {
                    features.push(feature as FeatureType)
                }
                break
            }
        }
    }

    return features
}

function collectSecretsNeeded(apis: string[]): string[] {
    const secrets: string[] = []

    for (const api of apis) {
        const config = API_REGISTRY[api]
        if (config) {
            for (const secret of config.secretsNeeded) {
                if (!secrets.includes(secret)) {
                    secrets.push(secret)
                }
            }
        }
    }

    return secrets
}

function calculateConfidence(prompt: string, language: Language, framework: string, apis: string[]): number {
    let confidence = 0.5 // Base

    // Higher confidence if explicit language mentioned
    for (const pattern of LANGUAGE_PATTERNS[language]) {
        if (pattern.test(prompt)) {
            confidence += 0.1
            break
        }
    }

    // Higher confidence if framework mentioned
    if (new RegExp(`\\b${framework}\\b`, 'i').test(prompt)) {
        confidence += 0.1
    }

    // Higher confidence if specific APIs mentioned
    if (apis.length > 0) {
        confidence += 0.1
    }

    // Longer, more detailed prompts = higher confidence
    if (prompt.length > 200) {
        confidence += 0.1
    }

    return Math.min(confidence, 1.0)
}

/**
 * Check if prompt contains hardcoded secrets
 */
export function detectHardcodedSecrets(prompt: string): string[] {
    const found: string[] = []

    for (const pattern of SECRET_PATTERNS) {
        const match = prompt.match(pattern)
        if (match) {
            found.push(match[0])
        }
    }

    return found
}

/**
 * Get human-readable summary of detected intent
 */
export function summarizeIntent(intent: DetectedIntent): string {
    const lines: string[] = []

    const framework = FRAMEWORK_REGISTRY[intent.framework]
    lines.push(`📦 **Stack**: ${framework?.name || intent.framework} (${intent.language.toUpperCase()})`)

    const db = DATABASE_REGISTRY[intent.database]
    lines.push(`🗄️ **Database**: ${db?.name || intent.database}`)

    if (intent.apis.length > 0) {
        const apiNames = intent.apis.map(api => API_REGISTRY[api]?.name || api).join(', ')
        lines.push(`🔌 **Integrations**: ${apiNames}`)
    }

    if (intent.features.length > 0) {
        lines.push(`✨ **Features**: ${intent.features.join(', ')}`)
    }

    if (intent.secretsNeeded.length > 0) {
        lines.push(`🔐 **Secrets needed**: ${intent.secretsNeeded.length}`)
    }

    lines.push(`📊 **Confidence**: ${Math.round(intent.confidence * 100)}%`)

    return lines.join('\n')
}
