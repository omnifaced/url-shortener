import * as assert from 'node:assert'

import { Id, Link, ShortCode, Url, Click, type LinkRepository, type ClickRepository } from '../../../domain'
import { GetLinkStatsUseCase } from './get-link-stats.use-case'
import { NotFoundError, ForbiddenError } from '../../errors'
import { describe, test, mock } from 'node:test'

describe('GetLinkStatsUseCase', () => {
	test('should return link stats successfully', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://example.com'),
			shortCode: ShortCode.create('abc123'),
			title: 'Test Link',
			isActive: true,
			createdAt: new Date('2025-01-01'),
			expiresAt: null,
		})

		const clicks = [
			Click.create({
				id: Id.create(1),
				linkId: Id.create(1),
				clickedAt: new Date('2025-01-15'),
				ip: '127.0.0.1',
				userAgent: 'Mozilla/5.0',
				referer: 'https://google.com',
				deviceInfo: null,
			}),
			Click.create({
				id: Id.create(2),
				linkId: Id.create(1),
				clickedAt: new Date('2025-01-16'),
				ip: '192.168.1.1',
				userAgent: 'Chrome',
				referer: 'https://facebook.com',
				deviceInfo: null,
			}),
		]

		const clicksByDate = [
			{ date: '2025-01-15', count: 5 },
			{ date: '2025-01-16', count: 3 },
		]

		const topReferers = [
			{ referer: 'https://google.com', count: 10 },
			{ referer: 'https://facebook.com', count: 5 },
		]

		const findByIdMock = mock.fn(async () => link)
		const countByLinkIdMock = mock.fn(async () => 15)
		const findByLinkIdMock = mock.fn(async () => clicks)
		const getClicksByDateMock = mock.fn(async () => clicksByDate)
		const getTopReferersMock = mock.fn(async () => topReferers)

		const mockLinkRepository: LinkRepository = {
			findById: findByIdMock,
		} as unknown as LinkRepository

		const mockClickRepository: ClickRepository = {
			countByLinkId: countByLinkIdMock,
			findByLinkId: findByLinkIdMock,
			getClicksByDate: getClicksByDateMock,
			getTopReferers: getTopReferersMock,
		} as unknown as ClickRepository

		const useCase = new GetLinkStatsUseCase(mockLinkRepository, mockClickRepository)

		const result = await useCase.execute(10, 1)

		assert.strictEqual(result.link.id, 1)
		assert.strictEqual(result.link.originalUrl, 'https://example.com')
		assert.strictEqual(result.link.shortCode, 'abc123')
		assert.strictEqual(result.link.title, 'Test Link')
		assert.strictEqual(result.totalClicks, 15)
		assert.strictEqual(result.recentClicks.length, 2)
		assert.strictEqual(result.recentClicks[0].id, 1)
		assert.strictEqual(result.recentClicks[0].ip, '127.0.0.1')
		assert.strictEqual(result.clicksByDate.length, 2)
		assert.strictEqual(result.topReferers.length, 2)
		assert.strictEqual(findByIdMock.mock.calls.length, 1)
		assert.strictEqual(countByLinkIdMock.mock.calls.length, 1)
		assert.strictEqual(findByLinkIdMock.mock.calls.length, 1)
		assert.strictEqual(getClicksByDateMock.mock.calls.length, 1)
		assert.strictEqual(getTopReferersMock.mock.calls.length, 1)
	})

	test('should throw NotFoundError when link does not exist', async () => {
		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => null),
		} as unknown as LinkRepository

		const mockClickRepository: ClickRepository = {} as unknown as ClickRepository

		const useCase = new GetLinkStatsUseCase(mockLinkRepository, mockClickRepository)

		await assert.rejects(async () => {
			await useCase.execute(10, 999)
		}, NotFoundError)
	})

	test('should throw ForbiddenError when user does not own the link', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://example.com'),
			shortCode: ShortCode.create('abc123'),
			title: null,
			isActive: true,
			createdAt: new Date(),
			expiresAt: null,
		})

		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => link),
		} as unknown as LinkRepository

		const mockClickRepository: ClickRepository = {} as unknown as ClickRepository

		const useCase = new GetLinkStatsUseCase(mockLinkRepository, mockClickRepository)

		await assert.rejects(async () => {
			await useCase.execute(99, 1)
		}, ForbiddenError)
	})

	test('should handle empty recent clicks', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://example.com'),
			shortCode: ShortCode.create('abc123'),
			title: null,
			isActive: true,
			createdAt: new Date(),
			expiresAt: null,
		})

		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => link),
		} as unknown as LinkRepository

		const mockClickRepository: ClickRepository = {
			countByLinkId: mock.fn(async () => 0),
			findByLinkId: mock.fn(async () => []),
			getClicksByDate: mock.fn(async () => []),
			getTopReferers: mock.fn(async () => []),
		} as unknown as ClickRepository

		const useCase = new GetLinkStatsUseCase(mockLinkRepository, mockClickRepository)

		const result = await useCase.execute(10, 1)

		assert.strictEqual(result.totalClicks, 0)
		assert.strictEqual(result.recentClicks.length, 0)
		assert.strictEqual(result.clicksByDate.length, 0)
		assert.strictEqual(result.topReferers.length, 0)
	})

	test('should return link stats with expiresAt', async () => {
		const expiresAt = new Date('2025-12-31')
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://example.com'),
			shortCode: ShortCode.create('abc123'),
			title: null,
			isActive: true,
			createdAt: new Date(),
			expiresAt,
		})

		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => link),
		} as unknown as LinkRepository

		const mockClickRepository: ClickRepository = {
			countByLinkId: mock.fn(async () => 0),
			findByLinkId: mock.fn(async () => []),
			getClicksByDate: mock.fn(async () => []),
			getTopReferers: mock.fn(async () => []),
		} as unknown as ClickRepository

		const useCase = new GetLinkStatsUseCase(mockLinkRepository, mockClickRepository)

		const result = await useCase.execute(10, 1)

		assert.strictEqual(result.link.expiresAt, expiresAt.toISOString())
		assert.strictEqual(result.link.isActive, true)
	})
})
