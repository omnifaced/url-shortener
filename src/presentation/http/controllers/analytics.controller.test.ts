import * as assert from 'node:assert'

import { describe, mock, test } from 'node:test'
import { Id, Username } from '../../../domain'
import { HTTP_STATUS } from '../../../shared'
import type { Container } from '../../../di'
import { createApp } from '../server'

describe('Analytics Controller', () => {
	const createMockContainer = (): Container => {
		return {
			config: {
				app: { port: 3000, host: 'localhost' },
				certificates: { cert_path: '', key_path: '' },
			},
			listAnalyticsLinksUseCase: {
				execute: mock.fn(async () => ({
					type: 'top',
					links: [
						{
							id: 1,
							shortCode: 'abc123',
							originalUrl: 'https://github.com/omnifaced',
							title: 'Test Link',
							clickCount: 50,
							createdAt: '2025-01-01T00:00:00Z',
						},
					],
					pagination: {
						page: 1,
						limit: 10,
						total: 1,
						totalPages: 1,
					},
				})),
			},
			getLinkStatsUseCase: {
				execute: mock.fn(async () => ({
					link: {
						id: 1,
						shortCode: 'abc123',
						originalUrl: 'https://github.com/omnifaced',
						title: 'Test Link',
						isActive: true,
						createdAt: '2025-01-01T00:00:00Z',
						expiresAt: null,
					},
					totalClicks: 50,
				})),
			},
			getLinkClicksUseCase: {
				execute: mock.fn(async () => ({
					type: 'recent',
					clicks: [
						{
							id: 1,
							clickedAt: '2025-01-15T10:30:00Z',
							ip: '192.168.1.1',
							userAgent: 'Mozilla/5.0',
							referer: 'https://github.com/omnifaced',
						},
					],
					pagination: {
						page: 1,
						limit: 10,
						total: 1,
						totalPages: 1,
					},
				})),
			},
			getClicksByDateUseCase: {
				execute: mock.fn(async () => ({
					items: [
						{ date: '2024-01-01', count: 10 },
						{ date: '2024-01-02', count: 15 },
					],
					pagination: {
						page: 1,
						limit: 10,
						total: 2,
						totalPages: 1,
					},
				})),
			},
			jwtPort: {
				verifyAccessToken: mock.fn(async () => ({
					userId: Id.create(1),
					username: Username.create('test_user'),
				})),
			},
			tokenBlacklistPort: {
				isBlacklisted: mock.fn(async () => false),
			},
		} as unknown as Container
	}

	test('GET /api/analytics/links - should get analytics links with pagination', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/analytics/links?sort=top&page=1&limit=10', {
			method: 'GET',
			headers: new Headers({
				Authorization: 'Bearer access_token_123',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.type, 'top')
		assert.strictEqual(data.data.links.length, 1)
		assert.strictEqual(data.data.links[0].id, 1)
		assert.strictEqual(data.data.links[0].clickCount, 50)
		assert.strictEqual(data.data.pagination.page, 1)
		assert.strictEqual(data.data.pagination.limit, 10)
	})

	test('GET /api/analytics/links/{id}/stats - should get link stats', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/analytics/links/1/stats', {
			method: 'GET',
			headers: new Headers({
				Authorization: 'Bearer access_token_123',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.link.id, 1)
		assert.strictEqual(data.data.totalClicks, 50)
	})

	test('GET /api/analytics/links/{id}/clicks - should get link clicks with pagination', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/analytics/links/1/clicks?type=recent&page=1&limit=10', {
			method: 'GET',
			headers: new Headers({
				Authorization: 'Bearer access_token_123',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.type, 'recent')
		assert.strictEqual(data.data.clicks.length, 1)
		assert.strictEqual(data.data.clicks[0].id, 1)
		assert.strictEqual(data.data.pagination.page, 1)
		assert.strictEqual(data.data.pagination.limit, 10)
	})

	test('GET /api/analytics/links/{id}/clicks-by-date - should get clicks by date with pagination', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/analytics/links/1/clicks-by-date?days=30&page=1&limit=10', {
			method: 'GET',
			headers: new Headers({
				Authorization: 'Bearer access_token_123',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.items.length, 2)
		assert.strictEqual(data.data.items[0].date, '2024-01-01')
		assert.strictEqual(data.data.items[0].count, 10)
		assert.strictEqual(data.data.pagination.page, 1)
		assert.strictEqual(data.data.pagination.limit, 10)
	})

	test('GET /api/analytics/links - should return 401 without token', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/analytics/links', {
			method: 'GET',
		})

		assert.strictEqual(res.status, HTTP_STATUS.UNAUTHORIZED)
	})

	test('GET /api/analytics/links/{id}/stats - should return 401 without token', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/analytics/links/1/stats', {
			method: 'GET',
		})

		assert.strictEqual(res.status, HTTP_STATUS.UNAUTHORIZED)
	})

	test('GET /api/analytics/links/{id}/clicks - should return 401 without token', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/analytics/links/1/clicks?type=recent', {
			method: 'GET',
		})

		assert.strictEqual(res.status, HTTP_STATUS.UNAUTHORIZED)
	})

	test('GET /api/analytics/links/{id}/clicks-by-date - should return 401 without token', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/analytics/links/1/clicks-by-date', {
			method: 'GET',
		})

		assert.strictEqual(res.status, HTTP_STATUS.UNAUTHORIZED)
	})
})
