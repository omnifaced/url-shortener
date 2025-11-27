import * as assert from 'node:assert'

import { describe, mock, test } from 'node:test'
import { Id, Username } from '../../../domain'
import { HTTP_STATUS } from '../../../shared'
import type { Container } from '../../../di'
import { createApp } from '../server'

describe('Links Controller', () => {
	const createMockContainer = (): Container => {
		return {
			config: {
				app: { port: 3000, host: 'localhost' },
				certificates: { cert_path: '', key_path: '' },
			},
			createLinkUseCase: {
				execute: mock.fn(async () => ({
					id: 1,
					shortCode: 'abc123',
					originalUrl: 'https://example.com',
					clickCount: 0,
					createdAt: new Date(),
				})),
			},
			listLinksUseCase: {
				execute: mock.fn(async () => ({
					links: [
						{
							id: 1,
							shortCode: 'abc123',
							originalUrl: 'https://example.com',
							clickCount: 5,
							createdAt: new Date(),
						},
					],
					total: 1,
					page: 1,
					limit: 10,
				})),
			},
			getLinkUseCase: {
				execute: mock.fn(async () => ({
					id: 1,
					shortCode: 'abc123',
					originalUrl: 'https://example.com',
					clickCount: 10,
					createdAt: new Date(),
				})),
			},
			updateLinkUseCase: {
				execute: mock.fn(async () => ({
					id: 1,
					shortCode: 'abc123',
					originalUrl: 'https://updated.com',
					clickCount: 10,
					createdAt: new Date(),
				})),
			},
			deleteLinkUseCase: {
				execute: mock.fn(async () => {}),
			},
			generateQrUseCase: {
				execute: mock.fn(async () => Buffer.from('fake-qr-code')),
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

	test('POST /api/links - should create new link', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/links', {
			method: 'POST',
			body: JSON.stringify({
				originalUrl: 'https://example.com',
			}),
			headers: new Headers({
				'Content-Type': 'application/json',
				Authorization: 'Bearer access_token_123',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.CREATED)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.shortCode, 'abc123')
		assert.strictEqual(data.data.originalUrl, 'https://example.com')
	})

	test('GET /api/links - should list all links', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/links', {
			method: 'GET',
			headers: new Headers({
				Authorization: 'Bearer access_token_123',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.links.length, 1)
		assert.strictEqual(data.data.total, 1)
	})

	test('GET /api/links?page=2&limit=5 - should list links with pagination', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/links?page=2&limit=5', {
			method: 'GET',
			headers: new Headers({
				Authorization: 'Bearer access_token_123',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
	})

	test('GET /api/links/{id} - should get link by id', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/links/1', {
			method: 'GET',
			headers: new Headers({
				Authorization: 'Bearer access_token_123',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.id, 1)
		assert.strictEqual(data.data.clickCount, 10)
	})

	test('PATCH /api/links/{id} - should update link', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/links/1', {
			method: 'PATCH',
			body: JSON.stringify({
				title: 'Updated Link',
			}),
			headers: new Headers({
				'Content-Type': 'application/json',
				Authorization: 'Bearer access_token_123',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.originalUrl, 'https://updated.com')
	})

	test('DELETE /api/links/{id} - should delete link', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('http://localhost:3000/api/links/1', {
			method: 'DELETE',
			headers: new Headers({
				Authorization: 'Bearer access_token_123',
				Origin: 'http://localhost:3000',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.message, 'Link deleted successfully')
	})

	test('GET /api/links/{id}/qr - should generate QR code (default SVG)', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/links/1/qr', {
			method: 'GET',
			headers: new Headers({
				Authorization: 'Bearer access_token_123',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)
		assert.strictEqual(res.headers.get('Content-Type'), 'image/svg+xml')
	})

	test('GET /api/links/{id}/qr?format=png - should generate PNG QR code', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/links/1/qr?format=png', {
			method: 'GET',
			headers: new Headers({
				Authorization: 'Bearer access_token_123',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)
		assert.strictEqual(res.headers.get('Content-Type'), 'image/png')
	})

	test('POST /api/links - should return 401 without token', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/links', {
			method: 'POST',
			body: JSON.stringify({
				originalUrl: 'https://example.com',
			}),
			headers: new Headers({
				'Content-Type': 'application/json',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.UNAUTHORIZED)
	})
})
