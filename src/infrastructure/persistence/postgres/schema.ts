/* node:coverage disable */

import { pgTable, serial, text, timestamp, integer, varchar, boolean, index, jsonb } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	username: varchar('username', { length: 255 }).notNull().unique(),
	password: text('password').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const links = pgTable(
	'links',
	{
		id: serial('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		originalUrl: text('original_url').notNull(),
		shortCode: varchar('short_code', { length: 10 }).notNull().unique(),
		title: text('title'),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		expiresAt: timestamp('expires_at'),
	},
	(table) => [
		index('links_user_id_idx').on(table.userId),
		index('links_short_code_idx').on(table.shortCode),
		index('links_expires_at_idx').on(table.expiresAt),
	]
)

export const clicks = pgTable(
	'clicks',
	{
		id: serial('id').primaryKey(),
		linkId: integer('link_id')
			.notNull()
			.references(() => links.id, { onDelete: 'cascade' }),
		clickedAt: timestamp('clicked_at').defaultNow().notNull(),
		ip: varchar('ip', { length: 45 }),
		userAgent: text('user_agent'),
		referer: text('referer'),
		deviceInfo: jsonb('device_info'),
	},
	(table) => [index('clicks_link_id_idx').on(table.linkId), index('clicks_clicked_at_idx').on(table.clickedAt)]
)

export const refreshTokens = pgTable('refresh_tokens', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	userAgent: text('user_agent'),
	ip: varchar('ip', { length: 45 }),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
})

/* node:coverage enable */
