import * as assert from 'node:assert'

import { createRateLimiter } from './rate-limiter.middleware'
import { describe, test, mock } from 'node:test'
import type { RedisClientType } from 'redis'
import type { Context } from 'hono'

const defaultConfig = {
	window_ms: 900000,
	limit: 100,
	redis_prefix: 'rate_limit:',
}

describe('rateLimiter', () => {
	test('creates limiter without redis', () => {
		const mw = createRateLimiter({ rateLimiterConfig: defaultConfig })
		assert.ok(typeof mw === 'function')
	})

	test('creates limiter with redis store', async () => {
		const redis = {
			incr: mock.fn(async () => 1),
			expire: mock.fn(async () => {}),
			decr: mock.fn(async () => {}),
			del: mock.fn(async () => {}),
		}

		const mw = createRateLimiter({
			rateLimiterConfig: defaultConfig,
			redis: redis as unknown as RedisClientType,
		})

		assert.ok(redis.incr)
		assert.ok(redis.expire)

		const store = mw._config.store!
		const result = await store.increment('abc')

		assert.strictEqual(result.totalHits, 1)
		assert.ok(result.resetTime instanceof Date)

		await store.decrement('abc')
		assert.ok(redis.decr.mock.calls.length === 1)

		await store.resetKey('abc')
		assert.ok(redis.del.mock.calls.length === 1)
	})

	test('uses config values', () => {
		const customConfig = {
			window_ms: 60000,
			limit: 50,
			redis_prefix: 'custom_prefix:',
		}

		const mw = createRateLimiter({ rateLimiterConfig: customConfig })

		assert.strictEqual(mw._config.windowMs, 60000)
		assert.strictEqual(mw._config.limit, 50)
	})

	test('keyGenerator generates anon hash fallback', async () => {
		const mw = createRateLimiter({ rateLimiterConfig: defaultConfig })

		const c = {
			req: {
				header: (name: string) => (name === 'user-agent' ? 'Mozilla' : undefined),
			},
		} as unknown as Context

		const key = await mw._config.keyGenerator(c)

		assert.ok(key.startsWith('anon:'))
	})

	test('falls back to memory store when redis fails on increment', async () => {
		const redis = {
			incr: mock.fn(async () => {
				throw new Error('Redis connection failed')
			}),
			expire: mock.fn(async () => {}),
			decr: mock.fn(async () => {}),
			del: mock.fn(async () => {}),
		}

		const mw = createRateLimiter({
			rateLimiterConfig: defaultConfig,
			redis: redis as unknown as RedisClientType,
		})

		const store = mw._config.store!

		const result1 = await store.increment('test-key')

		assert.strictEqual(result1.totalHits, 1)
		assert.ok(result1.resetTime instanceof Date)

		const result2 = await store.increment('test-key')

		assert.strictEqual(result2.totalHits, 2)
	})

	const createFailingRedisWithStore = () => {
		const redis = {
			incr: mock.fn(async () => {
				throw new Error('Redis connection failed')
			}),
			expire: mock.fn(async () => {}),
			decr: mock.fn(async () => {}),
			del: mock.fn(async () => {}),
		}

		const mw = createRateLimiter({
			rateLimiterConfig: defaultConfig,
			redis: redis as unknown as RedisClientType,
		})

		return { redis, store: mw._config.store! }
	}

	test('uses memory fallback for decrement after redis failure', async () => {
		const { redis, store } = createFailingRedisWithStore()

		await store.increment('test-key')
		await store.increment('test-key')
		await store.decrement('test-key')

		const result = await store.increment('test-key')

		assert.strictEqual(result.totalHits, 2)
		assert.strictEqual(redis.decr.mock.calls.length, 0)
	})

	test('uses memory fallback for resetKey after redis failure', async () => {
		const { redis, store } = createFailingRedisWithStore()

		await store.increment('test-key')
		await store.increment('test-key')
		await store.resetKey('test-key')

		const result = await store.increment('test-key')

		assert.strictEqual(result.totalHits, 1)
		assert.strictEqual(redis.del.mock.calls.length, 0)
	})

	test('silently falls back on decrement error without switching to memory mode', async () => {
		let incrementCount = 0
		const redis = {
			incr: mock.fn(async () => ++incrementCount),
			expire: mock.fn(async () => {}),
			decr: mock.fn(async () => {
				throw new Error('Redis decrement failed')
			}),
			del: mock.fn(async () => {}),
		}

		const mw = createRateLimiter({
			rateLimiterConfig: defaultConfig,
			redis: redis as unknown as RedisClientType,
		})

		const store = mw._config.store!

		await store.increment('test-key')
		await store.decrement('test-key')

		const result = await store.increment('test-key')

		assert.strictEqual(result.totalHits, 2)
		assert.strictEqual(redis.incr.mock.calls.length, 2)
	})

	test('memory store does not have custom store when redis not provided', () => {
		const mw = createRateLimiter({ rateLimiterConfig: defaultConfig })

		assert.strictEqual(mw._config.store, undefined)
	})

	test('keyGenerator with x-forwarded-for header', () => {
		const mw = createRateLimiter({ rateLimiterConfig: defaultConfig })

		const c = {
			req: {
				header: (name: string) => (name === 'x-forwarded-for' ? '192.168.1.1' : undefined),
			},
		} as unknown as Context

		const key = mw._config.keyGenerator(c)

		assert.strictEqual(key, '192.168.1.1')
	})

	test('keyGenerator with x-real-ip header', () => {
		const mw = createRateLimiter({ rateLimiterConfig: defaultConfig })

		const c = {
			req: {
				header: (name: string) => (name === 'x-real-ip' ? '10.0.0.1' : undefined),
			},
		} as unknown as Context

		const key = mw._config.keyGenerator(c)

		assert.strictEqual(key, '10.0.0.1')
	})

	test('keyGenerator prefers x-forwarded-for over x-real-ip', () => {
		const mw = createRateLimiter({ rateLimiterConfig: defaultConfig })

		const c = {
			req: {
				header: (name: string) => {
					if (name === 'x-forwarded-for') return '192.168.1.1'
					if (name === 'x-real-ip') return '10.0.0.1'
					return undefined
				},
			},
		} as unknown as Context

		const key = mw._config.keyGenerator(c)

		assert.strictEqual(key, '192.168.1.1')
	})

	test('redis store resetKey falls back on error', async () => {
		const redis = {
			incr: mock.fn(async () => 1),
			expire: mock.fn(async () => {}),
			decr: mock.fn(async () => {}),
			del: mock.fn(async () => {
				throw new Error('Redis delete failed')
			}),
		}

		const mw = createRateLimiter({
			rateLimiterConfig: defaultConfig,
			redis: redis as unknown as RedisClientType,
		})

		const store = mw._config.store!

		await store.increment('test-key')
		await store.resetKey('test-key')

		const result = await store.increment('test-key')

		assert.strictEqual(result.totalHits, 1)
	})

	test('redis store decrement catches error without switching mode', async () => {
		let incrementCount = 0
		const redis = {
			incr: mock.fn(async () => ++incrementCount),
			expire: mock.fn(async () => {}),
			decr: mock.fn(async () => {
				throw new Error('Redis connection lost')
			}),
			del: mock.fn(async () => {}),
		}

		const mw = createRateLimiter({
			rateLimiterConfig: defaultConfig,
			redis: redis as unknown as RedisClientType,
		})

		const store = mw._config.store!

		await store.increment('key1')
		await store.decrement('key1')

		const initialIncrCalls = redis.incr.mock.calls.length

		const result = await store.increment('key1')

		assert.strictEqual(result.totalHits, 2)
		assert.strictEqual(redis.incr.mock.calls.length, initialIncrCalls + 1)
		assert.strictEqual(redis.decr.mock.calls.length, 1)
	})

	test('redis store sets expire only on first increment', async () => {
		let callCount = 0
		const redis = {
			incr: mock.fn(async () => ++callCount),
			expire: mock.fn(async () => {}),
			decr: mock.fn(async () => {}),
			del: mock.fn(async () => {}),
		}

		const mw = createRateLimiter({
			rateLimiterConfig: defaultConfig,
			redis: redis as unknown as RedisClientType,
		})

		const store = mw._config.store!

		await store.increment('test')
		await store.increment('test')

		assert.strictEqual(redis.expire.mock.calls.length, 1)
		assert.strictEqual(redis.incr.mock.calls.length, 2)
	})
})
