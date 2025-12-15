import * as assert from 'node:assert'

import { Id, Link, ShortCode, Url, type LinkRepository, type ClickRepository } from '../../../domain'
import { GetClicksByDateUseCase } from './get-clicks-by-date.use-case'
import { NotFoundError, ForbiddenError } from '../../errors'
import { describe, test, mock } from 'node:test'

describe('GetClicksByDateUseCase', () => {
	test('should return clicks by date with pagination', async () => {
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

		const clicksByDate = [
			{ date: '2025-01-10', count: 5 },
			{ date: '2025-01-11', count: 8 },
			{ date: '2025-01-12', count: 3 },
		]

		const findByIdMock = mock.fn(async () => link)
		const getClicksByDateMock = mock.fn(async () => clicksByDate)

		const mockLinkRepository: LinkRepository = {
			findById: findByIdMock,
		} as unknown as LinkRepository

		const mockClickRepository: ClickRepository = {
			getClicksByDate: getClicksByDateMock,
		} as unknown as ClickRepository

		const useCase = new GetClicksByDateUseCase(mockLinkRepository, mockClickRepository)

		const result = await useCase.execute(10, 1, { days: 30, page: 1, limit: 10 })

		assert.strictEqual(result.items.length, 3)
		assert.strictEqual(result.items[0].date, '2025-01-10')
		assert.strictEqual(result.items[0].count, 5)
		assert.strictEqual(result.pagination.page, 1)
		assert.strictEqual(result.pagination.limit, 10)
		assert.strictEqual(result.pagination.total, 3)
		assert.strictEqual(result.pagination.totalPages, 1)
	})

	test('should throw NotFoundError when link does not exist', async () => {
		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => null),
		} as unknown as LinkRepository

		const mockClickRepository: ClickRepository = {} as unknown as ClickRepository

		const useCase = new GetClicksByDateUseCase(mockLinkRepository, mockClickRepository)

		await assert.rejects(async () => {
			await useCase.execute(10, 999, { days: 30, page: 1, limit: 10 })
		}, NotFoundError)
	})

	test('should throw ForbiddenError when user does not own the link', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
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

		const useCase = new GetClicksByDateUseCase(mockLinkRepository, mockClickRepository)

		await assert.rejects(async () => {
			await useCase.execute(99, 1, { days: 30, page: 1, limit: 10 })
		}, ForbiddenError)
	})

	test('should handle pagination correctly', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create('abc123'),
			title: null,
			isActive: true,
			createdAt: new Date(),
			expiresAt: null,
		})

		const clicksByDate = Array.from({ length: 25 }, (_, i) => ({
			date: `2025-01-${String(i + 1).padStart(2, '0')}`,
			count: i + 1,
		}))

		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => link),
		} as unknown as LinkRepository

		const mockClickRepository: ClickRepository = {
			getClicksByDate: mock.fn(async () => clicksByDate),
		} as unknown as ClickRepository

		const useCase = new GetClicksByDateUseCase(mockLinkRepository, mockClickRepository)

		const result = await useCase.execute(10, 1, { days: 30, page: 2, limit: 10 })

		assert.strictEqual(result.items.length, 10)
		assert.strictEqual(result.items[0].date, '2025-01-11')
		assert.strictEqual(result.pagination.page, 2)
		assert.strictEqual(result.pagination.limit, 10)
		assert.strictEqual(result.pagination.total, 25)
		assert.strictEqual(result.pagination.totalPages, 3)
	})

	test('should handle empty results', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
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
			getClicksByDate: mock.fn(async () => []),
		} as unknown as ClickRepository

		const useCase = new GetClicksByDateUseCase(mockLinkRepository, mockClickRepository)

		const result = await useCase.execute(10, 1, { days: 30, page: 1, limit: 10 })

		assert.strictEqual(result.items.length, 0)
		assert.strictEqual(result.pagination.total, 0)
		assert.strictEqual(result.pagination.totalPages, 0)
	})
})
