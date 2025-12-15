import * as assert from 'node:assert'

import { Id, Link, ShortCode, Url, type LinkRepository } from '../../../domain'
import { NotFoundError, ForbiddenError } from '../../errors'
import { GetLinkUseCase } from './get-link.use-case'
import { describe, test, mock } from 'node:test'

describe('GetLinkUseCase', () => {
	test('should return link when user owns it', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create('abc123'),
			title: 'My Link',
			isActive: true,
			createdAt: new Date('2025-01-01'),
			expiresAt: null,
		})

		const findByIdMock = mock.fn(async () => link)
		const mockLinkRepository: LinkRepository = {
			findById: findByIdMock,
		} as unknown as LinkRepository

		const useCase = new GetLinkUseCase(mockLinkRepository)

		const result = await useCase.execute(10, 1)

		assert.strictEqual(result.id, 1)
		assert.strictEqual(result.originalUrl, 'https://github.com/omnifaced')
		assert.strictEqual(result.shortCode, 'abc123')
		assert.strictEqual(result.title, 'My Link')
		assert.strictEqual(result.isActive, true)
		assert.strictEqual(findByIdMock.mock.calls.length, 1)
	})

	test('should throw NotFoundError when link does not exist', async () => {
		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => null),
		} as unknown as LinkRepository

		const useCase = new GetLinkUseCase(mockLinkRepository)

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

		const useCase = new GetLinkUseCase(mockLinkRepository)

		await assert.rejects(async () => {
			await useCase.execute(99, 1)
		}, ForbiddenError)
	})

	test('should return link with non-null expiresAt', async () => {
		const expiresAt = new Date('2030-01-01')

		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create('abc123'),
			title: 'Test',
			isActive: true,
			createdAt: new Date(),
			expiresAt,
		})

		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => link),
		} as unknown as LinkRepository

		const useCase = new GetLinkUseCase(mockLinkRepository)

		const result = await useCase.execute(10, 1)

		assert.strictEqual(result.expiresAt, expiresAt.toISOString())
	})
})
