import * as assert from 'node:assert/strict'

import { errorResponseSchema, messageResponseSchema } from './common.dto'
import { describe, it } from 'node:test'

describe('common.dto', () => {
	describe('errorResponseSchema', () => {
		it('should parse valid error response without details', () => {
			const data = {
				success: false,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Validation failed',
				},
			}

			const result = errorResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when success is not false', () => {
			const data = {
				success: true,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Validation failed',
					details: {
						message: 'Invalid input data',
					},
				},
			}

			assert.throws(() => errorResponseSchema.parse(data))
		})

		it('should fail when error code is missing', () => {
			const data = {
				success: false,
				error: {
					message: 'Validation failed',
				},
			}

			assert.throws(() => errorResponseSchema.parse(data))
		})

		it('should parse error with empty details', () => {
			const data = {
				success: false,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Validation failed',
					details: {},
				},
			}

			const result = errorResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should parse error with details containing traceId', () => {
			const data = {
				success: false,
				error: {
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Internal server error',
					details: {
						traceId: 'trace-xyz789',
					},
				},
			}

			const result = errorResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should parse error with details containing issues', () => {
			const data = {
				success: false,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Validation error',
					details: {
						issues: [{ path: ['field'], message: 'Required' }],
					},
				},
			}

			const result = errorResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})
	})

	describe('messageResponseSchema', () => {
		it('should parse valid message response', () => {
			const data = {
				success: true,
				data: {
					message: 'Link deleted successfully',
				},
			}

			const result = messageResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when success is not true', () => {
			const data = {
				success: false,
				data: {
					message: 'Link deleted successfully',
				},
			}

			assert.throws(() => messageResponseSchema.parse(data))
		})

		it('should fail when message is missing', () => {
			const data = {
				success: true,
				data: {},
			}

			assert.throws(() => messageResponseSchema.parse(data))
		})

		it('should fail when data is missing', () => {
			const data = {
				success: true,
			}

			assert.throws(() => messageResponseSchema.parse(data))
		})

		it('should fail when message is empty string', () => {
			const data = {
				success: true,
				data: {
					message: '',
				},
			}

			const result = messageResponseSchema.parse(data)
			assert.strictEqual(result.data.message, '')
		})
	})
})
