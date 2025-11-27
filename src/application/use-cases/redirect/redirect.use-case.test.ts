import * as assert from 'node:assert'

import { Id, Link, ShortCode, Url, type LinkRepository, type ClickRepository } from '../../../domain'
import type { UserAgentParserPort } from '../../ports'
import { RedirectUseCase } from './redirect.use-case'
import { describe, test, mock } from 'node:test'
import { NotFoundError } from '../../errors'

function createTestSetup(link: Link | null, userAgentParseResult?: Record<string, string>) {
	const findByShortCodeMock = mock.fn(async () => link)
	const saveMock = mock.fn(async () => ({}))
	const parseMock = mock.fn(() => userAgentParseResult || {})

	const mockLinkRepository = {
		findByShortCode: findByShortCodeMock,
	} as unknown as LinkRepository

	const mockClickRepository = {
		save: saveMock,
	} as unknown as ClickRepository

	const mockUserAgentParser = {
		parse: parseMock,
	} as unknown as UserAgentParserPort

	const useCase = new RedirectUseCase(mockLinkRepository, mockClickRepository, mockUserAgentParser)

	return {
		useCase,
		mocks: {
			findByShortCode: findByShortCodeMock,
			save: saveMock,
			parse: parseMock,
		},
	}
}

describe('RedirectUseCase', () => {
	test('should redirect to original URL for valid active link', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://example.com'),
			shortCode: ShortCode.create('abc123'),
			title: null,
			isActive: true,
			createdAt: new Date(),
			expiresAt: null,
		})

		const { useCase, mocks } = createTestSetup(link, {
			browser: 'Chrome',
			os: 'Windows',
			device: 'Desktop',
		})

		const result = await useCase.execute('abc123', '127.0.0.1', 'Mozilla/5.0', 'https://google.com')

		assert.strictEqual(result, 'https://example.com')
		assert.strictEqual(mocks.findByShortCode.mock.calls.length, 1)
		assert.strictEqual(mocks.save.mock.calls.length, 1)
		assert.strictEqual(mocks.parse.mock.calls.length, 1)
	})

	test('should throw NotFoundError for non-existent link', async () => {
		const { useCase } = createTestSetup(null)

		await assert.rejects(
			async () => {
				await useCase.execute('abc123')
			},
			{
				name: 'NotFoundError',
			}
		)
	})

	test('should throw NotFoundError for inactive link', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://example.com'),
			shortCode: ShortCode.create('abc123'),
			title: null,
			isActive: false,
			createdAt: new Date(),
			expiresAt: null,
		})

		const { useCase } = createTestSetup(link)

		await assert.rejects(async () => {
			await useCase.execute('abc123')
		}, NotFoundError)
	})

	test('should throw NotFoundError for expired link', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://example.com'),
			shortCode: ShortCode.create('abc123'),
			title: null,
			isActive: true,
			createdAt: new Date(),
			expiresAt: new Date('2020-01-01'),
		})

		const { useCase } = createTestSetup(link)

		await assert.rejects(async () => {
			await useCase.execute('abc123')
		}, NotFoundError)
	})

	test('should handle missing optional parameters', async () => {
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(10),
			originalUrl: Url.create('https://example.com'),
			shortCode: ShortCode.create('abc123'),
			title: null,
			isActive: true,
			createdAt: new Date(),
			expiresAt: null,
		})

		const { useCase, mocks } = createTestSetup(link, { browser: 'Chrome' })
		const result = await useCase.execute('abc123')

		assert.strictEqual(result, 'https://example.com')
		assert.strictEqual(mocks.parse.mock.calls.length, 0)
	})
})
