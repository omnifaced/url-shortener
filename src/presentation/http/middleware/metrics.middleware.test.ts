import * as assert from 'node:assert'

import { httpRequestDuration, httpRequestsTotal } from '../../../shared'
import { describe, test, mock, beforeEach } from 'node:test'
import { metricsMiddleware } from './metrics.middleware'
import type { Context } from 'hono'

const incMock = mock.method(httpRequestsTotal, 'inc', () => {})
const observeMock = mock.method(httpRequestDuration, 'observe', () => {})

const createContext = (status = 200) =>
	({
		req: { method: 'GET', path: '/test' },
		res: { status },
	}) as unknown as Context

const nextSuccess = mock.fn(async () => {})
const nextError = mock.fn(async () => {
	throw new Error('Oops')
})

describe('metricsMiddleware', () => {
	beforeEach(() => {
		incMock.mock.resetCalls()
		observeMock.mock.resetCalls()
	})

	test('records metrics for successful request', async () => {
		const ctx = createContext(200)

		await metricsMiddleware(ctx, nextSuccess)

		assert.strictEqual(incMock.mock.calls.length, 1)
		assert.strictEqual(observeMock.mock.calls.length, 1)
	})

	test('records metrics for failed request', async () => {
		const ctx = createContext(200)

		await assert.rejects(() => metricsMiddleware(ctx, nextError))

		assert.strictEqual(incMock.mock.calls.length, 1)
		assert.strictEqual(observeMock.mock.calls.length, 1)
	})
})
