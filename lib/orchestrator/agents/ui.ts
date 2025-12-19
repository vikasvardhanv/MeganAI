/**
 * UI Agent - Enhanced Version
 * Uses GPT-4o for generating React components
 * Implements v0's streaming approach with real component code
 */

import { ModelRouter } from "../../ai/router"
import type { Artifact } from "../core"
import type { ArchitectPlan, ComponentSpec } from "./architect"

export class UIAgent {
    private router: ModelRouter

    constructor(apiKeys: Record<string, string>) {
        this.router = new ModelRouter(apiKeys)
    }

    async generateComponents(plan: ArchitectPlan): Promise<Artifact[]> {
        const artifacts: Artifact[] = []

        // Generate each component from the plan
        for (const componentSpec of plan.components) {
            const component = await this.generateComponent(componentSpec, plan)
            artifacts.push(component)
        }

        // Always generate common UI components
        artifacts.push(...this.generateCommonComponents(plan))

        return artifacts
    }

    private async generateComponent(spec: ComponentSpec, plan: ArchitectPlan): Promise<Artifact> {
        const systemPrompt = `You are an expert React/Next.js developer specializing in modern UI design.

TASK: Generate a production-ready TypeScript React component.

COMPONENT: ${spec.name}
DESCRIPTION: ${spec.description}
${spec.clientSide ? 'NOTE: This is a client-side component, use "use client" directive.' : ''}

REQUIREMENTS:
1. Use TypeScript with proper type definitions
2. Use Tailwind CSS for all styling - make it look PROFESSIONAL
3. Include proper imports
4. Add JSDoc documentation
5. Make it responsive
6. Add hover/focus states for interactive elements
7. Use semantic HTML
8. Include loading/error states if applicable

APP CONTEXT:
- App Name: ${plan.appName}
- Features: ${plan.features.join(", ")}

OUTPUT: Return ONLY the component code, no explanations or markdown.`

        try {
            const result = await this.router.route(
                "ui-generation",
                `${systemPrompt}\n\nGenerate the ${spec.name} component now:`
            )

            return {
                type: "code",
                path: spec.path,
                content: this.cleanCode(result.response),
                language: "typescript"
            }
        } catch (error) {
            // Fallback to template component
            console.error(`[UIAgent] Failed to generate ${spec.name}:`, error)
            return this.generateFallbackComponent(spec)
        }
    }

    private generateFallbackComponent(spec: ComponentSpec): Artifact {
        const componentName = spec.name.replace(/[^a-zA-Z0-9]/g, '')

        return {
            type: "code",
            path: spec.path,
            content: `${spec.clientSide ? '"use client"\n\n' : ''}/**
 * ${spec.name} Component
 * ${spec.description}
 */

import { FC } from 'react'

interface ${componentName}Props {
  className?: string
}

export const ${componentName}: FC<${componentName}Props> = ({ className }) => {
  return (
    <div className={\`\${className || ''}\`}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        ${spec.name}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        ${spec.description || 'Component content goes here'}
      </p>
    </div>
  )
}

export default ${componentName}
`,
            language: "typescript"
        }
    }

    private generateCommonComponents(plan: ArchitectPlan): Artifact[] {
        return [
            this.generateButton(),
            this.generateCard(),
            this.generateInput(),
            this.generateHeader(plan),
            this.generateLoadingSpinner()
        ]
    }

    private generateButton(): Artifact {
        return {
            type: "code",
            path: "components/ui/button.tsx",
            content: `"use client"

/**
 * Button Component
 * Reusable button with multiple variants and sizes
 */

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-800 dark:text-white',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500 dark:border-gray-600',
      ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500 dark:hover:bg-gray-800',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
`,
            language: "typescript"
        }
    }

    private generateCard(): Artifact {
        return {
            type: "code",
            path: "components/ui/card.tsx",
            content: `/**
 * Card Component
 * Flexible card container with header, body, and footer sections
 */

import { FC, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export const Card: FC<CardProps> & {
  Header: FC<CardHeaderProps>
  Body: FC<CardBodyProps>
  Footer: FC<CardFooterProps>
} = ({ children, className }) => {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700',
      'overflow-hidden',
      className
    )}>
      {children}
    </div>
  )
}

const CardHeader: FC<CardHeaderProps> = ({ children, className }) => (
  <div className={cn('px-6 py-4 border-b border-gray-200 dark:border-gray-700', className)}>
    {children}
  </div>
)

const CardBody: FC<CardBodyProps> = ({ children, className }) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
)

const CardFooter: FC<CardFooterProps> = ({ children, className }) => (
  <div className={cn('px-6 py-4 bg-gray-50 dark:bg-gray-900/50', className)}>
    {children}
  </div>
)

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
`,
            language: "typescript"
        }
    }

    private generateInput(): Artifact {
        return {
            type: "code",
            path: "components/ui/input.tsx",
            content: `"use client"

/**
 * Input Component
 * Styled input field with label and error support
 */

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2 rounded-lg border transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'placeholder:text-gray-400',
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
`,
            language: "typescript"
        }
    }

    private generateHeader(plan: ArchitectPlan): Artifact {
        return {
            type: "code",
            path: "components/layout/header.tsx",
            content: `"use client"

/**
 * Header Component
 * Main navigation header for ${plan.appName}
 */

import { useState } from 'react'
import Link from 'next/link'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/about', label: 'About' },
  ]

  return (
    <header className={\`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 \${className || ''}\`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                ${plan.appName}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
`,
            language: "typescript"
        }
    }

    private generateLoadingSpinner(): Artifact {
        return {
            type: "code",
            path: "components/ui/loading-spinner.tsx",
            content: `/**
 * Loading Spinner Component
 * Animated loading indicator
 */

import { FC } from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-200 border-t-primary-600',
          sizes[size]
        )}
      />
    </div>
  )
}

export default LoadingSpinner
`,
            language: "typescript"
        }
    }

    private toKebabCase(str: string): string {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase()
    }

    private cleanCode(code: string): string {
        // Remove markdown code blocks if present
        let cleaned = code.trim()

        // Try different markdown patterns
        const patterns = [
            /```(?:tsx?|typescript|jsx?|javascript)?\n([\s\S]*?)\n```/,
            /```\n?([\s\S]*?)\n?```/
        ]

        for (const pattern of patterns) {
            const match = cleaned.match(pattern)
            if (match) {
                cleaned = match[1].trim()
                break
            }
        }

        return cleaned
    }
}
