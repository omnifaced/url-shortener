import * as assert from 'node:assert'

import { structuredLogger } from './logger.middleware'
import { describe, mock, test } from 'node:test'
import { logger } from '../../../shared'
import type { Context } from 'hono'

const infoMock = mock.method(logger, 'info', () => {})
const warnMock = mock.method(logger, 'warn', () => {})
const errorMock = mock.method(logger, 'error', () => {})

const createContext = (status = 200) =>
	({
		req: { method: 'GET', path: '/test' },
		res: { status },
		get: mock.fn(() => null),
	}) as unknown as Context

const nextSuccess = mock.fn(async () => {})
const nextError = mock.fn(async () => {
	throw new Error('Boom')
})

describe('structuredLogger', () => {
	test('logs info for 2xx responses', async () => {
		const ctx = createContext(200)

		await structuredLogger(ctx, nextSuccess)

		assert.strictEqual(infoMock.mock.calls.length, 1)
	})

	test('logs warn for 4xx', async () => {
		const ctx = createContext(400)

		await structuredLogger(ctx, nextSuccess)

		assert.strictEqual(warnMock.mock.calls.length, 1)
	})

	test('logs error for 5xx', async () => {
		const ctx = createContext(500)

		await structuredLogger(ctx, nextSuccess)

		assert.strictEqual(errorMock.mock.calls.length, 1)
	})

	test('logs error when next throws', async () => {
		const ctx = createContext(200)

		await assert.rejects(() => structuredLogger(ctx, nextError))

		assert.ok(errorMock.mock.calls.length >= 1)
	})
})
