import * as assert from 'node:assert'

import { describe, mock, test } from 'node:test'
import { Id, Username } from '../../../domain'
import { HTTP_STATUS } from '../../../shared'
import type { Container } from '../../../di'
import { createApp } from '../server'

describe('Auth Controller', () => {
	const createMockContainer = (): Container => {
		return {
			config: {
				app: { port: 3000, host: 'localhost' },
				certificates: { cert_path: '', key_path: '' },
			},
			registerUseCase: {
				execute: mock.fn(async () => ({
					user: { id: 1, username: 'test_user', createdAt: new Date() },
					accessToken: 'access_token_123',
					refreshToken: 'refresh_token_123',
				})),
			},
			loginUseCase: {
				execute: mock.fn(async () => ({
					user: { id: 1, username: 'test_user', createdAt: new Date() },
					accessToken: 'access_token_123',
					refreshToken: 'refresh_token_123',
				})),
			},
			refreshUseCase: {
				execute: mock.fn(async () => ({
					accessToken: 'new_access_token',
					refreshToken: 'new_refresh_token',
				})),
			},
			logoutUseCase: {
				execute: mock.fn(async () => {}),
			},
			logoutAllUseCase: {
				execute: mock.fn(async () => {}),
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

	test('POST /api/auth/register - should register new user', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/auth/register', {
			method: 'POST',
			body: JSON.stringify({
				username: 'test_user',
				password: 'password123',
			}),
			headers: new Headers({ 'Content-Type': 'application/json' }),
		})

		assert.strictEqual(res.status, HTTP_STATUS.CREATED)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.user.username, 'test_user')
		assert.strictEqual(data.data.accessToken, 'access_token_123')
		assert.strictEqual(data.data.refreshToken, 'refresh_token_123')
	})

	test('POST /api/auth/login - should login user', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify({
				username: 'test_user',
				password: 'password123',
			}),
			headers: new Headers({ 'Content-Type': 'application/json' }),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.accessToken, 'access_token_123')
	})

	test('POST /api/auth/refresh - should refresh tokens', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/auth/refresh', {
			method: 'POST',
			body: JSON.stringify({
				refreshToken: 'refresh_token_123',
			}),
			headers: new Headers({ 'Content-Type': 'application/json' }),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.accessToken, 'new_access_token')
		assert.strictEqual(data.data.refreshToken, 'new_refresh_token')
	})

	test('POST /api/auth/logout - should logout user', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/auth/logout', {
			method: 'POST',
			body: JSON.stringify({
				refreshToken: 'refresh_token_123',
			}),
			headers: new Headers({
				'Content-Type': 'application/json',
				Authorization: 'Bearer access_token_123',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.message, 'Logged out successfully')
	})

	test('POST /api/auth/logout-all - should logout all sessions', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('http://localhost:3000/api/auth/logout-all', {
			method: 'POST',
			headers: new Headers({
				Authorization: 'Bearer access_token_123',
				Origin: 'http://localhost:3000',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)

		const data = await res.json()

		assert.strictEqual(data.success, true)
		assert.strictEqual(data.data.message, 'All sessions terminated successfully')
	})

	test('POST /api/auth/logout - should return 401 without token', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/api/auth/logout', {
			method: 'POST',
			body: JSON.stringify({
				refreshToken: 'refresh_token_123',
			}),
			headers: new Headers({
				'Content-Type': 'application/json',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.UNAUTHORIZED)
	})
})
