import { links, refreshTokens } from '../db/schema'
import { lt, and, isNotNull } from 'drizzle-orm'
import { db } from '../db'

export async function cleanupExpiredLinks(): Promise<number> {
	const result = await db
		.delete(links)
		.where(and(lt(links.expiresAt, new Date()), isNotNull(links.expiresAt)))
		.returning()

	return result.length
}

export async function cleanupExpiredTokens(): Promise<number> {
	const result = await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date())).returning()

	return result.length
}
