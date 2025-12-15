import * as assert from 'node:assert'

import { describe, mock, test } from 'node:test'
import { HTTP_STATUS } from '../../../shared'
import type { Container } from '../../../di'
import { createApp } from '../server'

describe('Redirect Controller', () => {
	const createMockContainer = (): Container => {
		return {
			config: {
				app: { port: 3000, host: 'localhost' },
				certificates: { cert_path: '', key_path: '' },
			},
			redirectUseCase: {
				execute: mock.fn(async () => 'https://github.com/omnifaced'),
			},
		} as unknown as Container
	}

	test('GET /{shortCode} - should redirect to original URL', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/abc123', {
			method: 'GET',
		})

		assert.strictEqual(res.status, HTTP_STATUS.FOUND)
		assert.strictEqual(res.headers.get('Location'), 'https://github.com/omnifaced')
	})

	test('GET /{shortCode} - should track click with headers', async () => {
		const container = createMockContainer()
		const app = createApp(container)

		const res = await app.request('/abc123', {
			method: 'GET',
			headers: new Headers({
				'user-agent': 'Mozilla/5.0',
				'x-forwarded-for': '127.0.0.1',
				referer: 'https://github.com/omnifaced',
			}),
		})

		assert.strictEqual(res.status, HTTP_STATUS.FOUND)
		assert.strictEqual(
			(container.redirectUseCase.execute as unknown as ReturnType<typeof mock.fn>).mock.calls.length,
			1
		)
	})
})
