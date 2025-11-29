import * as assert from 'node:assert'

import { Id, Link, ShortCode, Url, type LinkRepository, type ClickRepository } from '../../../domain'
import { GetOverviewUseCase } from './get-overview.use-case'
import { describe, test, mock } from 'node:test'

describe('GetOverviewUseCase', () => {
	test('should return overview with top links', async () => {
		const links = [
			Link.create({
				id: Id.create(1),
				userId: Id.create(10),
				originalUrl: Url.create('https://example1.com'),
				shortCode: ShortCode.create('abc123'),
				title: 'Link 1',
				isActive: true,
				createdAt: new Date(),
				expiresAt: null,
			}),
			Link.create({
				id: Id.create(2),
				userId: Id.create(10),
				originalUrl: Url.create('https://example2.com'),
				shortCode: ShortCode.create('def456'),
				title: 'Link 2',
				isActive: true,
				createdAt: new Date(),
				expiresAt: null,
			}),
			Link.create({
				id: Id.create(3),
				userId: Id.create(10),
				originalUrl: Url.create('https://example3.com'),
				shortCode: ShortCode.create('ghi789'),
				title: null,
				isActive: true,
				createdAt: new Date(),
				expiresAt: null,
			}),
		]

		const clickCounts = [
			{ linkId: Id.create(1), count: 100 },
			{ linkId: Id.create(2), count: 50 },
			{ linkId: Id.create(3), count: 25 },
		]

		const countByUserIdMock = mock.fn(async () => 3)
		const countClicksByUserIdMock = mock.fn(async () => 175)
		const findByUserIdMock = mock.fn(async () => links)
		const getClickCountsByUserIdMock = mock.fn(async () => clickCounts)

		const mockLinkRepository: LinkRepository = {
			countByUserId: countByUserIdMock,
			findByUserId: findByUserIdMock,
		} as unknown as LinkRepository

		const mockClickRepository: ClickRepository = {
			countByUserId: countClicksByUserIdMock,
			getClickCountsByUserId: getClickCountsByUserIdMock,
		} as unknown as ClickRepository

		const useCase = new GetOverviewUseCase(mockLinkRepository, mockClickRepository)

		const result = await useCase.execute(10)

		assert.strictEqual(result.totalLinks, 3)
		assert.strictEqual(result.totalClicks, 175)
		assert.strictEqual(result.topLinks.length, 3)
		assert.strictEqual(result.topLinks[0].id, 1)
		assert.strictEqual(result.topLinks[0].clickCount, 100)
		assert.strictEqual(result.topLinks[1].id, 2)
		assert.strictEqual(result.topLinks[1].clickCount, 50)
		assert.strictEqual(result.topLinks[2].id, 3)
		assert.strictEqual(result.topLinks[2].clickCount, 25)
		assert.strictEqual(countByUserIdMock.mock.calls.length, 1)
		assert.strictEqual(countClicksByUserIdMock.mock.calls.length, 1)
		assert.strictEqual(findByUserIdMock.mock.calls.length, 1)
		assert.strictEqual(getClickCountsByUserIdMock.mock.calls.length, 1)
	})

	test('should limit top links to 10', async () => {
		const links = Array.from({ length: 15 }, (_, i) =>
			Link.create({
				id: Id.create(i + 1),
				userId: Id.create(10),
				originalUrl: Url.create(`https://example${i}.com`),
				shortCode: ShortCode.create(`code${i}`),
				title: null,
				isActive: true,
				createdAt: new Date(),
				expiresAt: null,
			})
		)

		const clickCounts = Array.from({ length: 15 }, (_, i) => ({
			linkId: Id.create(i + 1),
			count: 100 - i * 5,
		}))

		const mockLinkRepository: LinkRepository = {
			countByUserId: mock.fn(async () => 15),
			findByUserId: mock.fn(async () => links),
		} as unknown as LinkRepository

		const mockClickRepository: ClickRepository = {
			countByUserId: mock.fn(async () => 1000),
			getClickCountsByUserId: mock.fn(async () => clickCounts),
		} as unknown as ClickRepository

		const useCase = new GetOverviewUseCase(mockLinkRepository, mockClickRepository)

		const result = await useCase.execute(10)

		assert.strictEqual(result.topLinks.length, 10)
	})

	test('should handle links with no clicks', async () => {
		const links = [
			Link.create({
				id: Id.create(1),
				userId: Id.create(10),
				originalUrl: Url.create('https://example1.com'),
				shortCode: ShortCode.create('abc123'),
				title: null,
				isActive: true,
				createdAt: new Date(),
				expiresAt: null,
			}),
			Link.create({
				id: Id.create(2),
				userId: Id.create(10),
				originalUrl: Url.create('https://example2.com'),
				shortCode: ShortCode.create('def456'),
				title: null,
				isActive: true,
				createdAt: new Date(),
				expiresAt: null,
			}),
		]

		const clickCounts = [{ linkId: Id.create(1), count: 10 }]

		const mockLinkRepository: LinkRepository = {
			countByUserId: mock.fn(async () => 2),
			findByUserId: mock.fn(async () => links),
		} as unknown as LinkRepository

		const mockClickRepository: ClickRepository = {
			countByUserId: mock.fn(async () => 10),
			getClickCountsByUserId: mock.fn(async () => clickCounts),
		} as unknown as ClickRepository

		const useCase = new GetOverviewUseCase(mockLinkRepository, mockClickRepository)

		const result = await useCase.execute(10)

		assert.strictEqual(result.topLinks.length, 2)
		assert.strictEqual(result.topLinks[0].clickCount, 10)
		assert.strictEqual(result.topLinks[1].clickCount, 0)
	})

	test('should handle user with no links', async () => {
		const mockLinkRepository: LinkRepository = {
			countByUserId: mock.fn(async () => 0),
			findByUserId: mock.fn(async () => []),
		} as unknown as LinkRepository

		const mockClickRepository: ClickRepository = {
			countByUserId: mock.fn(async () => 0),
			getClickCountsByUserId: mock.fn(async () => []),
		} as unknown as ClickRepository

		const useCase = new GetOverviewUseCase(mockLinkRepository, mockClickRepository)

		const result = await useCase.execute(10)

		assert.strictEqual(result.totalLinks, 0)
		assert.strictEqual(result.totalClicks, 0)
		assert.strictEqual(result.topLinks.length, 0)
	})
})
