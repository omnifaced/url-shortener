import * as assert from 'node:assert'

import { createRateLimiter } from './rate-limiter.middleware'
import { describe, test, mock } from 'node:test'
import type { RedisClientType } from 'redis'
import type { Context } from 'hono'

describe('rateLimiter', () => {
	test('creates limiter without redis', () => {
		const mw = createRateLimiter()
		assert.ok(typeof mw === 'function')
	})

	test('creates limiter with redis store', async () => {
		const redis = {
			incr: mock.fn(async () => 1),
			expire: mock.fn(async () => {}),
			decr: mock.fn(async () => {}),
			del: mock.fn(async () => {}),
		}

		const mw = createRateLimiter(redis as unknown as RedisClientType)

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

	test('keyGenerator generates anon hash fallback', async () => {
		const mw = createRateLimiter()

		const c = {
			req: {
				header: (name: string) => (name === 'user-agent' ? 'Mozilla' : undefined),
			},
		} as unknown as Context

		const key = await mw._config.keyGenerator(c)

		assert.ok(key.startsWith('anon:'))
	})
})
