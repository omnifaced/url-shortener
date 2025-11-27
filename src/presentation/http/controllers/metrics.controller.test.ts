import * as assert from 'node:assert'

import { createMetricsController } from './metrics.controller'
import { HTTP_STATUS } from '../../../shared'
import { describe, test } from 'node:test'

describe('Metrics Controller', () => {
	test('GET / - should return prometheus metrics', async () => {
		const controller = createMetricsController()

		const res = await controller.request('/', {
			method: 'GET',
		})

		assert.strictEqual(res.status, HTTP_STATUS.OK)
		assert.strictEqual(res.headers.get('Content-Type'), 'text/plain; version=0.0.4; charset=utf-8')

		const text = await res.text()

		assert.match(text, /url_shortener_/)
		assert.match(text, /HELP/)
		assert.match(text, /TYPE/)
	})

	test('GET / - should include custom metrics', async () => {
		const controller = createMetricsController()

		const res = await controller.request('/', {
			method: 'GET',
		})

		const text = await res.text()

		assert.match(text, /url_shortener_http_requests_total/)
		assert.match(text, /url_shortener_http_request_duration_seconds/)
		assert.match(text, /url_shortener_links_created_total/)
		assert.match(text, /url_shortener_clicks_total/)
	})
})
