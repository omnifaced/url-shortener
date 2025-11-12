import { redis } from './redis'

const BLACKLIST_PREFIX = 'blacklist:token:'

export async function addTokenToBlacklist(token: string, expiresInSeconds: number): Promise<void> {
	const key = `${BLACKLIST_PREFIX}${token}`
	await redis.setex(key, expiresInSeconds, '1')
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
	const key = `${BLACKLIST_PREFIX}${token}`
	const result = await redis.exists(key)
	return result === 1
}

export async function addUserTokensToBlacklist(userId: number, expiresInSeconds: number): Promise<void> {
	const userKey = `user:${userId}:tokens`
	const tokens = await redis.smembers(userKey)

	if (tokens.length === 0) {
		return
	}

	const pipeline = redis.pipeline()

	for (const token of tokens) {
		const key = `${BLACKLIST_PREFIX}${token}`
		pipeline.setex(key, expiresInSeconds, '1')
	}

	pipeline.del(userKey)
	await pipeline.exec()
}

export async function trackUserToken(userId: number, token: string): Promise<void> {
	const userKey = `user:${userId}:tokens`
	await redis.sadd(userKey, token)
}

export async function removeUserToken(userId: number, token: string): Promise<void> {
	const userKey = `user:${userId}:tokens`
	await redis.srem(userKey, token)
}
