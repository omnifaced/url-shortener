import { type ConfigType, type GeneralConfigType, rateLimiter } from 'hono-rate-limiter'
import type { RedisClientType } from 'redis'

interface RateLimiterMiddleware extends ReturnType<typeof rateLimiter> {
	_config: GeneralConfigType<ConfigType>
}

export function createRateLimiter(redis?: RedisClientType) {
	const prefix = 'rate_limit:'
	const config: GeneralConfigType<ConfigType> = {
		windowMs: 15 * 60 * 1000,
		limit: 100,
		standardHeaders: 'draft-7',
		keyGenerator: (c) => {
			const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')

			if (ip) {
				return ip
			}

			const userAgent = c.req.header('user-agent') || 'unknown'
			const hash = Buffer.from(userAgent).toString('base64').slice(0, 16)

			return `anon:${hash}`
		},
	}

	if (redis) {
		config.store = {
			async increment(key: string) {
				const redisKey = `${prefix}${key}`
				const current = await redis.incr(redisKey)

				if (current === 1) {
					await redis.expire(redisKey, Math.ceil(15 * 60))
				}

				return {
					totalHits: current,
					resetTime: new Date(Date.now() + 15 * 60 * 1000),
				}
			},
			async decrement(key: string) {
				const redisKey = `${prefix}${key}`
				await redis.decr(redisKey)
			},
			async resetKey(key: string) {
				const redisKey = `${prefix}${key}`
				await redis.del(redisKey)
			},
		}
	}

	const middleware = rateLimiter(config) as RateLimiterMiddleware

	middleware._config = config

	return middleware
}
