import * as assert from 'node:assert'

import { Click, Id, Link, ShortCode, Url, type ClickRepository } from '../../../domain'
import { GetLinkClicksUseCase } from './get-link-clicks.use-case'
import { ForbiddenError, NotFoundError } from '../../errors'
import type { LinkOwnershipService } from '../../services'
import { describe, mock, test } from 'node:test'

describe('GetLinkClicksUseCase', () => {
	const createMockLink = () => {
		return Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create('abc123'),
			title: 'Test Link',
			isActive: true,
			createdAt: new Date('2025-01-01'),
			expiresAt: null,
		})
	}

	const createMockOwnershipService = (link: Link | null, shouldThrow?: Error) => {
		return {
			validateAndGetLink: mock.fn(async () => {
				if (shouldThrow) {
					throw shouldThrow
				}

				return link
			}),
		} as unknown as LinkOwnershipService
	}

	test('should return recent clicks with pagination', async () => {
		const link = createMockLink()

		const clicks = [
			Click.create({
				id: Id.create(1),
				linkId: Id.create(1),
				clickedAt: new Date('2025-01-15'),
				ip: '127.0.0.1',
				userAgent: 'Mozilla/5.0',
				referer: 'https://github.com/omnifaced',
				deviceInfo: null,
			}),
			Click.create({
				id: Id.create(2),
				linkId: Id.create(1),
				clickedAt: new Date('2025-01-16'),
				ip: '192.168.1.1',
				userAgent: 'Chrome',
				referer: 'https://github.com/omnifaced',
				deviceInfo: null,
			}),
		]

		const validateAndGetLinkMock = mock.fn(async () => link)
		const findByLinkIdPaginatedMock = mock.fn(async () => ({
			items: clicks,
			total: 2,
		}))

		const mockOwnershipService: LinkOwnershipService = {
			validateAndGetLink: validateAndGetLinkMock,
		} as unknown as LinkOwnershipService

		const mockClickRepository: ClickRepository = {
			findByLinkIdPaginated: findByLinkIdPaginatedMock,
		} as unknown as ClickRepository

		const useCase = new GetLinkClicksUseCase(mockOwnershipService, mockClickRepository)

		const result = await useCase.execute(10, 1, { type: 'recent', page: 1, limit: 10 })

		assert.strictEqual(result.type, 'recent')
		assert.strictEqual(result.clicks.length, 2)

		if (result.type === 'recent') {
			const firstClick = result.clicks[0]
			assert.strictEqual(firstClick.id, 1)
			assert.strictEqual(firstClick.ip, '127.0.0.1')
		}

		assert.strictEqual(result.pagination.page, 1)
		assert.strictEqual(result.pagination.limit, 10)
		assert.strictEqual(result.pagination.total, 2)
		assert.strictEqual(result.pagination.totalPages, 1)
		assert.strictEqual(validateAndGetLinkMock.mock.calls.length, 1)
		assert.strictEqual(findByLinkIdPaginatedMock.mock.calls.length, 1)
	})

	test('should return top referers with pagination', async () => {
		const link = createMockLink()

		const topReferers = [
			{ referer: 'https://github.com/omnifaced', count: 10 },
			{ referer: 'https://github.com/omnifaced', count: 5 },
		]

		const validateAndGetLinkMock = mock.fn(async () => link)
		const getTopReferersPaginatedMock = mock.fn(async () => ({
			items: topReferers,
			total: 2,
		}))

		const mockOwnershipService: LinkOwnershipService = {
			validateAndGetLink: validateAndGetLinkMock,
		} as unknown as LinkOwnershipService

		const mockClickRepository: ClickRepository = {
			getTopReferersPaginated: getTopReferersPaginatedMock,
		} as unknown as ClickRepository

		const useCase = new GetLinkClicksUseCase(mockOwnershipService, mockClickRepository)

		const result = await useCase.execute(10, 1, { type: 'referers', page: 1, limit: 10 })

		assert.strictEqual(result.type, 'referers')
		assert.strictEqual(result.referers.length, 2)

		if (result.type === 'referers') {
			const firstReferer = result.referers[0]
			assert.strictEqual(firstReferer.referer, 'https://github.com/omnifaced')
			assert.strictEqual(firstReferer.count, 10)
		}

		assert.strictEqual(result.pagination.page, 1)
		assert.strictEqual(result.pagination.limit, 10)
		assert.strictEqual(result.pagination.total, 2)
		assert.strictEqual(validateAndGetLinkMock.mock.calls.length, 1)
		assert.strictEqual(getTopReferersPaginatedMock.mock.calls.length, 1)
	})

	test('should throw NotFoundError when link does not exist', async () => {
		const mockOwnershipService = createMockOwnershipService(null, new NotFoundError('Link', 999))
		const mockClickRepository: ClickRepository = {} as unknown as ClickRepository

		const useCase = new GetLinkClicksUseCase(mockOwnershipService, mockClickRepository)

		await assert.rejects(async () => {
			await useCase.execute(10, 999, { type: 'recent', page: 1, limit: 10 })
		}, NotFoundError)
	})

	test('should throw ForbiddenError when user does not own the link', async () => {
		const mockOwnershipService = createMockOwnershipService(
			null,
			new ForbiddenError('You do not have permission to access this link')
		)

		const mockClickRepository: ClickRepository = {} as unknown as ClickRepository

		const useCase = new GetLinkClicksUseCase(mockOwnershipService, mockClickRepository)

		await assert.rejects(async () => {
			await useCase.execute(10, 1, { type: 'recent', page: 1, limit: 10 })
		}, ForbiddenError)
	})

	test('should handle empty results', async () => {
		const link = createMockLink()
		const mockOwnershipService = createMockOwnershipService(link)

		const mockClickRepository: ClickRepository = {
			findByLinkIdPaginated: mock.fn(async () => ({ items: [], total: 0 })),
		} as unknown as ClickRepository

		const useCase = new GetLinkClicksUseCase(mockOwnershipService, mockClickRepository)

		const result = await useCase.execute(10, 1, { type: 'recent', page: 1, limit: 10 })

		assert.strictEqual(result.type, 'recent')
		assert.strictEqual(result.clicks.length, 0)
		assert.strictEqual(result.pagination.total, 0)
		assert.strictEqual(result.pagination.totalPages, 0)
	})

	test('should handle pagination with offset', async () => {
		const link = createMockLink()
		const mockOwnershipService = createMockOwnershipService(link)

		const findByLinkIdPaginatedMock = mock.fn(async () => ({
			items: [],
			total: 100,
		}))

		const mockClickRepository: ClickRepository = {
			findByLinkIdPaginated: findByLinkIdPaginatedMock,
		} as unknown as ClickRepository

		const useCase = new GetLinkClicksUseCase(mockOwnershipService, mockClickRepository)

		const result = await useCase.execute(10, 1, { type: 'recent', page: 3, limit: 10 })

		assert.strictEqual(result.type, 'recent')
		assert.strictEqual(result.pagination.page, 3)
		assert.strictEqual(result.pagination.totalPages, 10)

		const mockCall = findByLinkIdPaginatedMock.mock.calls[0]
		assert.ok(mockCall)
		const [, limit, offset] = mockCall.arguments as unknown as [unknown, number, number]
		assert.strictEqual(limit, 10)
		assert.strictEqual(offset, 20)
	})
})
