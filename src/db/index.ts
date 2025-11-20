import * as schema from './schema'

import postgres from 'postgres'

import { drizzle } from 'drizzle-orm/postgres-js'
import { config } from '../config'

const client = postgres(config.database.url, {
	max: 10,
	idle_timeout: 20,
	connect_timeout: 10,
	max_lifetime: 60 * 30,
	prepare: true,
	onnotice: () => {},
	onparameter: () => {},
})

export const db = drizzle(client, { schema })
