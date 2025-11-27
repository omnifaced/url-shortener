import * as assert from 'node:assert'

import { NotFoundError } from './not-found.error'
import { describe, test } from 'node:test'

describe('NotFoundError', () => {
	test('should create error with resource name only', () => {
		const error = new NotFoundError('User')

		assert.strictEqual(error.message, 'User not found')
		assert.strictEqual(error.code, 'NOT_FOUND')
	})

	test('should create error with resource name and string identifier', () => {
		const error = new NotFoundError('User', 'john')

		assert.strictEqual(error.message, "User with identifier 'john' not found")
		assert.strictEqual(error.code, 'NOT_FOUND')
	})

	test('should create error with resource name and numeric identifier', () => {
		const error = new NotFoundError('Link', 123)

		assert.strictEqual(error.message, "Link with identifier '123' not found")
		assert.strictEqual(error.code, 'NOT_FOUND')
	})

	test('should be instance of ApplicationError', () => {
		const error = new NotFoundError('Resource')

		assert.ok(error)
	})

	test('should have correct name', () => {
		const error = new NotFoundError('Resource')

		assert.strictEqual(error.name, 'NotFoundError')
	})
})
