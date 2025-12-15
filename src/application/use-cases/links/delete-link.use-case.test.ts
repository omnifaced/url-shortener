import * as assert from 'node:assert'

import { Id, Link, ShortCode, Url, type LinkRepository } from '../../../domain'
import { NotFoundError, ForbiddenError } from '../../errors'
import { DeleteLinkUseCase } from './delete-link.use-case'
import { describe, test, mock } from 'node:test'

describe('DeleteLinkUseCase', () => {
	test('should delete link when user owns it', async () => {
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

		const findByIdMock = mock.fn(async () => link)
		const deleteMock = mock.fn(async () => {})
		const mockLinkRepository: LinkRepository = {
			findById: findByIdMock,
			delete: deleteMock,
		} as unknown as LinkRepository

		const useCase = new DeleteLinkUseCase(mockLinkRepository)

		await useCase.execute(10, 1)

		assert.strictEqual(findByIdMock.mock.calls.length, 1)
		assert.strictEqual(deleteMock.mock.calls.length, 1)
	})

	test('should throw NotFoundError when link does not exist', async () => {
		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => null),
		} as unknown as LinkRepository

		const useCase = new DeleteLinkUseCase(mockLinkRepository)

		await assert.rejects(async () => {
			await useCase.execute(10, 1)
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

		const useCase = new DeleteLinkUseCase(mockLinkRepository)

		await assert.rejects(async () => {
			await useCase.execute(99, 1)
		}, ForbiddenError)
	})
})
