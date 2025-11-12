import * as schema from './schema'

import postgres from 'postgres'

import { drizzle } from 'drizzle-orm/postgres-js'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/url_shortener'

const client = postgres(connectionString)

export const db = drizzle(client, { schema })
