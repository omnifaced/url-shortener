import * as schema from './schema'

import postgres from 'postgres'

import { drizzle } from 'drizzle-orm/postgres-js'

export function createDatabase(connectionString: string) {
	const client = postgres(connectionString, {
		max: 10,
		idle_timeout: 20,
		connect_timeout: 10,
		max_lifetime: 60 * 30,
		prepare: true,
		onnotice: () => {},
		onparameter: () => {},
	})

	return drizzle(client, { schema })
}

export type Database = ReturnType<typeof createDatabase>
