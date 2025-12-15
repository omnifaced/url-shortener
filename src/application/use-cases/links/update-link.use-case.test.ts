import * as assert from 'node:assert'

import { Id, Link, ShortCode, Url, type LinkRepository } from '../../../domain'
import { NotFoundError, ForbiddenError } from '../../errors'
import { UpdateLinkUseCase } from './update-link.use-case'
import { describe, test, mock } from 'node:test'

describe('UpdateLinkUseCase', () => {
	test('should update link title', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create('abc123'),
			title: 'Old Title',
			isActive: true,
			createdAt: new Date(),
			expiresAt: null,
		})

		const updateMock = mock.fn(async () => {})
		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => link),
			update: updateMock,
		} as unknown as LinkRepository

		const useCase = new UpdateLinkUseCase(mockLinkRepository)

		const result = await useCase.execute(10, 1, {
			title: 'New Title',
		})

		assert.strictEqual(result.title, 'New Title')
		assert.strictEqual(updateMock.mock.calls.length, 1)
	})

	test('should deactivate link', async () => {
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
			update: mock.fn(async () => {}),
		} as unknown as LinkRepository

		const useCase = new UpdateLinkUseCase(mockLinkRepository)

		const result = await useCase.execute(10, 1, {
			isActive: false,
		})

		assert.strictEqual(result.isActive, false)
	})

	test('should activate link', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create('abc123'),
			title: null,
			isActive: false,
			createdAt: new Date(),
			expiresAt: null,
		})

		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => link),
			update: mock.fn(async () => {}),
		} as unknown as LinkRepository

		const useCase = new UpdateLinkUseCase(mockLinkRepository)

		const result = await useCase.execute(10, 1, {
			isActive: true,
		})

		assert.strictEqual(result.isActive, true)
	})

	test('should update both title and isActive', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create('abc123'),
			title: 'Old Title',
			isActive: true,
			createdAt: new Date(),
			expiresAt: null,
		})

		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => link),
			update: mock.fn(async () => {}),
		} as unknown as LinkRepository

		const useCase = new UpdateLinkUseCase(mockLinkRepository)

		const result = await useCase.execute(10, 1, {
			title: 'New Title',
			isActive: false,
		})

		assert.strictEqual(result.title, 'New Title')
		assert.strictEqual(result.isActive, false)
	})

	test('should throw NotFoundError when link does not exist', async () => {
		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => null),
		} as unknown as LinkRepository

		const useCase = new UpdateLinkUseCase(mockLinkRepository)

		await assert.rejects(async () => {
			await useCase.execute(10, 1, { title: 'New Title' })
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

		const useCase = new UpdateLinkUseCase(mockLinkRepository)

		await assert.rejects(async () => {
			await useCase.execute(99, 1, { title: 'New Title' })
		}, ForbiddenError)
	})

	test('should handle link with expiration date', async () => {
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: ShortCode.create('abc123'),
			title: 'Test Link',
			isActive: true,
			createdAt: new Date(),
			expiresAt: expiresAt,
		})

		const updateMock = mock.fn(async () => {})
		const mockLinkRepository: LinkRepository = {
			findById: mock.fn(async () => link),
			update: updateMock,
		} as unknown as LinkRepository

		const useCase = new UpdateLinkUseCase(mockLinkRepository)

		const result = await useCase.execute(10, 1, {
			title: 'Updated Title',
		})

		assert.strictEqual(result.title, 'Updated Title')
		assert.strictEqual(result.expiresAt, expiresAt.toISOString())
		assert.strictEqual(updateMock.mock.calls.length, 1)
	})
})
