import { defineConfig } from 'drizzle-kit'
import { loadConfig } from './src/shared'

const config = loadConfig()

export default defineConfig({
	schema: './src/infrastructure/persistence/postgres/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: config.database.url,
	},
})
