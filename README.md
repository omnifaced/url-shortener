# URL Shortener

Modern URL shortening service with analytics and JWT authentication.

## Tech Stack

Hono · PostgreSQL · Redis · Drizzle ORM · Zod · JWT

## Quick Start

```bash
docker-compose up
```

Server runs on `http://localhost:3000`

## Development

```bash
pnpm install
cp config/app.yaml.example config/app.yaml
cp config/database.yaml.example config/database.yaml
cp config/jwt.yaml.example config/jwt.yaml
cp config/redis.yaml.example config/redis.yaml
docker-compose up -d postgres redis
pnpm db:push
pnpm dev
```

## License

Copyright (c) 2025 Abbasov Ravan (omnifaced)
All rights reserved.
