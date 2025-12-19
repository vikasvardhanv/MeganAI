/**
 * Java Backend Agent
 * Generates production-ready Java backends with Spring Boot, Quarkus, or Micronaut
 */

import { API_REGISTRY, DATABASE_REGISTRY } from "../../analyzers/intent-analyzer"
import type { Artifact, ProgressEvent } from "../../core"

interface JavaGeneratorOptions {
    framework: 'spring' | 'quarkus' | 'micronaut'
    database: string
    apis: string[]
    features: string[]
    appName: string
}

/**
 * Generate Java backend code
 */
export async function* generateJavaBackend(
    prompt: string,
    options: JavaGeneratorOptions
): AsyncGenerator<ProgressEvent> {
    const { framework, database, apis, features, appName } = options
    const packageName = `com.${appName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '')}`

    yield {
        type: "generating",
        agent: "Backend (Java)",
        message: `☕ Generating ${framework === 'spring' ? 'Spring Boot' : framework} backend...`,
        progress: 10
    }

    const artifacts: Artifact[] = []

    // Generate build files
    artifacts.push(generatePomXml(framework, database, apis, appName, packageName))
    yield {
        type: "generating",
        agent: "Backend (Java)",
        message: "📦 Generated pom.xml",
        progress: 20,
        artifact: artifacts[artifacts.length - 1]
    }

    // Generate main application
    artifacts.push(...generateSpringBootApp(appName, packageName, apis))
    yield {
        type: "generating",
        agent: "Backend (Java)",
        message: "⚙️ Generated main application",
        progress: 40
    }

    // Generate entities
    artifacts.push(...generateJavaEntities(packageName))
    yield {
        type: "generating",
        agent: "Backend (Java)",
        message: "🗄️ Generated JPA entities",
        progress: 55
    }

    // Generate controllers
    artifacts.push(...generateJavaControllers(packageName, apis))
    yield {
        type: "generating",
        agent: "Backend (Java)",
        message: "🔌 Generated REST controllers",
        progress: 70
    }

    // Generate API integrations
    for (const api of apis) {
        const integration = generateJavaIntegration(api, packageName)
        if (integration) {
            artifacts.push(...integration)
        }
    }
    yield {
        type: "generating",
        agent: "Backend (Java)",
        message: "🔗 Generated API integrations",
        progress: 85
    }

    // Generate Docker files
    artifacts.push(generateJavaDockerfile())
    artifacts.push(generateJavaDockerCompose(database))
    yield {
        type: "generating",
        agent: "Backend (Java)",
        message: "🐳 Generated Docker configuration",
        progress: 95
    }

    // Emit all artifacts
    for (const artifact of artifacts) {
        yield {
            type: "generating",
            agent: "Backend (Java)",
            message: `Generated ${artifact.path}`,
            artifact
        }
    }

    yield {
        type: "complete",
        agent: "Backend (Java)",
        message: `✅ Java ${framework} backend complete with ${artifacts.length} files`
    }
}

function generatePomXml(
    framework: string,
    database: string,
    apis: string[],
    appName: string,
    packageName: string
): Artifact {
    const artifactId = appName.toLowerCase().replace(/\s+/g, '-')

    const dependencies: string[] = []

    // Spring Boot starters
    dependencies.push(`
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>`)

    // Database
    if (database === 'postgresql' || database === 'mysql') {
        dependencies.push(`
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>`)

        if (database === 'postgresql') {
            dependencies.push(`
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>`)
        } else {
            dependencies.push(`
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>`)
        }
    } else if (database === 'mongodb') {
        dependencies.push(`
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-mongodb</artifactId>
        </dependency>`)
    }

    // API SDKs
    for (const api of apis) {
        const config = API_REGISTRY[api]
        if (config?.sdkByLanguage.java) {
            const [groupId, artifactIdDep] = config.sdkByLanguage.java.split(':')
            dependencies.push(`
        <dependency>
            <groupId>${groupId}</groupId>
            <artifactId>${artifactIdDep}</artifactId>
            <version>LATEST</version>
        </dependency>`)
        }
    }

    // Utilities
    dependencies.push(`
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.3.0</version>
        </dependency>`)

    const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <groupId>${packageName}</groupId>
    <artifactId>${artifactId}</artifactId>
    <version>1.0.0</version>
    <name>${appName}</name>
    <description>Production-ready Spring Boot application</description>
    
    <properties>
        <java.version>21</java.version>
    </properties>
    
    <dependencies>${dependencies.join('')}
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
`

    return { type: "config", path: "pom.xml", content: pomXml }
}

function generateSpringBootApp(appName: string, packageName: string, apis: string[]): Artifact[] {
    const className = appName.replace(/\s+/g, '') + 'Application'
    const packagePath = packageName.replace(/\./g, '/')

    const mainApp = `package ${packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * ${appName} - Spring Boot Application
 * Production-ready API with enterprise patterns
 */
@SpringBootApplication
@EnableAsync
public class ${className} {

    public static void main(String[] args) {
        SpringApplication.run(${className}.class, args);
    }
}
`

    const applicationYml = `# Application Configuration
spring:
  application:
    name: ${appName.toLowerCase().replace(/\s+/g, '-')}
  
  datasource:
    url: \${DATABASE_URL:jdbc:postgresql://localhost:5432/app}
    username: \${DB_USERNAME:postgres}
    password: \${DB_PASSWORD:postgres}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 20000
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        jdbc:
          batch_size: 20
  
  jackson:
    serialization:
      write-dates-as-timestamps: false
    default-property-inclusion: non_null

server:
  port: 8080
  error:
    include-message: always
    include-binding-errors: always

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when_authorized

logging:
  level:
    root: INFO
    ${packageName}: DEBUG
  pattern:
    console: "%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n"

# API Keys (from environment)
${apis.map(api => {
        const config = API_REGISTRY[api]
        if (!config) return ''
        return config.secretsNeeded.map(s =>
            `${s.toLowerCase().replace(/_/g, '.')}: \${${s}:}`
        ).join('\n')
    }).filter(Boolean).join('\n')}
`

    const globalExceptionHandler = `package ${packageName}.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        return ResponseEntity.badRequest().body(Map.of(
            "timestamp", Instant.now().toString(),
            "status", 400,
            "error", "Validation Failed",
            "errors", errors
        ));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
            "timestamp", Instant.now().toString(),
            "status", 404,
            "error", "Not Found",
            "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "timestamp", Instant.now().toString(),
            "status", 500,
            "error", "Internal Server Error",
            "message", "An unexpected error occurred"
        ));
    }
}
`

    const resourceNotFound = `package ${packageName}.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
    
    public ResourceNotFoundException(String resource, String id) {
        super(resource + " not found with id: " + id);
    }
}
`

    return [
        { type: "code", path: `src/main/java/${packagePath}/${className}.java`, content: mainApp, language: "java" },
        { type: "config", path: "src/main/resources/application.yml", content: applicationYml },
        { type: "code", path: `src/main/java/${packagePath}/exception/GlobalExceptionHandler.java`, content: globalExceptionHandler, language: "java" },
        { type: "code", path: `src/main/java/${packagePath}/exception/ResourceNotFoundException.java`, content: resourceNotFound, language: "java" },
    ]
}

function generateJavaEntities(packageName: string): Artifact[] {
    const packagePath = packageName.replace(/\./g, '/')

    const userEntity = `package ${packageName}.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    private String name;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "stripe_customer_id", unique = true)
    private String stripeCustomerId;

    @Column(name = "subscription_status")
    @Builder.Default
    private String subscriptionStatus = "inactive";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
`

    const itemEntity = `package ${packageName}.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private String status = "active";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
`

    const userRepository = `package ${packageName}.repository;

import ${packageName}.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByStripeCustomerId(String stripeCustomerId);
    boolean existsByEmail(String email);
}
`

    const itemRepository = `package ${packageName}.repository;

import ${packageName}.entity.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ItemRepository extends JpaRepository<Item, UUID> {
    Page<Item> findByOwnerId(UUID ownerId, Pageable pageable);
    Page<Item> findByStatus(String status, Pageable pageable);
}
`

    return [
        { type: "code", path: `src/main/java/${packagePath}/entity/User.java`, content: userEntity, language: "java" },
        { type: "code", path: `src/main/java/${packagePath}/entity/Item.java`, content: itemEntity, language: "java" },
        { type: "code", path: `src/main/java/${packagePath}/repository/UserRepository.java`, content: userRepository, language: "java" },
        { type: "code", path: `src/main/java/${packagePath}/repository/ItemRepository.java`, content: itemRepository, language: "java" },
    ]
}

function generateJavaControllers(packageName: string, apis: string[]): Artifact[] {
    const packagePath = packageName.replace(/\./g, '/')

    const healthController = `package ${packageName}.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "version", "1.0.0"
        ));
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, String>> ready() {
        return ResponseEntity.ok(Map.of("status", "ready"));
    }
}
`

    const itemController = `package ${packageName}.controller;

import ${packageName}.dto.ItemRequest;
import ${packageName}.dto.ItemResponse;
import ${packageName}.entity.Item;
import ${packageName}.exception.ResourceNotFoundException;
import ${packageName}.repository.ItemRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemRepository itemRepository;

    @GetMapping
    public ResponseEntity<Page<ItemResponse>> list(Pageable pageable) {
        Page<ItemResponse> items = itemRepository.findAll(pageable)
            .map(ItemResponse::from);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemResponse> get(@PathVariable UUID id) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item", id.toString()));
        return ResponseEntity.ok(ItemResponse.from(item));
    }

    @PostMapping
    public ResponseEntity<ItemResponse> create(@Valid @RequestBody ItemRequest request) {
        Item item = Item.builder()
            .title(request.title())
            .description(request.description())
            .build();
        item = itemRepository.save(item);
        return ResponseEntity.status(HttpStatus.CREATED).body(ItemResponse.from(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody ItemRequest request
    ) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item", id.toString()));
        
        item.setTitle(request.title());
        item.setDescription(request.description());
        item = itemRepository.save(item);
        
        return ResponseEntity.ok(ItemResponse.from(item));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!itemRepository.existsById(id)) {
            throw new ResourceNotFoundException("Item", id.toString());
        }
        itemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
`

    const itemDto = `package ${packageName}.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ItemRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be less than 255 characters")
    String title,
    
    String description
) {}
`

    const itemResponse = `package ${packageName}.dto;

import ${packageName}.entity.Item;

import java.time.Instant;
import java.util.UUID;

public record ItemResponse(
    UUID id,
    String title,
    String description,
    String status,
    Instant createdAt,
    Instant updatedAt
) {
    public static ItemResponse from(Item item) {
        return new ItemResponse(
            item.getId(),
            item.getTitle(),
            item.getDescription(),
            item.getStatus(),
            item.getCreatedAt(),
            item.getUpdatedAt()
        );
    }
}
`

    return [
        { type: "code", path: `src/main/java/${packagePath}/controller/HealthController.java`, content: healthController, language: "java" },
        { type: "code", path: `src/main/java/${packagePath}/controller/ItemController.java`, content: itemController, language: "java" },
        { type: "code", path: `src/main/java/${packagePath}/dto/ItemRequest.java`, content: itemDto, language: "java" },
        { type: "code", path: `src/main/java/${packagePath}/dto/ItemResponse.java`, content: itemResponse, language: "java" },
    ]
}

function generateJavaIntegration(api: string, packageName: string): Artifact[] | null {
    const packagePath = packageName.replace(/\./g, '/')

    if (api === 'stripe') {
        const stripeService = `package ${packageName}.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class StripeService {

    @Value("\${stripe.secret.key}")
    private String stripeSecretKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    public Session createCheckoutSession(String priceId, String successUrl, String cancelUrl) throws StripeException {
        SessionCreateParams params = SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
            .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
            .addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setPrice(priceId)
                    .setQuantity(1L)
                    .build()
            )
            .setSuccessUrl(successUrl)
            .setCancelUrl(cancelUrl)
            .build();

        return Session.create(params);
    }
}
`

        const stripeController = `package ${packageName}.controller;

import ${packageName}.service.StripeService;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final StripeService stripeService;

    public record CheckoutRequest(String priceId, String successUrl, String cancelUrl) {}

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, String>> createCheckout(@RequestBody CheckoutRequest request) {
        try {
            Session session = stripeService.createCheckoutSession(
                request.priceId(),
                request.successUrl(),
                request.cancelUrl()
            );
            return ResponseEntity.ok(Map.of(
                "sessionId", session.getId(),
                "url", session.getUrl()
            ));
        } catch (StripeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
`

        return [
            { type: "code", path: `src/main/java/${packagePath}/service/StripeService.java`, content: stripeService, language: "java" },
            { type: "code", path: `src/main/java/${packagePath}/controller/PaymentController.java`, content: stripeController, language: "java" },
        ]
    }

    return null
}

function generateJavaDockerfile(): Artifact {
    const dockerfile = `# Multi-stage build for Java
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Maven files
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source and build
COPY src src
RUN ./mvnw package -DskipTests

# Production stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Add non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy JAR
COPY --from=builder /app/target/*.jar app.jar

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \\
    CMD wget -q --spider http://localhost:8080/health || exit 1

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
`

    return { type: "config", path: "Dockerfile", content: dockerfile }
}

function generateJavaDockerCompose(database: string): Artifact {
    const compose = `version: "3.9"

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DATABASE_URL=jdbc:postgresql://db:5432/app
      - DB_USERNAME=postgres
      - DB_PASSWORD=postgres
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
    restart: unless-stopped

volumes:
  postgres_data:
`

    return { type: "config", path: "docker-compose.yml", content: compose }
}
