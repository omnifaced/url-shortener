import * as assert from 'node:assert'

import { Id, Link, ShortCode, Url, type LinkRepository } from '../../../domain'
import { ListLinksUseCase } from './list-links.use-case'
import { describe, test, mock } from 'node:test'

describe('ListLinksUseCase', () => {
	test('should return paginated links for user', async () => {
		const links = [
			Link.create({
				id: Id.create(1),
				userId: Id.create(10),
				originalUrl: Url.create('https://example1.com'),
				shortCode: ShortCode.create('abc123'),
				title: 'Link 1',
				isActive: true,
				createdAt: new Date(),
				expiresAt: null,
			}),
			Link.create({
				id: Id.create(2),
				userId: Id.create(10),
				originalUrl: Url.create('https://example2.com'),
				shortCode: ShortCode.create('def456'),
				title: 'Link 2',
				isActive: true,
				createdAt: new Date(),
				expiresAt: null,
			}),
		]

		const mockLinkRepository: LinkRepository = {
			findByUserId: mock.fn(async () => links),
			countByUserId: mock.fn(async () => 10),
		} as unknown as LinkRepository

		const useCase = new ListLinksUseCase(mockLinkRepository)

		const result = await useCase.execute(10, {
			page: 1,
			limit: 10,
		})

		assert.strictEqual(result.links.length, 2)
		assert.strictEqual(result.links[0].id, 1)
		assert.strictEqual(result.links[1].id, 2)
		assert.strictEqual(result.pagination.page, 1)
		assert.strictEqual(result.pagination.limit, 10)
		assert.strictEqual(result.pagination.total, 10)
		assert.strictEqual(result.pagination.totalPages, 1)
	})

	test('should calculate correct offset for page 2', async () => {
		let capturedUserId: Id | null = null
		let capturedOptions: { offset: number; limit: number } | undefined

		const findByUserIdMock = mock.fn(async (userId: Id, options: { offset: number; limit: number }) => {
			capturedUserId = userId
			capturedOptions = options
			return []
		})

		const mockLinkRepository: LinkRepository = {
			findByUserId: findByUserIdMock,
			countByUserId: mock.fn(async () => 20),
		} as unknown as LinkRepository

		const useCase = new ListLinksUseCase(mockLinkRepository)

		await useCase.execute(10, {
			page: 2,
			limit: 10,
		})

		assert.strictEqual(capturedUserId!.getValue(), 10)
		assert.strictEqual(capturedOptions?.offset, 10)
		assert.strictEqual(capturedOptions?.limit, 10)
	})

	test('should calculate correct totalPages', async () => {
		const mockLinkRepository: LinkRepository = {
			findByUserId: mock.fn(async () => []),
			countByUserId: mock.fn(async () => 25),
		} as unknown as LinkRepository

		const useCase = new ListLinksUseCase(mockLinkRepository)

		const result = await useCase.execute(10, {
			page: 1,
			limit: 10,
		})

		assert.strictEqual(result.pagination.totalPages, 3)
	})

	test('should return empty list when user has no links', async () => {
		const mockLinkRepository: LinkRepository = {
			findByUserId: mock.fn(async () => []),
			countByUserId: mock.fn(async () => 0),
		} as unknown as LinkRepository

		const useCase = new ListLinksUseCase(mockLinkRepository)

		const result = await useCase.execute(10, {
			page: 1,
			limit: 10,
		})

		assert.strictEqual(result.links.length, 0)
		assert.strictEqual(result.pagination.total, 0)
		assert.strictEqual(result.pagination.totalPages, 0)
	})

	test('should return non-null expiresAt for links that have expiration date', async () => {
		const expiresAt1 = new Date('2030-01-01')
		const expiresAt2 = new Date('2031-01-01')

		const links = [
			Link.create({
				id: Id.create(1),
				userId: Id.create(10),
				originalUrl: Url.create('https://example1.com'),
				shortCode: ShortCode.create('abc123'),
				title: 'Link 1',
				isActive: true,
				createdAt: new Date(),
				expiresAt: expiresAt1,
			}),
			Link.create({
				id: Id.create(2),
				userId: Id.create(10),
				originalUrl: Url.create('https://example2.com'),
				shortCode: ShortCode.create('def456'),
				title: 'Link 2',
				isActive: true,
				createdAt: new Date(),
				expiresAt: expiresAt2,
			}),
		]

		const mockLinkRepository: LinkRepository = {
			findByUserId: mock.fn(async () => links),
			countByUserId: mock.fn(async () => 2),
		} as unknown as LinkRepository

		const useCase = new ListLinksUseCase(mockLinkRepository)

		const result = await useCase.execute(10, {
			page: 1,
			limit: 10,
		})

		assert.strictEqual(result.links[0].expiresAt, expiresAt1.toISOString())
		assert.strictEqual(result.links[1].expiresAt, expiresAt2.toISOString())
	})
})
