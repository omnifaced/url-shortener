import * as assert from 'node:assert'

import { UnauthorizedError } from './unauthorized.error'
import { describe, test } from 'node:test'

describe('UnauthorizedError', () => {
	test('should create error with default message', () => {
		const error = new UnauthorizedError()

		assert.strictEqual(error.message, 'Unauthorized')
		assert.strictEqual(error.code, 'UNAUTHORIZED')
	})

	test('should create error with custom message', () => {
		const error = new UnauthorizedError('Invalid credentials')

		assert.strictEqual(error.message, 'Invalid credentials')
		assert.strictEqual(error.code, 'UNAUTHORIZED')
	})

	test('should be instance of ApplicationError', () => {
		const error = new UnauthorizedError()

		assert.ok(error)
	})

	test('should have correct name', () => {
		const error = new UnauthorizedError()

		assert.strictEqual(error.name, 'UnauthorizedError')
	})
})
