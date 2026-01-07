import * as assert from 'node:assert'

import { Id, Link, ShortCode, Url, type LinkRepository } from '../../../domain'
import { NotFoundError, ForbiddenError } from '../../errors'
import { UpdateLinkUseCase } from './update-link.use-case'
import type { LinkOwnershipService } from '../../services'
import { describe, test, mock } from 'node:test'

describe('UpdateLinkUseCase', () => {
	const createMockLink = (
		overrides: Partial<{ title: string | null; isActive: boolean; expiresAt: Date | null }> = {}
	) => {
		return Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create('abc123'),
			title: overrides.title ?? null,
			isActive: overrides.isActive ?? true,
			createdAt: new Date(),
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

	test('should update link title', async () => {
		const link = createMockLink({ title: 'Old Title' })
		const mockOwnershipService = createMockOwnershipService(link)
		const updateMock = mock.fn(async () => {})

		const mockLinkRepository: LinkRepository = {
			update: updateMock,
		} as unknown as LinkRepository

		const useCase = new UpdateLinkUseCase(mockOwnershipService, mockLinkRepository)

		const result = await useCase.execute(10, 1, {
			title: 'New Title',
		})

		assert.strictEqual(result.title, 'New Title')
		assert.strictEqual(updateMock.mock.calls.length, 1)
	})

	test('should deactivate link', async () => {
		const link = createMockLink({ isActive: true })
		const mockOwnershipService = createMockOwnershipService(link)

		const mockLinkRepository: LinkRepository = {
			update: mock.fn(async () => {}),
		} as unknown as LinkRepository

		const useCase = new UpdateLinkUseCase(mockOwnershipService, mockLinkRepository)

		const result = await useCase.execute(10, 1, {
			isActive: false,
		})

		assert.strictEqual(result.isActive, false)
	})

	test('should activate link', async () => {
		const link = createMockLink({ isActive: false })
		const mockOwnershipService = createMockOwnershipService(link)

		const mockLinkRepository: LinkRepository = {
			update: mock.fn(async () => {}),
		} as unknown as LinkRepository

		const useCase = new UpdateLinkUseCase(mockOwnershipService, mockLinkRepository)

		const result = await useCase.execute(10, 1, {
			isActive: true,
		})

		assert.strictEqual(result.isActive, true)
	})

	test('should update both title and isActive', async () => {
		const link = createMockLink({ title: 'Old Title', isActive: true })
		const mockOwnershipService = createMockOwnershipService(link)

		const mockLinkRepository: LinkRepository = {
			update: mock.fn(async () => {}),
		} as unknown as LinkRepository

		const useCase = new UpdateLinkUseCase(mockOwnershipService, mockLinkRepository)

		const result = await useCase.execute(10, 1, {
			title: 'New Title',
			isActive: false,
		})

		assert.strictEqual(result.title, 'New Title')
		assert.strictEqual(result.isActive, false)
	})

	test('should throw NotFoundError when link does not exist', async () => {
		const mockOwnershipService = createMockOwnershipService(null, new NotFoundError('Link', 1))
		const mockLinkRepository: LinkRepository = {} as unknown as LinkRepository

		const useCase = new UpdateLinkUseCase(mockOwnershipService, mockLinkRepository)

		await assert.rejects(async () => {
			await useCase.execute(10, 1, { title: 'New Title' })
		}, NotFoundError)
	})

	test('should throw ForbiddenError when user does not own the link', async () => {
		const mockOwnershipService = createMockOwnershipService(
			null,
			new ForbiddenError('You do not have permission to access this link')
		)

		const mockLinkRepository: LinkRepository = {} as unknown as LinkRepository

		const useCase = new UpdateLinkUseCase(mockOwnershipService, mockLinkRepository)

		await assert.rejects(async () => {
			await useCase.execute(99, 1, { title: 'New Title' })
		}, ForbiddenError)
	})

	test('should handle link with expiration date', async () => {
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
		const link = createMockLink({ title: 'Test Link', expiresAt })
		const mockOwnershipService = createMockOwnershipService(link)
		const updateMock = mock.fn(async () => {})

		const mockLinkRepository: LinkRepository = {
			update: updateMock,
		} as unknown as LinkRepository

		const useCase = new UpdateLinkUseCase(mockOwnershipService, mockLinkRepository)

		const result = await useCase.execute(10, 1, {
			title: 'Updated Title',
		})

		assert.strictEqual(result.title, 'Updated Title')
		assert.strictEqual(result.expiresAt, expiresAt.toISOString())
		assert.strictEqual(updateMock.mock.calls.length, 1)
	})
})
