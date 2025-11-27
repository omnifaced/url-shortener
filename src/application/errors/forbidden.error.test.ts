import * as assert from 'node:assert'

import { ForbiddenError } from './forbidden.error'
import { describe, test } from 'node:test'

describe('ForbiddenError', () => {
	test('should create error with default message', () => {
		const error = new ForbiddenError()

		assert.strictEqual(error.message, 'Forbidden')
		assert.strictEqual(error.code, 'FORBIDDEN')
	})

	test('should create error with custom message', () => {
		const error = new ForbiddenError('Access denied')

		assert.strictEqual(error.message, 'Access denied')
		assert.strictEqual(error.code, 'FORBIDDEN')
	})

	test('should be instance of ApplicationError', () => {
		const error = new ForbiddenError()

		assert.ok(error)
	})

	test('should have correct name', () => {
		const error = new ForbiddenError()

		assert.strictEqual(error.name, 'ForbiddenError')
	})
})
