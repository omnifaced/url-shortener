import { rateLimiter, type HonoConfigProps } from 'hono-rate-limiter'
import type { RateLimiter } from '../../../shared/config/config'
import type { RedisClientType } from 'redis'
import { logger } from '../../../shared'
import { LRUCache } from 'lru-cache'

interface RateLimiterMiddleware extends ReturnType<typeof rateLimiter> {
	_config: HonoConfigProps
}

interface RateLimiterOptions {
	rateLimiterConfig: RateLimiter
	redis?: RedisClientType
}

const MEMORY_STORE_MAX_SIZE = 10000

function createMemoryStore(windowMs: number) {
	const cache = new LRUCache<string, number>({
		max: MEMORY_STORE_MAX_SIZE,
		ttl: windowMs,
	})

	return {
		increment(key: string) {
			const current = cache.get(key) ?? 0
			const newCount = current + 1

			cache.set(key, newCount)

			return {
				totalHits: newCount,
				resetTime: new Date(Date.now() + windowMs),
			}
		},

		decrement(key: string) {
			const current = cache.get(key)

			if (current && current > 0) {
				cache.set(key, current - 1)
			}
		},

		resetKey(key: string) {
			cache.delete(key)
		},
	}
}

function createRedisStoreWithFallback(redis: RedisClientType, prefix: string, windowMs: number, windowSeconds: number) {
	const memoryStore = createMemoryStore(windowMs)
	let useMemoryFallback = false

	return {
		async increment(key: string) {
			if (useMemoryFallback) {
				return memoryStore.increment(key)
			}

			try {
				const redisKey = `${prefix}${key}`
				const current = await redis.incr(redisKey)

				if (current === 1) {
					await redis.expire(redisKey, windowSeconds)
				}

				return {
					totalHits: current,
					resetTime: new Date(Date.now() + windowMs),
				}
			} catch (error) {
				logger.warn('Redis rate limiter failed, switching to memory fallback', { error })
				useMemoryFallback = true

				return memoryStore.increment(key)
			}
		},

		async decrement(key: string) {
			if (useMemoryFallback) {
				memoryStore.decrement(key)

				return
			}

			try {
				await redis.decr(`${prefix}${key}`)
			} catch {
				memoryStore.decrement(key)
			}
		},

		async resetKey(key: string) {
			if (useMemoryFallback) {
				memoryStore.resetKey(key)

				return
			}

			try {
				await redis.del(`${prefix}${key}`)
			} catch {
				memoryStore.resetKey(key)
			}
		},
	}
}

export function createRateLimiter(options: RateLimiterOptions) {
	const { rateLimiterConfig, redis } = options
	const windowSeconds = Math.floor(rateLimiterConfig.window_ms / 1000)

	const config: HonoConfigProps = {
		windowMs: rateLimiterConfig.window_ms,
		limit: rateLimiterConfig.limit,
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
		config.store = createRedisStoreWithFallback(
			redis,
			rateLimiterConfig.redis_prefix,
			rateLimiterConfig.window_ms,
			windowSeconds
		)
	}

	const middleware = rateLimiter(config) as RateLimiterMiddleware
	middleware._config = config

	return middleware
}
