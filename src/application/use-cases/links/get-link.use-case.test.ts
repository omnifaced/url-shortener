import * as assert from 'node:assert'

import { NotFoundError, ForbiddenError } from '../../errors'
import { Id, Link, ShortCode, Url } from '../../../domain'
import type { LinkOwnershipService } from '../../services'
import { GetLinkUseCase } from './get-link.use-case'
import { describe, test, mock } from 'node:test'

describe('GetLinkUseCase', () => {
	const createMockLink = (
		overrides: Partial<{ title: string | null; expiresAt: Date | null; createdAt: Date }> = {}
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

	test('should return link when user owns it', async () => {
		const link = createMockLink({ title: 'My Link', createdAt: new Date('2025-01-01') })
		const validateAndGetLinkMock = mock.fn(async () => link)

		const mockOwnershipService: LinkOwnershipService = {
			validateAndGetLink: validateAndGetLinkMock,
		} as unknown as LinkOwnershipService

		const useCase = new GetLinkUseCase(mockOwnershipService)

		const result = await useCase.execute(10, 1)

		assert.strictEqual(result.id, 1)
		assert.strictEqual(result.originalUrl, 'https://github.com/omnifaced')
		assert.strictEqual(result.shortCode, 'abc123')
		assert.strictEqual(result.title, 'My Link')
		assert.strictEqual(result.isActive, true)
		assert.strictEqual(validateAndGetLinkMock.mock.calls.length, 1)
	})

	test('should throw NotFoundError when link does not exist', async () => {
		const mockOwnershipService = createMockOwnershipService(null, new NotFoundError('Link', 1))

		const useCase = new GetLinkUseCase(mockOwnershipService)

		await assert.rejects(async () => {
			await useCase.execute(10, 1)
		}, NotFoundError)
	})

	test('should throw ForbiddenError when user does not own the link', async () => {
		const mockOwnershipService = createMockOwnershipService(
			null,
			new ForbiddenError('You do not have permission to access this link')
		)

		const useCase = new GetLinkUseCase(mockOwnershipService)

		await assert.rejects(async () => {
			await useCase.execute(99, 1)
		}, ForbiddenError)
	})

	test('should return link with non-null expiresAt', async () => {
		const expiresAt = new Date('2030-01-01')
		const link = createMockLink({ title: 'Test', expiresAt })
		const mockOwnershipService = createMockOwnershipService(link)

		const useCase = new GetLinkUseCase(mockOwnershipService)

		const result = await useCase.execute(10, 1)

		assert.strictEqual(result.expiresAt, expiresAt.toISOString())
	})
})
