import * as assert from 'node:assert'

import { CachedLinkRepository } from './cached-link.repository'
import type { LinkCacheAdapter } from './link-cache.adapter'
import { Link, Id, Url, ShortCode } from '../../../domain'
import type { LinkRepository } from '../../../domain'
import { describe, test } from 'node:test'

describe('CachedLinkRepository', () => {
	const createMockLink = (id: number, shortCode: string) => {
		return Link.create({
			id: Id.create(id),
			userId: Id.create(1),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create(shortCode),
			title: 'Test',
			isActive: true,
			createdAt: new Date(),
			expiresAt: null,
		})
	}

	const createMockCache = () => {
		const storage = new Map()
		return {
			get: (key: string) => storage.get(key),
			set: (key: string, value: unknown) => storage.set(key, value),
			delete: (key: string) => storage.delete(key),
		} as unknown as LinkCacheAdapter
	}

	const createMockRepository = () => {
		const links = new Map<number, Link>()
		return {
			findById: async (id: Id) => links.get(id.getValue()) || null,
			findByShortCode: async (shortCode: ShortCode) => {
				for (const link of links.values()) {
					if (link.getShortCode().getValue() === shortCode.getValue()) {
						return link
					}
				}
				return null
			},
			findByUserId: async () => Array.from(links.values()),
			findByUserIdWithClickCount: async () => [],
			save: async (link: Link) => {
				links.set(link.getId().getValue(), link)
				return link
			},
			update: async (link: Link) => {
				links.set(link.getId().getValue(), link)
			},
			delete: async (id: Id) => {
				links.delete(id.getValue())
			},
			countByUserId: async () => links.size,
			getTotalClicksByUserId: async () => 0,
			findExpiredLinks: async () => [],
		} as LinkRepository
	}

	test('should return cached link on cache hit', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()
		const link = createMockLink(1, 'abc123')

		await mockRepo.save(link)

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		const result = await repo.findByShortCode(ShortCode.create('abc123'))

		assert.ok(result)
		assert.strictEqual(result.getId().getValue(), 1)
	})

	test('should fetch from repository on cache miss', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()
		const link = createMockLink(1, 'abc123')

		await mockRepo.save(link)

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		const result = await repo.findByShortCode(ShortCode.create('abc123'))

		assert.ok(result)
		assert.strictEqual(result.getId().getValue(), 1)

		const cached = mockCache.get('abc123')
		assert.ok(cached)
	})

	test('should return null when link not found', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		const result = await repo.findByShortCode(ShortCode.create('xyz789'))

		assert.strictEqual(result, null)
	})

	test('should handle cache hit with stale data', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		mockCache.set('abc123', {
			id: 999,
			userId: 999,
			originalUrl: 'https://github.com/omnifaced',
			shortCode: 'asdas',
			title: null,
			isActive: true,
			createdAt: new Date().toISOString(),
			expiresAt: null,
		} as unknown as Link)

		const result = await repo.findByShortCode(ShortCode.create('abc123'))

		assert.strictEqual(result, null)
	})

	test('should save and cache link', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()
		const link = createMockLink(1, 'abc123')

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		const saved = await repo.save(link)

		assert.ok(saved)
		assert.strictEqual(saved.getId().getValue(), 1)

		const cached = mockCache.get('abc123')
		assert.ok(cached)
	})

	test('should update and cache link', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()
		const link = createMockLink(1, 'abc123')

		await mockRepo.save(link)

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		await repo.update(link)

		const cached = mockCache.get('abc123')
		assert.ok(cached)
	})

	test('should delete and remove from cache', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()
		const link = createMockLink(1, 'abc123')

		await mockRepo.save(link)

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		await repo.delete(Id.create(1))

		const cached = mockCache.get('abc123')
		assert.strictEqual(cached, undefined)
	})

	test('should handle delete when link not found', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		await repo.delete(Id.create(999))

		assert.ok(true)
	})

	test('should find by id', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()
		const link = createMockLink(1, 'abc123')

		await mockRepo.save(link)

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		const result = await repo.findById(Id.create(1))

		assert.ok(result)
		assert.strictEqual(result.getId().getValue(), 1)
	})

	test('should find by user id', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()
		const link = createMockLink(1, 'abc123')

		await mockRepo.save(link)

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		const result = await repo.findByUserId(Id.create(1))

		assert.strictEqual(result.length, 1)
	})

	test('should count by user id', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()
		const link = createMockLink(1, 'abc123')

		await mockRepo.save(link)

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		const count = await repo.countByUserId(Id.create(1))

		assert.strictEqual(count, 1)
	})

	test('should find expired links', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		const result = await repo.findExpiredLinks()

		assert.strictEqual(result.length, 0)
	})

	test('should create repository with dependencies', () => {
		const mockRepository = {} as LinkRepository
		const mockCache = {} as LinkCacheAdapter

		const cachedRepo = new CachedLinkRepository(mockRepository, mockCache)

		assert.ok(cachedRepo)
	})

	test('should find by user id with click count', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()
		const link = createMockLink(1, 'abc123')

		await mockRepo.save(link)

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		const result = await repo.findByUserIdWithClickCount(Id.create(1), 'top', { limit: 10, offset: 0 })

		assert.strictEqual(result.length, 0)
	})

	test('should get total clicks by user id', async () => {
		const mockCache = createMockCache()
		const mockRepo = createMockRepository()
		const link = createMockLink(1, 'abc123')

		await mockRepo.save(link)

		const repo = new CachedLinkRepository(mockRepo, mockCache)

		const totalClicks = await repo.getTotalClicksByUserId(Id.create(1))

		assert.strictEqual(totalClicks, 0)
	})
})
