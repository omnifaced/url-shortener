import type { TokenBlacklistPort } from '../../../application'
import type { RedisClientType } from 'redis'

export class RedisTokenBlacklistAdapter implements TokenBlacklistPort {
	constructor(
		private readonly redis: RedisClientType,
		private readonly blacklistPrefix: string,
		private readonly userTokensPrefix: string,
		private readonly accessTokenTtl: number
	) {}

	public async addToken(token: string, expiresInSeconds: number): Promise<void> {
		const key = `${this.blacklistPrefix}${token}`
		await this.redis.setEx(key, expiresInSeconds, '1')
	}

	public async isBlacklisted(token: string): Promise<boolean> {
		const key = `${this.blacklistPrefix}${token}`
		const result = await this.redis.exists(key)
		return result === 1
	}

	public async addUserTokens(userId: number, expiresInSeconds: number): Promise<void> {
		const userKey = `${this.userTokensPrefix}${userId}:tokens`
		const tokens = await this.redis.sMembers(userKey)

		if (tokens.length === 0) {
			return
		}

		const multi = this.redis.multi()

		for (const token of tokens) {
			const key = `${this.blacklistPrefix}${token}`
			multi.setEx(key, expiresInSeconds, '1')
		}

		multi.del(userKey)
		await multi.exec()
	}

	public async trackUserToken(userId: number, token: string): Promise<void> {
		const userKey = `${this.userTokensPrefix}${userId}:tokens`
		await this.redis.sAdd(userKey, token)
		await this.redis.expire(userKey, this.accessTokenTtl * 2)
	}

	public async removeUserToken(userId: number, token: string): Promise<void> {
		const userKey = `${this.userTokensPrefix}${userId}:tokens`
		await this.redis.sRem(userKey, token)
	}
}
