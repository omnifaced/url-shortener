import * as assert from 'node:assert'

import { Id, Link, ShortCode, Url, type LinkRepository, type ShortCodeService } from '../../../domain'
import { CreateLinkUseCase } from './create-link.use-case'
import { describe, test, mock } from 'node:test'

describe('CreateLinkUseCase', () => {
	test('should create link with required fields', async () => {
		const mockShortCode = ShortCode.create('abc123')
		const generateUniqueCodeMock = mock.fn(async () => mockShortCode)
		const mockShortCodeService: ShortCodeService = {
			generateUniqueCode: generateUniqueCodeMock,
		} as unknown as ShortCodeService

		const savedLink = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: mockShortCode,
			title: null,
			isActive: true,
			createdAt: new Date(),
			expiresAt: null,
		})

		const saveMock = mock.fn(async () => savedLink)
		const mockLinkRepository: LinkRepository = {
			save: saveMock,
		} as unknown as LinkRepository

		const useCase = new CreateLinkUseCase(mockLinkRepository, mockShortCodeService)

		const result = await useCase.execute(10, {
			originalUrl: 'https://github.com/omnifaced',
		})

		assert.strictEqual(result.id, 1)
		assert.strictEqual(result.originalUrl, 'https://github.com/omnifaced')
		assert.strictEqual(result.shortCode, 'abc123')
		assert.strictEqual(result.title, null)
		assert.strictEqual(result.isActive, true)
		assert.strictEqual(generateUniqueCodeMock.mock.calls.length, 1)
		assert.strictEqual(saveMock.mock.calls.length, 1)
	})

	test('should create link with title', async () => {
		const mockShortCode = ShortCode.create('abc123')
		const generateUniqueCodeMock = mock.fn(async () => mockShortCode)
		const mockShortCodeService: ShortCodeService = {
			generateUniqueCode: generateUniqueCodeMock,
		} as unknown as ShortCodeService

		const savedLink = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: mockShortCode,
			title: 'My Link',
			isActive: true,
			createdAt: new Date(),
			expiresAt: null,
		})

		const mockLinkRepository: LinkRepository = {
			save: mock.fn(async () => savedLink),
		} as unknown as LinkRepository

		const useCase = new CreateLinkUseCase(mockLinkRepository, mockShortCodeService)

		const result = await useCase.execute(10, {
			originalUrl: 'https://github.com/omnifaced',
			title: 'My Link',
		})

		assert.strictEqual(result.title, 'My Link')
	})

	test('should create link with expiresAt', async () => {
		const mockShortCode = ShortCode.create('abc123')
		const expiresAt = new Date('2025-12-31')
		const expiresAtString = expiresAt.toISOString()

		const generateUniqueCodeMock = mock.fn(async () => mockShortCode)
		const mockShortCodeService: ShortCodeService = {
			generateUniqueCode: generateUniqueCodeMock,
		} as unknown as ShortCodeService

		const savedLink = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://github.com/omnifaced'),
			shortCode: mockShortCode,
			title: null,
			isActive: true,
			createdAt: new Date(),
			expiresAt,
		})

		const mockLinkRepository: LinkRepository = {
			save: mock.fn(async () => savedLink),
		} as unknown as LinkRepository

		const useCase = new CreateLinkUseCase(mockLinkRepository, mockShortCodeService)

		const result = await useCase.execute(10, {
			originalUrl: 'https://github.com/omnifaced',
			expiresAt: expiresAtString,
		})

		assert.strictEqual(result.expiresAt, expiresAt.toISOString())
	})
})
