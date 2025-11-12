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
cp .example.env .env
docker-compose up -d postgres redis
pnpm db:push
pnpm dev
```

## License

Copyright (c) 2025 Abbasov Ravan (omnifaced)
All rights reserved.
