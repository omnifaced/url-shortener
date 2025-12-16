import * as assert from 'node:assert'

import { Id, Link, ShortCode, Url, type LinkRepository } from '../../../domain'
import { ListAnalyticsLinksUseCase } from './list-analytics-links.use-case'
import { describe, test, mock } from 'node:test'

describe('ListAnalyticsLinksUseCase', () => {
	test('should return links with click count sorted by top', async () => {
		const link1 = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create('abc123'),
			title: 'Test Link 1',
			isActive: true,
			createdAt: new Date('2025-01-01'),
			expiresAt: null,
		})

		const link2 = Link.create({
			id: Id.create(2),
			userId: Id.create(10),
			originalUrl: Url.create('https://example2.com'),
			shortCode: ShortCode.create('xyz789'),
			title: 'Test Link 2',
			isActive: true,
			createdAt: new Date('2025-01-02'),
			expiresAt: null,
		})

		const linksWithClicks = [
			{ link: link1, clickCount: 50 },
			{ link: link2, clickCount: 30 },
		]

		const findByUserIdWithClickCountMock = mock.fn(async () => linksWithClicks)
		const countByUserIdMock = mock.fn(async () => 2)
		const getTotalClicksByUserIdMock = mock.fn(async () => 80)

		const mockLinkRepository: LinkRepository = {
			findByUserIdWithClickCount: findByUserIdWithClickCountMock,
			countByUserId: countByUserIdMock,
			getTotalClicksByUserId: getTotalClicksByUserIdMock,
		} as unknown as LinkRepository

		const useCase = new ListAnalyticsLinksUseCase(mockLinkRepository)

		const result = await useCase.execute(10, { sort: 'top', page: 1, limit: 10 })

		assert.strictEqual(result.type, 'top')
		assert.strictEqual(result.links.length, 2)
		assert.strictEqual(result.links[0].id, 1)
		assert.strictEqual(result.links[0].clickCount, 50)
		assert.strictEqual(result.links[1].id, 2)
		assert.strictEqual(result.links[1].clickCount, 30)
		assert.strictEqual(result.totalClicks, 80)
		assert.strictEqual(result.pagination.page, 1)
		assert.strictEqual(result.pagination.limit, 10)
		assert.strictEqual(result.pagination.total, 2)
		assert.strictEqual(result.pagination.totalPages, 1)
		assert.strictEqual(findByUserIdWithClickCountMock.mock.calls.length, 1)
		assert.strictEqual(countByUserIdMock.mock.calls.length, 1)
		assert.strictEqual(getTotalClicksByUserIdMock.mock.calls.length, 1)
	})

	test('should return links sorted by recent', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create('abc123'),
			title: 'Test Link',
			isActive: true,
			createdAt: new Date('2025-01-01'),
			expiresAt: null,
		})

		const linksWithClicks = [{ link, clickCount: 10 }]

		const findByUserIdWithClickCountMock = mock.fn(async () => linksWithClicks)
		const countByUserIdMock = mock.fn(async () => 1)
		const getTotalClicksByUserIdMock = mock.fn(async () => 10)

		const mockLinkRepository: LinkRepository = {
			findByUserIdWithClickCount: findByUserIdWithClickCountMock,
			countByUserId: countByUserIdMock,
			getTotalClicksByUserId: getTotalClicksByUserIdMock,
		} as unknown as LinkRepository

		const useCase = new ListAnalyticsLinksUseCase(mockLinkRepository)

		const result = await useCase.execute(10, { sort: 'recent', page: 1, limit: 10 })

		assert.strictEqual(result.type, 'recent')
		assert.strictEqual(result.links.length, 1)
		assert.strictEqual(result.links[0].id, 1)
		assert.strictEqual(result.totalClicks, 10)
		assert.strictEqual(findByUserIdWithClickCountMock.mock.calls.length, 1)
		assert.strictEqual(getTotalClicksByUserIdMock.mock.calls.length, 1)

		const mockCall = findByUserIdWithClickCountMock.mock.calls[0]
		assert.ok(mockCall)
		const [, sortBy] = mockCall.arguments as unknown as [unknown, string]
		assert.strictEqual(sortBy, 'recent')
	})

	test('should handle pagination correctly', async () => {
		const findByUserIdWithClickCountMock = mock.fn(async () => [])
		const countByUserIdMock = mock.fn(async () => 100)
		const getTotalClicksByUserIdMock = mock.fn(async () => 0)

		const mockLinkRepository: LinkRepository = {
			findByUserIdWithClickCount: findByUserIdWithClickCountMock,
			countByUserId: countByUserIdMock,
			getTotalClicksByUserId: getTotalClicksByUserIdMock,
		} as unknown as LinkRepository

		const useCase = new ListAnalyticsLinksUseCase(mockLinkRepository)

		const result = await useCase.execute(10, { sort: 'top', page: 2, limit: 10 })

		assert.strictEqual(result.type, 'top')
		assert.strictEqual(result.totalClicks, 0)
		assert.strictEqual(result.pagination.page, 2)
		assert.strictEqual(result.pagination.limit, 10)
		assert.strictEqual(result.pagination.total, 100)
		assert.strictEqual(result.pagination.totalPages, 10)

		const mockCall = findByUserIdWithClickCountMock.mock.calls[0]
		assert.ok(mockCall)
		const [, , options] = mockCall.arguments as unknown as [unknown, unknown, { offset: number; limit: number }]
		assert.strictEqual(options.offset, 10)
	})

	test('should return empty list when no links found', async () => {
		const findByUserIdWithClickCountMock = mock.fn(async () => [])
		const countByUserIdMock = mock.fn(async () => 0)
		const getTotalClicksByUserIdMock = mock.fn(async () => 0)

		const mockLinkRepository: LinkRepository = {
			findByUserIdWithClickCount: findByUserIdWithClickCountMock,
			countByUserId: countByUserIdMock,
			getTotalClicksByUserId: getTotalClicksByUserIdMock,
		} as unknown as LinkRepository

		const useCase = new ListAnalyticsLinksUseCase(mockLinkRepository)

		const result = await useCase.execute(10, { sort: 'top', page: 1, limit: 10 })

		assert.strictEqual(result.type, 'top')
		assert.strictEqual(result.links.length, 0)
		assert.strictEqual(result.totalClicks, 0)
		assert.strictEqual(result.pagination.total, 0)
		assert.strictEqual(result.pagination.totalPages, 0)
	})
})
