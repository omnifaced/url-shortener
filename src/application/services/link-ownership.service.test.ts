import * as assert from 'node:assert'

import { Id, Link, ShortCode, Url, type LinkRepository } from '../../domain'
import { LinkOwnershipService } from './link-ownership.service'
import { NotFoundError, ForbiddenError } from '../errors'
import { describe, test, mock } from 'node:test'

describe('LinkOwnershipService', () => {
	const createMockLink = (userId = 10) => {
		return Link.create({
			id: Id.create(1),
			userId: Id.create(userId),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create('abc123'),
			title: null,
			isActive: true,
			createdAt: new Date(),
			expiresAt: null,
		})
	}

	test('should return link when user owns it', async () => {
		const link = createMockLink(10)
		const findByIdMock = mock.fn(async () => link)

		const mockLinkRepository: LinkRepository = {
			findById: findByIdMock,
		} as unknown as LinkRepository

		const service = new LinkOwnershipService(mockLinkRepository)

		const result = await service.validateAndGetLink(10, 1)

		assert.strictEqual(result, link)
		assert.strictEqual(findByIdMock.mock.calls.length, 1)
	})

	test('should throw NotFoundError when link does not exist', async () => {
		const findByIdMock = mock.fn(async () => null)

		const mockLinkRepository: LinkRepository = {
			findById: findByIdMock,
		} as unknown as LinkRepository

		const service = new LinkOwnershipService(mockLinkRepository)

		await assert.rejects(async () => service.validateAndGetLink(10, 1), NotFoundError)
	})

	test('should throw ForbiddenError when user does not own the link', async () => {
		const link = createMockLink(10)
		const findByIdMock = mock.fn(async () => link)

		const mockLinkRepository: LinkRepository = {
			findById: findByIdMock,
		} as unknown as LinkRepository

		const service = new LinkOwnershipService(mockLinkRepository)

		await assert.rejects(async () => service.validateAndGetLink(99, 1), ForbiddenError)
	})
})
