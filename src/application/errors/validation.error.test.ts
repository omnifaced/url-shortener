import * as assert from 'node:assert'

import { ValidationError } from './validation.error'
import { describe, test } from 'node:test'

describe('ValidationError', () => {
	test('should create error with message', () => {
		const error = new ValidationError('Invalid input')

		assert.strictEqual(error.message, 'Invalid input')
		assert.strictEqual(error.code, 'VALIDATION_ERROR')
	})

	test('should be instance of ApplicationError', () => {
		const error = new ValidationError('Invalid input')

		assert.ok(error)
	})

	test('should have correct name', () => {
		const error = new ValidationError('Invalid input')

		assert.strictEqual(error.name, 'ValidationError')
	})
})
