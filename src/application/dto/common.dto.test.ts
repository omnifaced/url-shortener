import * as assert from 'node:assert/strict'

import { clientErrorResponseSchema, serverErrorResponseSchema, messageResponseSchema } from './common.dto'
import { describe, it } from 'node:test'

describe('common.dto', () => {
	describe('clientErrorResponseSchema', () => {
		it('should parse valid client error response', () => {
			const data = {
				success: false,
				error: {
					message: 'Validation failed',
					details: {
						message: 'Invalid input data',
					},
				},
			}

			const result = clientErrorResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when success is not false', () => {
			const data = {
				success: true,
				error: {
					message: 'Validation failed',
					details: {
						message: 'Invalid input data',
					},
				},
			}

			assert.throws(() => clientErrorResponseSchema.parse(data))
		})

		it('should fail when error message is missing', () => {
			const data = {
				success: false,
				error: {
					details: {
						message: 'Invalid input data',
					},
				},
			}

			assert.throws(() => clientErrorResponseSchema.parse(data))
		})

		it('should fail when details message is missing', () => {
			const data = {
				success: false,
				error: {
					message: 'Validation failed',
					details: {},
				},
			}

			assert.throws(() => clientErrorResponseSchema.parse(data))
		})
	})

	describe('serverErrorResponseSchema', () => {
		it('should parse valid server error response', () => {
			const data = {
				success: false,
				error: {
					message: 'Internal server error',
					details: {
						message: 'Database connection failed',
						traceId: 'trace-abc123',
					},
				},
			}

			const result = serverErrorResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when success is not false', () => {
			const data = {
				success: true,
				error: {
					message: 'Internal server error',
					details: {
						message: 'Database connection failed',
						traceId: 'trace-abc123',
					},
				},
			}

			assert.throws(() => serverErrorResponseSchema.parse(data))
		})

		it('should fail when traceId is missing', () => {
			const data = {
				success: false,
				error: {
					message: 'Internal server error',
					details: {
						message: 'Database connection failed',
					},
				},
			}

			assert.throws(() => serverErrorResponseSchema.parse(data))
		})

		it('should fail when error message is missing', () => {
			const data = {
				success: false,
				error: {
					details: {
						message: 'Database connection failed',
						traceId: 'trace-abc123',
					},
				},
			}

			assert.throws(() => serverErrorResponseSchema.parse(data))
		})

		it('should fail when details message is missing', () => {
			const data = {
				success: false,
				error: {
					message: 'Internal server error',
					details: {
						traceId: 'trace-abc123',
					},
				},
			}

			assert.throws(() => serverErrorResponseSchema.parse(data))
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
