import * as assert from 'node:assert'

import { createMockLink, createMockOwnershipService } from './links.test-helpers'
import { NotFoundError, ForbiddenError } from '../../errors'
import { DeleteLinkUseCase } from './delete-link.use-case'
import type { LinkOwnershipService } from '../../services'
import type { LinkRepository } from '../../../domain'
import { describe, test, mock } from 'node:test'

describe('DeleteLinkUseCase', () => {
	test('should delete link when user owns it', async () => {
		const link = createMockLink()
		const validateAndGetLinkMock = mock.fn(async () => link)
		const deleteMock = mock.fn(async () => {})

		const mockOwnershipService: LinkOwnershipService = {
			validateAndGetLink: validateAndGetLinkMock,
		} as unknown as LinkOwnershipService

		const mockLinkRepository: LinkRepository = {
			delete: deleteMock,
		} as unknown as LinkRepository

		const useCase = new DeleteLinkUseCase(mockOwnershipService, mockLinkRepository)

		await useCase.execute(10, 1)

		assert.strictEqual(validateAndGetLinkMock.mock.calls.length, 1)
		assert.strictEqual(deleteMock.mock.calls.length, 1)
	})

	test('should throw NotFoundError when link does not exist', async () => {
		const mockOwnershipService = createMockOwnershipService(null, new NotFoundError('Link', 1))
		const mockLinkRepository: LinkRepository = {} as unknown as LinkRepository

		const useCase = new DeleteLinkUseCase(mockOwnershipService, mockLinkRepository)

		await assert.rejects(async () => {
			await useCase.execute(10, 1)
		}, NotFoundError)
	})

	test('should throw ForbiddenError when user does not own the link', async () => {
		const mockOwnershipService = createMockOwnershipService(
			null,
			new ForbiddenError('You do not have permission to access this link')
		)

		const mockLinkRepository: LinkRepository = {} as unknown as LinkRepository

		const useCase = new DeleteLinkUseCase(mockOwnershipService, mockLinkRepository)

		await assert.rejects(async () => {
			await useCase.execute(99, 1)
		}, ForbiddenError)
	})
})
