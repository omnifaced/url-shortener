import * as assert from 'node:assert'

import { TooManyRequestsError } from './too-many-requests.error'
import { describe, test } from 'node:test'

describe('TooManyRequestsError', () => {
	test('extends ApplicationError', () => {
		const error = new TooManyRequestsError('Rate limit exceeded')

		assert.strictEqual(error.message, 'Rate limit exceeded')
		assert.strictEqual(error.code, 'TOO_MANY_REQUESTS')
	})

	test('has correct code', () => {
		const error = new TooManyRequestsError('Rate limit exceeded')
		assert.strictEqual(error.code, 'TOO_MANY_REQUESTS')
	})

	test('stores message', () => {
		const error = new TooManyRequestsError('Rate limit exceeded')
		assert.strictEqual(error.message, 'Rate limit exceeded')
	})

	test('stores retryAfter when provided', () => {
		const error = new TooManyRequestsError('Rate limit exceeded', 60)
		assert.strictEqual(error.retryAfter, 60)
	})

	test('retryAfter is undefined when not provided', () => {
		const error = new TooManyRequestsError('Rate limit exceeded')
		assert.strictEqual(error.retryAfter, undefined)
	})
})
