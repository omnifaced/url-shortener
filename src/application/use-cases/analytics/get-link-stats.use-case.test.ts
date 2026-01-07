import * as assert from 'node:assert'

import { Id, Link, ShortCode, Url, type ClickRepository } from '../../../domain'
import { GetLinkStatsUseCase } from './get-link-stats.use-case'
import { NotFoundError, ForbiddenError } from '../../errors'
import type { LinkOwnershipService } from '../../services'
import { describe, test, mock } from 'node:test'

describe('GetLinkStatsUseCase', () => {
	const createMockLink = (
		overrides: Partial<{ title: string | null; createdAt: Date; expiresAt: Date | null }> = {}
	) => {
		return Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create('abc123'),
			title: overrides.title ?? null,
			isActive: true,
			createdAt: overrides.createdAt ?? new Date(),
			expiresAt: overrides.expiresAt ?? null,
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

	test('should return link stats successfully', async () => {
		const link = createMockLink({ title: 'Test Link', createdAt: new Date('2025-01-01') })

		const validateAndGetLinkMock = mock.fn(async () => link)
		const countByLinkIdMock = mock.fn(async () => 15)

		const mockOwnershipService: LinkOwnershipService = {
			validateAndGetLink: validateAndGetLinkMock,
		} as unknown as LinkOwnershipService

		const mockClickRepository: ClickRepository = {
			countByLinkId: countByLinkIdMock,
		} as unknown as ClickRepository

		const useCase = new GetLinkStatsUseCase(mockOwnershipService, mockClickRepository)

		const result = await useCase.execute(10, 1)

		assert.strictEqual(result.link.id, 1)
		assert.strictEqual(result.link.originalUrl, 'https://github.com/omnifaced')
		assert.strictEqual(result.link.shortCode, 'abc123')
		assert.strictEqual(result.link.title, 'Test Link')
		assert.strictEqual(result.totalClicks, 15)
		assert.strictEqual(validateAndGetLinkMock.mock.calls.length, 1)
		assert.strictEqual(countByLinkIdMock.mock.calls.length, 1)
	})

	test('should throw NotFoundError when link does not exist', async () => {
		const mockOwnershipService = createMockOwnershipService(null, new NotFoundError('Link', 999))
		const mockClickRepository: ClickRepository = {} as unknown as ClickRepository

		const useCase = new GetLinkStatsUseCase(mockOwnershipService, mockClickRepository)

		await assert.rejects(async () => {
			await useCase.execute(10, 999)
		}, NotFoundError)
	})

	test('should throw ForbiddenError when user does not own the link', async () => {
		const mockOwnershipService = createMockOwnershipService(
			null,
			new ForbiddenError('You do not have permission to access this link')
		)

		const mockClickRepository: ClickRepository = {} as unknown as ClickRepository

		const useCase = new GetLinkStatsUseCase(mockOwnershipService, mockClickRepository)

		await assert.rejects(async () => {
			await useCase.execute(99, 1)
		}, ForbiddenError)
	})

	test('should handle empty clicks', async () => {
		const link = createMockLink()
		const mockOwnershipService = createMockOwnershipService(link)

		const mockClickRepository: ClickRepository = {
			countByLinkId: mock.fn(async () => 0),
		} as unknown as ClickRepository

		const useCase = new GetLinkStatsUseCase(mockOwnershipService, mockClickRepository)

		const result = await useCase.execute(10, 1)

		assert.strictEqual(result.totalClicks, 0)
	})

	test('should return link stats with expiresAt', async () => {
		const expiresAt = new Date('2025-12-31')
		const link = createMockLink({ expiresAt })
		const mockOwnershipService = createMockOwnershipService(link)

		const mockClickRepository: ClickRepository = {
			countByLinkId: mock.fn(async () => 0),
		} as unknown as ClickRepository

		const useCase = new GetLinkStatsUseCase(mockOwnershipService, mockClickRepository)

		const result = await useCase.execute(10, 1)

		assert.strictEqual(result.link.expiresAt, expiresAt.toISOString())
		assert.strictEqual(result.link.isActive, true)
	})
})
