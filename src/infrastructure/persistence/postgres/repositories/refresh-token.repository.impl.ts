/* node:coverage disable */

import * as schema from '../schema'

import { RefreshToken, Id, type RefreshTokenRepository } from '../../../../domain'
import type { Database } from '../database'
import { eq, lt } from 'drizzle-orm'

export class RefreshTokenRepositoryImpl implements RefreshTokenRepository {
	constructor(private readonly db: Database) {}

	public async save(token: RefreshToken): Promise<RefreshToken> {
		const result = await this.db
			.insert(schema.refreshTokens)
			.values({
				userId: token.getUserId().getValue(),
				token: token.getToken(),
				userAgent: token.getUserAgent(),
				ip: token.getIp(),
				expiresAt: token.getExpiresAt(),
			})
			.returning()

		return this.toDomain(result[0])
	}

	public async findByToken(token: string): Promise<RefreshToken | null> {
		const result = await this.db
			.select()
			.from(schema.refreshTokens)
			.where(eq(schema.refreshTokens.token, token))
			.limit(1)

		if (result.length === 0) {
			return null
		}

		return this.toDomain(result[0])
	}

	public async deleteByToken(token: string): Promise<void> {
		await this.db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, token))
	}

	public async deleteByUserId(userId: Id): Promise<void> {
		await this.db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId.getValue()))
	}

	public async deleteExpired(): Promise<void> {
		await this.db.delete(schema.refreshTokens).where(lt(schema.refreshTokens.expiresAt, new Date()))
	}

	private toDomain(row: typeof schema.refreshTokens.$inferSelect): RefreshToken {
		return RefreshToken.create({
			id: Id.create(row.id),
			userId: Id.create(row.userId),
			token: row.token,
			userAgent: row.userAgent,
			ip: row.ip,
			expiresAt: row.expiresAt,
			createdAt: row.createdAt,
		})
	}
}

/* node:coverage enable */
