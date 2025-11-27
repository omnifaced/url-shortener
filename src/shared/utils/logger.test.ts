import * as assert from 'node:assert'
import * as trace from './trace'

import { describe, test } from 'node:test'
import { logger } from './logger'

describe('logger', () => {
	test('should log message without data', (t) => {
		t.mock.method(console, 'log', () => {})
		logger.info('Test message')

		t.mock.reset()
	})

	test('should log message with object data', (t) => {
		const consoleMock = t.mock.method(console, 'log', () => {})

		logger.info('Test message', { key: 'value' })

		assert.strictEqual(consoleMock.mock.calls.length, 1)

		t.mock.reset()
	})

	test('should log message with traceId', async (t) => {
		const consoleMock = t.mock.method(console, 'log', () => {})

		await trace.withTrace('test-trace-id', async () => {
			logger.info('Test message', { key: 'value' })
		})

		assert.strictEqual(consoleMock.mock.calls.length, 1)

		const loggedData = consoleMock.mock.calls[0].arguments[0]

		assert.ok(typeof loggedData === 'object')
		assert.ok('traceId' in loggedData)

		t.mock.reset()
	})

	test('should log different levels', (t) => {
		t.mock.method(console, 'log', () => {})

		logger.log('log message')
		logger.info('info message')
		logger.warn('warn message')
		logger.error('error message')
		logger.success('success message')
		logger.start('start message')

		t.mock.reset()
	})

	test('should log message with array argument', (t) => {
		t.mock.method(console, 'log', () => {})

		logger.info('Test message', ['item1', 'item2'])

		t.mock.reset()
	})

	test('should log message with null argument', (t) => {
		t.mock.method(console, 'log', () => {})

		logger.info('Test message', null)

		t.mock.reset()
	})

	test('should log without traceId and with primitive data', (t) => {
		t.mock.method(console, 'log', () => {})

		logger.info('Test message', 'string data')
		logger.info('Test message', 123)
		logger.info('Test message', true)

		t.mock.reset()
	})

	test('should add traceId to primitive argument', async (t) => {
		t.mock.method(console, 'log', () => {})

		await trace.withTrace('test-trace-id', async () => {
			logger.info('Test message', 'string data')
		})

		t.mock.reset()
	})
})
