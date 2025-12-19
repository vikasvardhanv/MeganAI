/**
 * Python Backend Agent
 * Generates production-ready Python backends with FastAPI, Django, or Flask
 */

import { API_REGISTRY, DATABASE_REGISTRY, type Language } from "../../analyzers/intent-analyzer"
import type { Artifact, ProgressEvent } from "../../core"

interface PythonGeneratorOptions {
    framework: 'fastapi' | 'django' | 'flask'
    database: string
    apis: string[]
    features: string[]
    appName: string
}

/**
 * Generate Python backend code
 */
export async function* generatePythonBackend(
    prompt: string,
    options: PythonGeneratorOptions
): AsyncGenerator<ProgressEvent> {
    const { framework, database, apis, features, appName } = options

    yield {
        type: "generating",
        agent: "Backend (Python)",
        message: `🐍 Generating ${framework.toUpperCase()} backend...`,
        progress: 10
    }

    const artifacts: Artifact[] = []

    // Generate requirements.txt
    artifacts.push(generateRequirements(framework, database, apis))
    yield {
        type: "generating",
        agent: "Backend (Python)",
        message: "📦 Generated requirements.txt",
        progress: 20,
        artifact: artifacts[artifacts.length - 1]
    }

    // Generate main application file
    if (framework === 'fastapi') {
        artifacts.push(...generateFastAPIApp(appName, database, apis, features))
    } else if (framework === 'django') {
        artifacts.push(...generateDjangoApp(appName, database, apis, features))
    } else {
        artifacts.push(...generateFlaskApp(appName, database, apis, features))
    }

    yield {
        type: "generating",
        agent: "Backend (Python)",
        message: "⚙️ Generated main application",
        progress: 40
    }

    // Generate database models
    artifacts.push(generatePythonModels(database, appName))
    yield {
        type: "generating",
        agent: "Backend (Python)",
        message: "🗄️ Generated database models",
        progress: 50
    }

    // Generate API routes
    artifacts.push(...generatePythonRoutes(framework, apis, features))
    yield {
        type: "generating",
        agent: "Backend (Python)",
        message: "🔌 Generated API routes",
        progress: 65
    }

    // Generate API integrations
    for (const api of apis) {
        const integration = generatePythonIntegration(api)
        if (integration) {
            artifacts.push(integration)
        }
    }
    yield {
        type: "generating",
        agent: "Backend (Python)",
        message: "🔗 Generated API integrations",
        progress: 80
    }

    // Generate Docker files
    artifacts.push(generatePythonDockerfile(framework))
    artifacts.push(generateDockerCompose(database))
    yield {
        type: "generating",
        agent: "Backend (Python)",
        message: "🐳 Generated Docker configuration",
        progress: 90
    }

    // Generate .env.example
    artifacts.push(generateEnvExample(apis, database))
    yield {
        type: "generating",
        agent: "Backend (Python)",
        message: "🔐 Generated environment template",
        progress: 95
    }

    // Emit all artifacts
    for (const artifact of artifacts) {
        yield {
            type: "generating",
            agent: "Backend (Python)",
            message: `Generated ${artifact.path}`,
            artifact
        }
    }

    yield {
        type: "complete",
        agent: "Backend (Python)",
        message: `✅ Python ${framework} backend complete with ${artifacts.length} files`
    }
}

function generateRequirements(
    framework: string,
    database: string,
    apis: string[]
): Artifact {
    const deps: string[] = []

    // Framework
    if (framework === 'fastapi') {
        deps.push(
            'fastapi>=0.109.0',
            'uvicorn[standard]>=0.27.0',
            'pydantic>=2.5.0',
            'pydantic-settings>=2.1.0',
            'python-multipart>=0.0.6'
        )
    } else if (framework === 'django') {
        deps.push(
            'django>=5.0',
            'djangorestframework>=3.14.0',
            'django-cors-headers>=4.3.0'
        )
    } else {
        deps.push(
            'flask>=3.0.0',
            'flask-cors>=4.0.0',
            'gunicorn>=21.0.0'
        )
    }

    // Database
    const dbConfig = DATABASE_REGISTRY[database as keyof typeof DATABASE_REGISTRY]
    if (dbConfig?.ormByLanguage.python) {
        if (database === 'postgresql' || database === 'mysql') {
            deps.push('sqlalchemy>=2.0.0', 'alembic>=1.13.0')
            if (database === 'postgresql') {
                deps.push('psycopg2-binary>=2.9.0', 'asyncpg>=0.29.0')
            } else {
                deps.push('pymysql>=1.1.0')
            }
        } else if (database === 'mongodb') {
            deps.push('pymongo>=4.6.0', 'motor>=3.3.0')  // async mongo
        } else if (database === 'redis') {
            deps.push('redis>=5.0.0')
        }
    }

    // API integrations
    for (const api of apis) {
        const config = API_REGISTRY[api]
        if (config?.sdkByLanguage.python) {
            deps.push(config.sdkByLanguage.python)
        }
    }

    // Common utilities
    deps.push(
        'python-dotenv>=1.0.0',
        'httpx>=0.26.0',
        'structlog>=24.1.0',  // Structured logging
        'tenacity>=8.2.0',    // Retry logic
    )

    return {
        type: "config",
        path: "requirements.txt",
        content: deps.join('\n')
    }
}

function generateFastAPIApp(
    appName: string,
    database: string,
    apis: string[],
    features: string[]
): Artifact[] {
    const safeAppName = appName.toLowerCase().replace(/\s+/g, '_')

    const mainPy = `"""
${appName} - FastAPI Backend
Production-ready API with ${apis.join(', ') || 'standard'} integrations
"""

import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.config import settings
from app.routes import router
from app.database import init_db, close_db

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    logger.info("Starting application", app="${appName}")
    await init_db()
    yield
    logger.info("Shutting down application")
    await close_db()


app = FastAPI(
    title="${appName}",
    description="Production-ready API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
class HealthResponse(BaseModel):
    status: str
    version: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/ready")
async def readiness_check():
    # Add database/service checks here
    return {"status": "ready"}


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


# Include routes
app.include_router(router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
`

    const configPy = `"""
Application Configuration
Environment-based settings with validation
"""

from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings with environment variable loading"""
    
    # App
    APP_NAME: str = "${appName}"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Database
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/${safeAppName}"
    
    # Redis (optional)
    REDIS_URL: str = "redis://localhost:6379"
    
${apis.map(api => generateConfigForAPI(api)).join('\n')}
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
`

    const databasePy = `"""
Database Configuration
SQLAlchemy async setup with connection pooling
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# Convert sync URL to async
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections"""
    await engine.dispose()


async def get_db():
    """Dependency for database sessions"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
`

    return [
        { type: "code", path: "main.py", content: mainPy, language: "python" },
        { type: "code", path: "app/__init__.py", content: '"""App package"""', language: "python" },
        { type: "code", path: "app/config.py", content: configPy, language: "python" },
        { type: "code", path: "app/database.py", content: databasePy, language: "python" },
    ]
}

function generateDjangoApp(
    appName: string,
    database: string,
    apis: string[],
    features: string[]
): Artifact[] {
    // Django REST Framework setup
    const settingsPy = `"""
Django settings for ${appName}
"""

from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-change-me")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

CORS_ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

ROOT_URLCONF = "${appName.toLowerCase().replace(/\s+/g, '_')}.urls"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "${appName.toLowerCase().replace(/\s+/g, '_')}"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "postgres"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
`

    return [
        { type: "code", path: `${appName.toLowerCase().replace(/\s+/g, '_')}/settings.py`, content: settingsPy, language: "python" },
        { type: "code", path: "manage.py", content: generateDjangoManagePy(appName), language: "python" },
        { type: "code", path: "api/__init__.py", content: '"""API app"""', language: "python" },
        { type: "code", path: "api/views.py", content: generateDjangoViews(apis), language: "python" },
        { type: "code", path: "api/urls.py", content: generateDjangoUrls(), language: "python" },
    ]
}

function generateFlaskApp(
    appName: string,
    database: string,
    apis: string[],
    features: string[]
): Artifact[] {
    const appPy = `"""
${appName} - Flask Backend
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "change-me")
    app.config["DEBUG"] = os.getenv("DEBUG", "False").lower() == "true"
    
    # CORS
    CORS(app, origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","))
    
    # Health check
    @app.route("/health")
    def health():
        return jsonify({"status": "healthy", "version": "1.0.0"})
    
    # Register blueprints
    from routes import api_bp
    app.register_blueprint(api_bp, url_prefix="/api/v1")
    
    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
`

    return [
        { type: "code", path: "app.py", content: appPy, language: "python" },
        { type: "code", path: "routes/__init__.py", content: generateFlaskRoutes(apis), language: "python" },
    ]
}

function generatePythonModels(database: string, appName: string): Artifact {
    const modelsPy = `"""
Database Models
SQLAlchemy ORM models with type hints
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255))
    password_hash = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Stripe integration
    stripe_customer_id = Column(String(255), unique=True)
    subscription_status = Column(String(50), default="inactive")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    items = relationship("Item", back_populates="owner")


class Item(Base):
    __tablename__ = "items"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="active")
    
    owner_id = Column(String, ForeignKey("users.id"))
    owner = relationship("User", back_populates="items")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Add more models as needed based on requirements
`

    return { type: "code", path: "app/models.py", content: modelsPy, language: "python" }
}

function generatePythonRoutes(framework: string, apis: string[], features: string[]): Artifact[] {
    const routesPy = `"""
API Routes
RESTful endpoints with validation and error handling
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import User, Item

router = APIRouter()
security = HTTPBearer()


# Schemas
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True


class ItemCreate(BaseModel):
    title: str
    description: Optional[str] = None


class ItemResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: str
    owner_id: str
    created_at: str

    class Config:
        from_attributes = True


# User routes
@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create a new user"""
    # Add password hashing in production
    db_user = User(
        email=user.email,
        name=user.name,
        password_hash=user.password  # Hash this!
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """Get user by ID"""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# Item routes
@router.get("/items", response_model=List[ItemResponse])
async def list_items(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """List all items with pagination"""
    from sqlalchemy import select
    result = await db.execute(
        select(Item).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.post("/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    item: ItemCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new item"""
    db_item = Item(**item.model_dump())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item
`

    return [
        { type: "code", path: "app/routes/__init__.py", content: "from .api import router", language: "python" },
        { type: "code", path: "app/routes/api.py", content: routesPy, language: "python" },
    ]
}

function generatePythonIntegration(api: string): Artifact | null {
    const integrations: Record<string, string> = {
        'stripe': `"""
Stripe Integration
Payment processing with webhooks
"""

import stripe
from app.config import settings
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/payments", tags=["payments"])

stripe.api_key = settings.STRIPE_SECRET_KEY


class CreateCheckoutRequest(BaseModel):
    price_id: str
    success_url: str
    cancel_url: str


@router.post("/create-checkout-session")
async def create_checkout_session(request: CreateCheckoutRequest):
    """Create Stripe checkout session"""
    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{"price": request.price_id, "quantity": 1}],
            success_url=request.success_url,
            cancel_url=request.cancel_url,
        )
        return {"session_id": session.id, "url": session.url}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle events
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        # Update user subscription status
        
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        # Handle cancellation
    
    return {"status": "success"}
`,
        'openai': `"""
OpenAI Integration
AI completions and embeddings
"""

from openai import AsyncOpenAI
from app.config import settings
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/ai", tags=["ai"])

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


class CompletionRequest(BaseModel):
    prompt: str
    max_tokens: int = 1000
    temperature: float = 0.7


class CompletionResponse(BaseModel):
    text: str
    usage: dict


@router.post("/complete", response_model=CompletionResponse)
async def create_completion(request: CompletionRequest):
    """Generate AI completion"""
    response = await client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[{"role": "user", "content": request.prompt}],
        max_tokens=request.max_tokens,
        temperature=request.temperature,
    )
    
    return {
        "text": response.choices[0].message.content,
        "usage": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        }
    }


class EmbeddingRequest(BaseModel):
    texts: List[str]


@router.post("/embeddings")
async def create_embeddings(request: EmbeddingRequest):
    """Generate embeddings for texts"""
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=request.texts
    )
    
    return {
        "embeddings": [item.embedding for item in response.data],
        "model": response.model
    }
`,
        'twilio': `"""
Twilio Integration
SMS and voice communications
"""

from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from app.config import settings
from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(prefix="/communications", tags=["communications"])

client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


class SMSRequest(BaseModel):
    to: str
    message: str


@router.post("/sms")
async def send_sms(request: SMSRequest):
    """Send SMS message"""
    message = client.messages.create(
        body=request.message,
        from_=settings.TWILIO_PHONE_NUMBER,
        to=request.to
    )
    
    return {
        "sid": message.sid,
        "status": message.status
    }


@router.post("/voice/webhook")
async def voice_webhook(request: Request):
    """Handle incoming voice calls"""
    response = VoiceResponse()
    response.say("Hello! Thank you for calling.", voice="alice")
    
    return str(response)
`
    }

    const content = integrations[api]
    if (!content) return null

    return {
        type: "code",
        path: `app/integrations/${api.replace('-', '_')}.py`,
        content,
        language: "python"
    }
}

function generatePythonDockerfile(framework: string): Artifact {
    const dockerfile = `# Multi-stage build for Python
FROM python:3.12-slim as builder

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.12-slim

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

# Run
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`

    return { type: "config", path: "Dockerfile", content: dockerfile }
}

function generateDockerCompose(database: string): Artifact {
    const compose = `version: "3.9"

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
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
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
`

    return { type: "config", path: "docker-compose.yml", content: compose }
}

function generateEnvExample(apis: string[], database: string): Artifact {
    const lines = [
        "# Application",
        "DEBUG=false",
        "SECRET_KEY=your-secret-key-here",
        "CORS_ORIGINS=http://localhost:3000",
        "",
        "# Database",
        "DATABASE_URL=postgresql://user:pass@localhost:5432/dbname",
        "",
    ]

    for (const api of apis) {
        const config = API_REGISTRY[api]
        if (config) {
            lines.push(`# ${config.name}`)
            for (const secret of config.secretsNeeded) {
                lines.push(`${secret}=`)
            }
            lines.push("")
        }
    }

    return { type: "config", path: ".env.example", content: lines.join('\n') }
}

function generateConfigForAPI(api: string): string {
    const config = API_REGISTRY[api]
    if (!config) return ""

    return config.secretsNeeded
        .map(secret => `    ${secret}: str = ""`)
        .join('\n')
}

function generateDjangoManagePy(appName: string): string {
    const projectName = appName.toLowerCase().replace(/\s+/g, '_')
    return `#!/usr/bin/env python
import os
import sys

def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "${projectName}.settings")
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)

if __name__ == "__main__":
    main()
`
}

function generateDjangoViews(apis: string[]): string {
    return `"""
API Views
Django REST Framework views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def health_check(request):
    return Response({"status": "healthy", "version": "1.0.0"})


# Add ViewSets for your models here
`
}

function generateDjangoUrls(): string {
    return `"""
API URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# Register viewsets: router.register("items", views.ItemViewSet)

urlpatterns = [
    path("health/", views.health_check),
    path("", include(router.urls)),
]
`
}

function generateFlaskRoutes(apis: string[]): string {
    return `"""
Flask API Routes
"""

from flask import Blueprint, jsonify, request

api_bp = Blueprint("api", __name__)


@api_bp.route("/items", methods=["GET"])
def list_items():
    return jsonify({"items": []})


@api_bp.route("/items", methods=["POST"])
def create_item():
    data = request.get_json()
    # Create item logic
    return jsonify({"item": data}), 201
`
}
