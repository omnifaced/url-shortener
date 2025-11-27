import * as assert from 'node:assert'

import { ApplicationError } from './base.error'
import { describe, test } from 'node:test'

class TestError extends ApplicationError {
	constructor(message: string, code = 'TEST_ERROR') {
		super(message, code)
	}
}

describe('ApplicationError', () => {
	test('should create error with message and code', () => {
		const error = new TestError('Test message', 'TEST_CODE')

		assert.strictEqual(error.message, 'Test message')
		assert.strictEqual(error.code, 'TEST_CODE')
		assert.strictEqual(error.name, 'TestError')
	})

	test('should be instance of Error', () => {
		const error = new TestError('Test message', 'TEST_CODE')

		assert.ok(error)
	})

	test('should have stack trace', () => {
		const error = new TestError('Test message', 'TEST_CODE')

		assert.ok(error.stack)
		assert.ok(error.stack.includes('TestError'))
	})
})
