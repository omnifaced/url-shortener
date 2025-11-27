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
			getOverviewUseCase: {
				execute: mock.fn(async () => ({
					totalLinks: 10,
					totalClicks: 150,
					clicksToday: 25,
					clicksThisWeek: 80,
					clicksThisMonth: 120,
					topLinks: [
						{
							id: 1,
							shortCode: 'abc123',
							originalUrl: 'https://example.com',
							clickCount: 50,
						},
					],
				})),
			},
			getLinkStatsUseCase: {
				execute: mock.fn(async () => ({
					linkId: 1,
					shortCode: 'abc123',
					originalUrl: 'https://example.com',
					totalClicks: 50,
					clicksByDate: [
						{ date: '2024-01-01', count: 10 },
						{ date: '2024-01-02', count: 15 },
					],
					clicksByCountry: [
						{ country: 'US', count: 30 },
						{ country: 'UK', count: 20 },
					],
					clicksByDevice: [
						{ device: 'mobile', count: 35 },
						{ device: 'desktop', count: 15 },
					],
					clicksByBrowser: [
						{ browser: 'Chrome', count: 40 },
						{ browser: 'Firefox', count: 10 },
					],
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

	test('GET /api/analytics/overview - should get analytics overview', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/analytics/overview', {
			method: 'GET',
			headers: new Headers({
				Authorization: 'Bearer access_token_123',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.totalLinks, 10)
		assert.strictEqual(data.data.totalClicks, 150)
		assert.strictEqual(data.data.clicksToday, 25)
		assert.strictEqual(data.data.topLinks.length, 1)
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
		assert.strictEqual(data.data.linkId, 1)
		assert.strictEqual(data.data.totalClicks, 50)
		assert.strictEqual(data.data.clicksByDate.length, 2)
		assert.strictEqual(data.data.clicksByCountry.length, 2)
	})

	test('GET /api/analytics/overview - should return 401 without token', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/analytics/overview', {
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
})
