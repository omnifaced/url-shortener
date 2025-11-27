import * as assert from 'node:assert'

import { RedisTokenBlacklistAdapter } from './token-blacklist.adapter'
import type { RedisClientType } from 'redis'
import { describe, test } from 'node:test'

describe('RedisTokenBlacklistAdapter', () => {
	const createMockRedis = () => {
		const storage = new Map<string, { value: string; expiresAt?: number }>()
		const sets = new Map<string, Set<string>>()

		return {
			setEx: async (key: string, seconds: number, value: string) => {
				storage.set(key, { value, expiresAt: Date.now() + seconds * 1000 })
			},
			exists: async (key: string) => {
				const item = storage.get(key)
				if (!item) {
					return 0
				}
				if (item.expiresAt && item.expiresAt < Date.now()) {
					storage.delete(key)
					return 0
				}
				return 1
			},
			sMembers: async (key: string) => {
				return Array.from(sets.get(key) || [])
			},
			multi: () => {
				const commands: Array<() => Promise<void>> = []
				return {
					setEx: (key: string, seconds: number, value: string) => {
						commands.push(async () => {
							storage.set(key, { value, expiresAt: Date.now() + seconds * 1000 })
						})
						return { setEx: () => {}, del: () => {}, exec: async () => {} }
					},
					del: (key: string) => {
						commands.push(async () => {
							sets.delete(key)
						})
						return { setEx: () => {}, del: () => {}, exec: async () => {} }
					},
					exec: async () => {
						for (const cmd of commands) {
							await cmd()
						}
					},
				}
			},
			sAdd: async (key: string, value: string) => {
				if (!sets.has(key)) {
					sets.set(key, new Set())
				}
				sets.get(key)!.add(value)
			},
			expire: async () => {},
			sRem: async (key: string, value: string) => {
				sets.get(key)?.delete(value)
			},
		} as unknown as RedisClientType
	}

	test('should add token to blacklist', async () => {
		const redis = createMockRedis()
		const adapter = new RedisTokenBlacklistAdapter(redis, 'bl:', 'ut:', 3600)

		await adapter.addToken('test-token', 300)

		const isBlacklisted = await adapter.isBlacklisted('test-token')
		assert.strictEqual(isBlacklisted, true)
	})

	test('should check if token is not blacklisted', async () => {
		const redis = createMockRedis()
		const adapter = new RedisTokenBlacklistAdapter(redis, 'bl:', 'ut:', 3600)

		const isBlacklisted = await adapter.isBlacklisted('non-existent-token')
		assert.strictEqual(isBlacklisted, false)
	})

	test('should add user tokens to blacklist and clear set', async () => {
		const redis = createMockRedis()
		const adapter = new RedisTokenBlacklistAdapter(redis, 'bl:', 'ut:', 3600)

		await adapter.trackUserToken(1, 'token1')
		await adapter.trackUserToken(1, 'token2')

		await adapter.addUserTokens(1, 300)

		const token1Blacklisted = await adapter.isBlacklisted('token1')
		const token2Blacklisted = await adapter.isBlacklisted('token2')

		assert.strictEqual(token1Blacklisted, true)
		assert.strictEqual(token2Blacklisted, true)
	})

	test('should handle empty user tokens set', async () => {
		const redis = createMockRedis()
		const adapter = new RedisTokenBlacklistAdapter(redis, 'bl:', 'ut:', 3600)

		await adapter.addUserTokens(999, 300)

		// Should not throw
		assert.ok(true)
	})

	test('should track user token', async () => {
		const redis = createMockRedis()
		const adapter = new RedisTokenBlacklistAdapter(redis, 'bl:', 'ut:', 3600)

		await adapter.trackUserToken(1, 'token1')
		await adapter.trackUserToken(1, 'token2')

		// Verify tokens are tracked (indirect check via addUserTokens)
		await adapter.addUserTokens(1, 300)

		const token1Blacklisted = await adapter.isBlacklisted('token1')
		assert.strictEqual(token1Blacklisted, true)
	})

	test('should remove user token', async () => {
		const redis = createMockRedis()
		const adapter = new RedisTokenBlacklistAdapter(redis, 'bl:', 'ut:', 3600)

		await adapter.trackUserToken(1, 'token1')
		await adapter.trackUserToken(1, 'token2')
		await adapter.removeUserToken(1, 'token1')

		await adapter.addUserTokens(1, 300)

		const token1Blacklisted = await adapter.isBlacklisted('token1')
		const token2Blacklisted = await adapter.isBlacklisted('token2')

		assert.strictEqual(token1Blacklisted, false)
		assert.strictEqual(token2Blacklisted, true)
	})
})
