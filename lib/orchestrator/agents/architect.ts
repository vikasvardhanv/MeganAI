/**
 * Architect Agent - Enhanced Version
 * Uses Claude Opus for high-level app architecture and planning
 * Inspired by Lovable's "hydration pattern" - generates scaffold first, then details
 */

import { ModelRouter } from "../../ai/router"
import type { Artifact } from "../core"

export interface ArchitectPlan {
    appName: string
    appStructure: string
    components: ComponentSpec[]
    routes: RouteSpec[]
    dataModels: DataModelSpec[]
    techStack: Record<string, string>
    features: string[]
}

export interface ComponentSpec {
    name: string
    path: string
    description: string
    props?: string[]
    clientSide?: boolean
}

export interface RouteSpec {
    path: string
    component: string
    description: string
    isProtected?: boolean
}

export interface DataModelSpec {
    name: string
    fields: { name: string; type: string; required?: boolean }[]
    relations?: { model: string; type: string }[]
}

export class ArchitectAgent {
    private router: ModelRouter

    constructor(apiKeys: Record<string, string>) {
        this.router = new ModelRouter(apiKeys)
    }

    async analyze(userPrompt: string): Promise<{ plan: ArchitectPlan; artifacts: Artifact[] }> {
        const systemPrompt = `You are an expert software architect specializing in modern web applications with Next.js 14.

TASK: Analyze the user's request and create a COMPREHENSIVE technical plan.

OUTPUT FORMAT - Return ONLY valid JSON (no markdown, no explanation):
{
  "appName": "MyApp",
  "appStructure": "Brief description of the overall architecture",
  "features": ["Feature 1", "Feature 2"],
  "components": [
    {"name": "Header", "path": "components/header.tsx", "description": "Navigation header", "clientSide": true},
    {"name": "Dashboard", "path": "components/dashboard.tsx", "description": "Main dashboard view"}
  ],
  "routes": [
    {"path": "/", "component": "HomePage", "description": "Landing page"},
    {"path": "/dashboard", "component": "Dashboard", "description": "User dashboard", "isProtected": true}
  ],
  "dataModels": [
    {"name": "User", "fields": [{"name": "id", "type": "String", "required": true}, {"name": "email", "type": "String", "required": true}], "relations": []}
  ],
  "techStack": {
    "frontend": "Next.js 14 + TypeScript",
    "backend": "Next.js API Routes",
    "database": "Prisma + PostgreSQL",
    "styling": "Tailwind CSS",
    "auth": "NextAuth.js"
  }
}

IMPORTANT:
- Generate AT LEAST 3-5 components
- Generate AT LEAST 2-3 routes
- Generate AT LEAST 1-2 data models
- Be SPECIFIC to what the user is asking for
- Include actual implementation details, not generic placeholders`

        const result = await this.router.route(
            "architecture-planning",
            `${systemPrompt}\n\nUSER REQUEST: "${userPrompt}"\n\nRespond with ONLY the JSON object:`
        )

        // Parse the plan
        const plan = this.parsePlan(result.response, userPrompt)

        // Generate initial scaffold artifacts (hydration pattern - quick scaffolding)
        const artifacts: Artifact[] = [
            this.generateArchitectureDoc(plan, userPrompt),
            this.generatePackageJson(plan),
            this.generateTailwindConfig(plan),
            this.generateEnvExample(plan),
            this.generateLayoutFile(plan),
            this.generateHomePage(plan),
            ...this.generateInitialPages(plan)
        ]

        return { plan, artifacts }
    }

    private parsePlan(response: string, userPrompt: string): ArchitectPlan {
        try {
            // Try to extract JSON from the response
            let jsonStr = response.trim()

            // Remove markdown code blocks if present
            const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim()
            }

            // Find JSON object boundaries
            const jsonStart = jsonStr.indexOf('{')
            const jsonEnd = jsonStr.lastIndexOf('}')
            if (jsonStart !== -1 && jsonEnd !== -1) {
                jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1)
            }

            const parsed = JSON.parse(jsonStr)

            // Validate and normalize the plan
            return {
                appName: parsed.appName || this.generateAppName(userPrompt),
                appStructure: parsed.appStructure || "Full-stack web application",
                features: parsed.features || [],
                components: this.normalizeComponents(parsed.components || []),
                routes: this.normalizeRoutes(parsed.routes || []),
                dataModels: this.normalizeDataModels(parsed.dataModels || []),
                techStack: parsed.techStack || this.getDefaultTechStack()
            }
        } catch (error) {
            console.error("[ArchitectAgent] Failed to parse plan:", error)
            return this.createFallbackPlan(userPrompt)
        }
    }

    private normalizeComponents(components: any[]): ComponentSpec[] {
        return components.map((c, i) => ({
            name: c.name || `Component${i + 1}`,
            path: c.path || `components/${(c.name || `component-${i}`).toLowerCase().replace(/\s+/g, '-')}.tsx`,
            description: c.description || "",
            props: c.props || [],
            clientSide: c.clientSide || false
        }))
    }

    private normalizeRoutes(routes: any[]): RouteSpec[] {
        return routes.map((r, i) => ({
            path: r.path || `/${i > 0 ? `page-${i}` : ''}`,
            component: r.component || `Page${i + 1}`,
            description: r.description || "",
            isProtected: r.isProtected || false
        }))
    }

    private normalizeDataModels(models: any[]): DataModelSpec[] {
        return models.map(m => ({
            name: m.name || "Model",
            fields: (m.fields || []).map((f: any) => ({
                name: f.name || "field",
                type: f.type || "String",
                required: f.required ?? true
            })),
            relations: m.relations || []
        }))
    }

    private generateAppName(prompt: string): string {
        const words = prompt.split(' ').slice(0, 2).map(w =>
            w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        return words.join('') + 'App'
    }

    private getDefaultTechStack() {
        return {
            frontend: "Next.js 14 + TypeScript",
            backend: "Next.js API Routes",
            database: "Prisma + PostgreSQL",
            styling: "Tailwind CSS",
            auth: "NextAuth.js"
        }
    }

    private createFallbackPlan(prompt: string): ArchitectPlan {
        return {
            appName: this.generateAppName(prompt),
            appStructure: `Web application for: ${prompt}`,
            features: [prompt],
            components: [
                { name: "Header", path: "components/header.tsx", description: "Navigation header", clientSide: true },
                { name: "Footer", path: "components/footer.tsx", description: "Footer component" },
                { name: "Dashboard", path: "components/dashboard.tsx", description: "Main dashboard", clientSide: true }
            ],
            routes: [
                { path: "/", component: "HomePage", description: "Landing page" },
                { path: "/dashboard", component: "Dashboard", description: "Main dashboard", isProtected: true }
            ],
            dataModels: [
                {
                    name: "User", fields: [
                        { name: "id", type: "String", required: true },
                        { name: "email", type: "String", required: true },
                        { name: "name", type: "String", required: false }
                    ], relations: []
                }
            ],
            techStack: this.getDefaultTechStack()
        }
    }

    private generateArchitectureDoc(plan: ArchitectPlan, userPrompt: string): Artifact {
        return {
            type: "file",
            path: "ARCHITECTURE.md",
            content: `# ${plan.appName} - Architecture Document

## User Requirements
${userPrompt}

## Overview
${plan.appStructure}

## Features
${plan.features.map(f => `- ${f}`).join('\n')}

## Tech Stack
${Object.entries(plan.techStack).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}

## Components
${plan.components.map(c => `- \`${c.path}\` - ${c.description}`).join('\n')}

## Routes
${plan.routes.map(r => `- \`${r.path}\` → ${r.component} ${r.isProtected ? '(Protected)' : ''}`).join('\n')}

## Data Models
${plan.dataModels.map(m => `### ${m.name}\n${m.fields.map(f => `- ${f.name}: ${f.type}${f.required ? ' (required)' : ''}`).join('\n')}`).join('\n\n')}

---
*Generated by MeganAi Architect Agent*
`,
            language: "markdown"
        }
    }

    private generatePackageJson(plan: ArchitectPlan): Artifact {
        const packageJson = {
            name: plan.appName.toLowerCase().replace(/\s+/g, '-'),
            version: "0.1.0",
            private: true,
            scripts: {
                dev: "next dev",
                build: "next build",
                start: "next start",
                lint: "next lint",
                "db:push": "prisma db push",
                "db:generate": "prisma generate"
            },
            dependencies: {
                "next": "14.0.0",
                "react": "^18",
                "react-dom": "^18",
                "@prisma/client": "^5.7.0",
                "next-auth": "^4.24.0",
                "tailwindcss": "^3.4.0",
                "typescript": "^5",
                "zod": "^3.22.0"
            },
            devDependencies: {
                "@types/node": "^20",
                "@types/react": "^18",
                "@types/react-dom": "^18",
                "autoprefixer": "^10",
                "postcss": "^8",
                "prisma": "^5.7.0"
            }
        }

        return {
            type: "config",
            path: "package.json",
            content: JSON.stringify(packageJson, null, 2),
            language: "json"
        }
    }

    private generateTailwindConfig(plan: ArchitectPlan): Artifact {
        return {
            type: "config",
            path: "tailwind.config.ts",
            content: `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
}
export default config
`,
            language: "typescript"
        }
    }

    private generateEnvExample(plan: ArchitectPlan): Artifact {
        return {
            type: "config",
            path: ".env.example",
            content: `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/${plan.appName.toLowerCase()}"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# API Keys (add as needed)
# OPENAI_API_KEY=""
`,
            language: "plaintext"
        }
    }

    private generateLayoutFile(plan: ArchitectPlan): Artifact {
        return {
            type: "code",
            path: "app/layout.tsx",
            content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${plan.appName}',
  description: '${plan.appStructure}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          {children}
        </main>
      </body>
    </html>
  )
}
`,
            language: "typescript"
        }
    }

    private generateHomePage(plan: ArchitectPlan): Artifact {
        return {
            type: "code",
            path: "app/page.tsx",
            content: `/**
 * ${plan.appName} - Home Page
 * ${plan.appStructure}
 */

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          ${plan.appName}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          ${plan.appStructure}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          ${plan.features.slice(0, 3).map((feature, i) => `
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              ${feature}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Discover how ${feature.toLowerCase()} enhances your experience.
            </p>
          </div>`).join('\n')}
        </div>
        
        <div className="mt-12 flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Get Started
          </a>
          <a
            href="#features"
            className="px-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>
    </div>
  )
}
`,
            language: "typescript"
        }
    }

    private generateInitialPages(plan: ArchitectPlan): Artifact[] {
        const artifacts: Artifact[] = []

        // Generate dashboard page if in routes
        const dashboardRoute = plan.routes.find(r => r.path.includes('dashboard'))
        if (dashboardRoute) {
            artifacts.push({
                type: "code",
                path: "app/dashboard/page.tsx",
                content: `/**
 * Dashboard Page
 * ${dashboardRoute.description}
 */

"use client"

import { useState } from 'react'

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome to your ${plan.appName} dashboard
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">1,234</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Sessions</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">56</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">$12,345</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Growth</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">+12.5%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              Create New Item
            </button>
            <button className="w-full px-4 py-2 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              View Reports
            </button>
            <button className="w-full px-4 py-2 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
`,
                language: "typescript"
            })
        }

        // Generate globals.css
        artifacts.push({
            type: "code",
            path: "app/globals.css",
            content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 250, 250, 250;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 15, 23, 42;
    --background-end-rgb: 30, 41, 59;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}
`,
            language: "css"
        })

        return artifacts
    }
}
