# URL Shortener

🚀 A modern, high-performance URL shortening service built with TypeScript, following Domain-Driven Design (DDD) and Clean Architecture principles.

## ✨ Features

- **URL Shortening**: Create short, memorable links from long URLs
- **QR Code Generation**: Generate QR codes for shortened links (PNG/SVG formats)
- **Analytics**: Track clicks, view statistics, and get detailed insights
- **Authentication**: Secure JWT-based authentication with refresh tokens
- **Multi-tenancy**: Each user manages their own links
- **Caching**: Redis-based caching for high performance
- **Metrics**: Prometheus metrics for monitoring
- **Rate Limiting**: Built-in rate limiting protection
- **HTTPS Support**: Optional SSL/TLS certificate support
- **Graceful Shutdown**: Proper cleanup of resources on shutdown

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Web Framework**: Hono
- **Database**: PostgreSQL with Drizzle ORM
- **Cache**: Redis
- **API Documentation**: OpenAPI/Swagger
- **Metrics**: Prometheus (prom-client)
- **Architecture**: DDD + Clean Architecture

## 📦 Installation

### 🐋 Using Docker (Recommended)

```bash
cp config/app.yaml.example config/app.yaml
cp config/cache.yaml.example config/cache.yaml
cp config/certificates.yaml.example config/certificates.yaml
cp config/database.yaml.example config/database.yaml
cp config/jwt.yaml.example config/jwt.yaml
cp config/redis.yaml.example config/redis.yaml
cp config/short_code.yaml.example config/short_code.yaml
docker compose up --build
```

### 💻 Local Development

```bash
pnpm install

cp config/app.yaml.example config/app.yaml
cp config/cache.yaml.example config/cache.yaml
cp config/database.yaml.example config/database.yaml
cp config/jwt.yaml.example config/jwt.yaml
cp config/redis.yaml.example config/redis.yaml
cp config/short_code.yaml.example config/short_code.yaml

pnpm db:push

pnpm dev
```

## ⚙️ Configuration

All configuration files are located in the `config` directory. Copy the example files and adjust them according to your needs:

- `app.yaml`: Server host and port settings
- `database.yaml`: PostgreSQL connection settings
- `redis.yaml`: Redis connection settings
- `jwt.yaml`: JWT secret and token expiration
- `cache.yaml`: Cache TTL and size settings
- `short_code.yaml`: Short code generation settings
- `certificates.yaml`: SSL/TLS certificates (optional)

## 📚 API Documentation

Once the server is running, API documentation is available at:

- Swagger UI: http://localhost:3000/api/docs (or https: https://localhost:3000/api/docs)
- OpenAPI Spec: http://localhost:3000/api/doc (or https: https://localhost:3000/api/doc)

## 📁 Project Structure

```
src/
├── application/      # Use cases and business logic
├── domain/           # Entities, value objects, repositories
├── infrastructure/   # External adapters (DB, Redis, HTTP)
├── presentation/     # HTTP controllers and OpenAPI schemas
├── di/               # Dependency injection container
└── shared/           # Shared utilities and configuration
```

## ⚖️ License

Copyright (c) 2025 Abbasov Ravan (omnifaced)
All rights reserved.
