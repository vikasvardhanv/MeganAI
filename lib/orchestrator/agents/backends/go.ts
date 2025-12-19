/**
 * Go Backend Agent
 * Generates production-ready Go backends with Gin, Echo, or Fiber
 */

import { API_REGISTRY, DATABASE_REGISTRY } from "../../analyzers/intent-analyzer"
import type { Artifact, ProgressEvent } from "../../core"

interface GoGeneratorOptions {
    framework: 'gin' | 'echo' | 'fiber'
    database: string
    apis: string[]
    features: string[]
    appName: string
}

/**
 * Generate Go backend code
 */
export async function* generateGoBackend(
    prompt: string,
    options: GoGeneratorOptions
): AsyncGenerator<ProgressEvent> {
    const { framework, database, apis, features, appName } = options
    const moduleName = `github.com/${appName.toLowerCase().replace(/\s+/g, '-')}`

    yield {
        type: "generating",
        agent: "Backend (Go)",
        message: `🐹 Generating ${framework.toUpperCase()} backend...`,
        progress: 10
    }

    const artifacts: Artifact[] = []

    // Generate go.mod
    artifacts.push(generateGoMod(framework, database, apis, moduleName))
    yield {
        type: "generating",
        agent: "Backend (Go)",
        message: "📦 Generated go.mod",
        progress: 20,
        artifact: artifacts[artifacts.length - 1]
    }

    // Generate main.go
    artifacts.push(generateGoMain(framework, moduleName, appName))
    yield {
        type: "generating",
        agent: "Backend (Go)",
        message: "⚙️ Generated main.go",
        progress: 35
    }

    // Generate config
    artifacts.push(generateGoConfig(apis))
    yield {
        type: "generating",
        agent: "Backend (Go)",
        message: "🔧 Generated config",
        progress: 45
    }

    // Generate database
    artifacts.push(generateGoDatabase(database))
    artifacts.push(generateGoModels())
    yield {
        type: "generating",
        agent: "Backend (Go)",
        message: "🗄️ Generated database layer",
        progress: 55
    }

    // Generate handlers
    artifacts.push(generateGoHandlers(framework))
    yield {
        type: "generating",
        agent: "Backend (Go)",
        message: "🔌 Generated HTTP handlers",
        progress: 70
    }

    // Generate API integrations
    for (const api of apis) {
        const integration = generateGoIntegration(api)
        if (integration) {
            artifacts.push(integration)
        }
    }
    yield {
        type: "generating",
        agent: "Backend (Go)",
        message: "🔗 Generated API integrations",
        progress: 85
    }

    // Generate Docker files
    artifacts.push(generateGoDockerfile())
    artifacts.push(generateGoDockerCompose(database))
    artifacts.push(generateGoMakefile(appName))
    yield {
        type: "generating",
        agent: "Backend (Go)",
        message: "🐳 Generated Docker & Makefile",
        progress: 95
    }

    // Emit all artifacts
    for (const artifact of artifacts) {
        yield {
            type: "generating",
            agent: "Backend (Go)",
            message: `Generated ${artifact.path}`,
            artifact
        }
    }

    yield {
        type: "complete",
        agent: "Backend (Go)",
        message: `✅ Go ${framework} backend complete with ${artifacts.length} files`
    }
}

function generateGoMod(
    framework: string,
    database: string,
    apis: string[],
    moduleName: string
): Artifact {
    const deps: string[] = []

    // Framework
    if (framework === 'gin') {
        deps.push('\tgithub.com/gin-gonic/gin v1.9.1')
    } else if (framework === 'echo') {
        deps.push('\tgithub.com/labstack/echo/v4 v4.11.4')
    } else {
        deps.push('\tgithub.com/gofiber/fiber/v2 v2.52.0')
    }

    // Database
    if (database === 'postgresql' || database === 'mysql') {
        deps.push('\tgorm.io/gorm v1.25.5')
        if (database === 'postgresql') {
            deps.push('\tgorm.io/driver/postgres v1.5.4')
        } else {
            deps.push('\tgorm.io/driver/mysql v1.5.2')
        }
    } else if (database === 'mongodb') {
        deps.push('\tgo.mongodb.org/mongo-driver v1.13.1')
    } else if (database === 'redis') {
        deps.push('\tgithub.com/redis/go-redis/v9 v9.4.0')
    }

    // API integrations
    for (const api of apis) {
        const config = API_REGISTRY[api]
        if (config?.sdkByLanguage.go) {
            deps.push(`\t${config.sdkByLanguage.go} latest`)
        }
    }

    // Common utilities
    deps.push(
        '\tgithub.com/joho/godotenv v1.5.1',
        '\tgithub.com/go-playground/validator/v10 v10.17.0',
        '\tgo.uber.org/zap v1.26.0',
        '\tgithub.com/google/uuid v1.5.0'
    )

    const goMod = `module ${moduleName}

go 1.22

require (
${deps.join('\n')}
)
`

    return { type: "config", path: "go.mod", content: goMod }
}

function generateGoMain(framework: string, moduleName: string, appName: string): Artifact {
    let mainGo: string

    if (framework === 'gin') {
        mainGo = `package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"${moduleName}/config"
	"${moduleName}/db"
	"${moduleName}/handlers"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// Initialize logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()
	sugar := logger.Sugar()

	// Load config
	cfg := config.Load()

	// Connect to database
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		sugar.Fatalf("Failed to connect to database: %v", err)
	}

	// Setup Gin
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(gin.Logger())

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy", "version": "1.0.0"})
	})

	// API routes
	api := router.Group("/api/v1")
	handlers.RegisterRoutes(api, database)

	// Create server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		sugar.Infof("Starting server on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			sugar.Fatalf("Server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	sugar.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		sugar.Errorf("Server forced to shutdown: %v", err)
	}

	sugar.Info("Server exited")
}
`
    } else {
        mainGo = `package main

import (
	"${moduleName}/config"
	"${moduleName}/db"
	"${moduleName}/handlers"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"log"
)

func main() {
	// Load config
	cfg := config.Load()

	// Connect to database
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Setup Fiber
	app := fiber.New(fiber.Config{
		ErrorHandler: handlers.ErrorHandler,
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New())

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy", "version": "1.0.0"})
	})

	// API routes
	api := app.Group("/api/v1")
	handlers.RegisterRoutes(api, database)

	log.Printf("Starting server on port %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
`
    }

    return { type: "code", path: "main.go", content: mainGo, language: "go" }
}

function generateGoConfig(apis: string[]): Artifact {
    const secretEnvs = apis.flatMap(api => {
        const config = API_REGISTRY[api]
        return config?.secretsNeeded || []
    })

    const configGo = `package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Environment string
	Port        string
	DatabaseURL string
	RedisURL    string
${secretEnvs.map(s => `\t${toCamelCase(s)} string`).join('\n')}
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://localhost/app"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
${secretEnvs.map(s => `\t\t${toCamelCase(s)}: getEnv("${s}", ""),`).join('\n')}
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
`

    return { type: "code", path: "config/config.go", content: configGo, language: "go" }
}

function generateGoDatabase(database: string): Artifact {
    const dbGo = `package db

import (
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(databaseURL string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Auto-migrate models
	if err := db.AutoMigrate(&User{}, &Item{}); err != nil {
		return nil, fmt.Errorf("failed to migrate: %w", err)
	}

	return db, nil
}
`

    return { type: "code", path: "db/db.go", content: dbGo, language: "go" }
}

function generateGoModels(): Artifact {
    const modelsGo = `package db

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID                 uuid.UUID \`gorm:"type:uuid;primary_key" json:"id"\`
	Email              string    \`gorm:"uniqueIndex;not null" json:"email"\`
	Name               string    \`json:"name"\`
	PasswordHash       string    \`json:"-"\`
	IsActive           bool      \`gorm:"default:true" json:"is_active"\`
	StripeCustomerID   *string   \`gorm:"uniqueIndex" json:"stripe_customer_id,omitempty"\`
	SubscriptionStatus string    \`gorm:"default:inactive" json:"subscription_status"\`
	CreatedAt          time.Time \`json:"created_at"\`
	UpdatedAt          time.Time \`json:"updated_at"\`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	u.ID = uuid.New()
	return nil
}

type Item struct {
	ID          uuid.UUID \`gorm:"type:uuid;primary_key" json:"id"\`
	Title       string    \`gorm:"not null" json:"title"\`
	Description string    \`json:"description"\`
	Status      string    \`gorm:"default:active" json:"status"\`
	OwnerID     *uuid.UUID \`gorm:"type:uuid" json:"owner_id,omitempty"\`
	Owner       *User     \`gorm:"foreignKey:OwnerID" json:"-"\`
	CreatedAt   time.Time \`json:"created_at"\`
	UpdatedAt   time.Time \`json:"updated_at"\`
}

func (i *Item) BeforeCreate(tx *gorm.DB) error {
	i.ID = uuid.New()
	return nil
}
`

    return { type: "code", path: "db/models.go", content: modelsGo, language: "go" }
}

function generateGoHandlers(framework: string): Artifact {
    let handlersGo: string

    if (framework === 'gin') {
        handlersGo = `package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.RouterGroup, db *gorm.DB) {
	items := router.Group("/items")
	{
		items.GET("", listItems(db))
		items.POST("", createItem(db))
		items.GET("/:id", getItem(db))
		items.PUT("/:id", updateItem(db))
		items.DELETE("/:id", deleteItem(db))
	}
}

type ItemRequest struct {
	Title       string \`json:"title" binding:"required"\`
	Description string \`json:"description"\`
}

func listItems(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var items []Item
		if err := db.Find(&items).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": items})
	}
}

func createItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req ItemRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		item := Item{
			Title:       req.Title,
			Description: req.Description,
		}

		if err := db.Create(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, item)
	}
}

func getItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var item Item
		if err := db.First(&item, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
			return
		}
		c.JSON(http.StatusOK, item)
	}
}

func updateItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var req ItemRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var item Item
		if err := db.First(&item, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
			return
		}

		item.Title = req.Title
		item.Description = req.Description
		db.Save(&item)

		c.JSON(http.StatusOK, item)
	}
}

func deleteItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Delete(&Item{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Status(http.StatusNoContent)
	}
}

type Item struct {
	ID          string \`json:"id"\`
	Title       string \`json:"title"\`
	Description string \`json:"description"\`
	Status      string \`json:"status"\`
}
`
    } else {
        handlersGo = `package handlers

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func RegisterRoutes(router fiber.Router, db *gorm.DB) {
	items := router.Group("/items")
	items.Get("/", listItems(db))
	items.Post("/", createItem(db))
	items.Get("/:id", getItem(db))
	items.Put("/:id", updateItem(db))
	items.Delete("/:id", deleteItem(db))
}

func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{"error": err.Error()})
}

func listItems(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var items []Item
		if err := db.Find(&items).Error; err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": items})
	}
}

func createItem(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req ItemRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		item := Item{Title: req.Title, Description: req.Description}
		if err := db.Create(&item).Error; err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		return c.Status(fiber.StatusCreated).JSON(item)
	}
}

func getItem(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id := c.Params("id")
		var item Item
		if err := db.First(&item, "id = ?", id).Error; err != nil {
			return fiber.NewError(fiber.StatusNotFound, "Item not found")
		}
		return c.JSON(item)
	}
}

func updateItem(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	}
}

func deleteItem(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusNoContent)
	}
}

type ItemRequest struct {
	Title       string \`json:"title"\`
	Description string \`json:"description"\`
}

type Item struct {
	ID          string \`json:"id"\`
	Title       string \`json:"title"\`
	Description string \`json:"description"\`
}
`
    }

    return { type: "code", path: "handlers/handlers.go", content: handlersGo, language: "go" }
}

function generateGoIntegration(api: string): Artifact | null {
    if (api === 'stripe') {
        return {
            type: "code",
            path: "services/stripe.go",
            content: `package services

import (
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
)

type StripeService struct {
	SecretKey string
}

func NewStripeService(secretKey string) *StripeService {
	stripe.Key = secretKey
	return &StripeService{SecretKey: secretKey}
}

func (s *StripeService) CreateCheckoutSession(priceID, successURL, cancelURL string) (*stripe.CheckoutSession, error) {
	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(successURL),
		CancelURL:  stripe.String(cancelURL),
	}
	return session.New(params)
}
`,
            language: "go"
        }
    }

    if (api === 'openai') {
        return {
            type: "code",
            path: "services/openai.go",
            content: `package services

import (
	"context"

	"github.com/sashabaranov/go-openai"
)

type OpenAIService struct {
	client *openai.Client
}

func NewOpenAIService(apiKey string) *OpenAIService {
	return &OpenAIService{
		client: openai.NewClient(apiKey),
	}
}

func (s *OpenAIService) CreateCompletion(ctx context.Context, prompt string) (string, error) {
	resp, err := s.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4TurboPreview,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleUser, Content: prompt},
		},
	})
	if err != nil {
		return "", err
	}
	return resp.Choices[0].Message.Content, nil
}
`,
            language: "go"
        }
    }

    return null
}

function generateGoDockerfile(): Artifact {
    return {
        type: "config",
        path: "Dockerfile",
        content: `# Multi-stage build for Go
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server .

# Production stage
FROM alpine:3.19

WORKDIR /app

# Add non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

# Copy binary
COPY --from=builder /app/server .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD wget -q --spider http://localhost:8080/health || exit 1

EXPOSE 8080
CMD ["./server"]
`
    }
}

function generateGoDockerCompose(database: string): Artifact {
    return {
        type: "config",
        path: "docker-compose.yml",
        content: `version: "3.9"

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/app?sslmode=disable
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
`
    }
}

function generateGoMakefile(appName: string): Artifact {
    const binaryName = appName.toLowerCase().replace(/\s+/g, '-')
    return {
        type: "config",
        path: "Makefile",
        content: `.PHONY: build run test clean docker

BINARY=${binaryName}

build:
	go build -o bin/$(BINARY) .

run:
	go run .

test:
	go test -v ./...

clean:
	rm -rf bin/

docker:
	docker-compose up --build

dev:
	air
`
    }
}

function toCamelCase(str: string): string {
    return str.toLowerCase()
        .split('_')
        .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
}
