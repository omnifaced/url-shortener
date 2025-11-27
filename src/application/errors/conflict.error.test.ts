import * as assert from 'node:assert'

import { ConflictError } from './conflict.error'
import { describe, test } from 'node:test'

describe('ConflictError', () => {
	test('should create error with message', () => {
		const error = new ConflictError('Resource already exists')

		assert.strictEqual(error.message, 'Resource already exists')
		assert.strictEqual(error.code, 'CONFLICT')
	})

	test('should be instance of ApplicationError', () => {
		const error = new ConflictError('Conflict')

		assert.ok(error)
	})

	test('should have correct name', () => {
		const error = new ConflictError('Conflict')

		assert.strictEqual(error.name, 'ConflictError')
	})
})
