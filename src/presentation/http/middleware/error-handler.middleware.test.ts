import * as trace from '../../../shared/utils/trace'
import * as assert from 'node:assert'

import {
	TooManyRequestsError,
	ValidationError,
	UnauthorizedError,
	ForbiddenError,
	NotFoundError,
	ConflictError,
	ApplicationError,
} from '../../../application'

import { errorHandler } from './error-handler.middleware'
import { HTTPException } from 'hono/http-exception'
import { describe, test, mock } from 'node:test'
import { logger } from '../../../shared'
import type { Context } from 'hono'
import { ZodError, z } from 'zod'

interface ErrorResponse {
	error: {
		code: string
		message: string
		details?: {
			message?: string
			issues?: unknown
			traceId?: string
			retryAfter?: number
		}
	}
}

interface MockResult {
	_data: ErrorResponse
	status: number
	headers: Record<string, string>
}

function asMockResult(value: unknown): MockResult {
	return value as MockResult
}

describe('errorHandler', () => {
	const createMockContext = () => {
		const headers: Record<string, string> = {}
		const jsonMock = mock.fn((data: ErrorResponse, status: number) => ({ _data: data, status, headers }))
		const headerMock = mock.fn((name: string, value: string) => {
			headers[name] = value
		})

		return {
			json: jsonMock,
			header: headerMock,
		} as unknown as Context
	}

	test('should handle HTTPException', async () => {
		const c = createMockContext()
		const error = new HTTPException(404, { message: 'Not found' })

		const result = asMockResult(await errorHandler(error, c))

		assert.strictEqual(result.status, 404)
		assert.deepStrictEqual(result._data, {
			error: {
				code: 'NOT_FOUND',
				message: 'Not found',
			},
		})
	})

	test('should handle ValidationError', async () => {
		const c = createMockContext()
		const error = new ValidationError('Invalid input')

		const result = asMockResult(await errorHandler(error, c))

		assert.strictEqual(result.status, 400)
		assert.deepStrictEqual(result._data, {
			error: {
				code: 'VALIDATION_ERROR',
				message: 'Invalid input',
			},
		})
	})

	test('should handle ZodError', async () => {
		const c = createMockContext()
		const schema = z.object({ name: z.string() })

		try {
			schema.parse({})
		} catch (err) {
			if (err instanceof ZodError) {
				const result = asMockResult(await errorHandler(err, c))

				assert.strictEqual(result.status, 400)
				assert.strictEqual(result._data.error.code, 'VALIDATION_ERROR')
				assert.strictEqual(result._data.error.message, 'Validation error')
				assert.ok(result._data.error.details)
				assert.ok(result._data.error.details.issues)
			}
		}
	})

	test('should handle unknown errors', async () => {
		const c = createMockContext()
		const error = new Error('Unknown error')

		const result = asMockResult(await errorHandler(error, c))

		assert.strictEqual(result.status, 500)
		assert.strictEqual(result._data.error.code, 'INTERNAL_SERVER_ERROR')
		assert.strictEqual(result._data.error.message, 'Internal server error')
	})

	test('should map error codes correctly', async () => {
		const c = createMockContext()

		const testCases = [
			{ error: new UnauthorizedError('Unauthorized'), expectedStatus: 401 },
			{ error: new ForbiddenError('Forbidden'), expectedStatus: 403 },
			{ error: new NotFoundError('Not found'), expectedStatus: 404 },
			{ error: new ConflictError('Conflict'), expectedStatus: 409 },
		]

		for (const { error, expectedStatus } of testCases) {
			const result = asMockResult(await errorHandler(error, c))

			assert.strictEqual(result.status, expectedStatus)
		}
	})

	test('should include traceId for unknown errors when present', async (t) => {
		const c = createMockContext()
		const loggerMock = t.mock.method(logger, 'error', () => {})

		const error = new Error('Boom')

		const result = await trace.withTrace('abc-123', async () => {
			return asMockResult(await errorHandler(error, c))
		})

		assert.strictEqual(result.status, 500)
		assert.strictEqual(result._data.error.code, 'INTERNAL_SERVER_ERROR')
		assert.strictEqual(result._data.error.message, 'Internal server error')

		assert.ok(result._data.error.details)
		assert.strictEqual(result._data.error.details.traceId, 'abc-123')

		assert.strictEqual(loggerMock.mock.calls.length, 1)
	})

	test('should handle ApplicationError with unknown error code', async () => {
		const c = createMockContext()

		class CustomError extends ApplicationError {
			constructor() {
				super('Custom error', 'UNKNOWN_CODE')
			}
		}

		const error = new CustomError()
		const result = asMockResult(await errorHandler(error, c))

		assert.strictEqual(result.status, 500)
		assert.strictEqual(result._data.error.code, 'UNKNOWN_CODE')
		assert.strictEqual(result._data.error.message, 'Custom error')
	})

	test('should handle HTTPException with unknown status code', async () => {
		const c = createMockContext()
		const error = new HTTPException(418, { message: 'I am a teapot' })

		const result = asMockResult(await errorHandler(error, c))

		assert.strictEqual(result.status, 418)
		assert.deepStrictEqual(result._data, {
			error: {
				code: 'UNKNOWN_ERROR',
				message: 'I am a teapot',
			},
		})
	})

	test('should handle unknown errors without traceId', async (t) => {
		const c = createMockContext()
		const loggerMock = t.mock.method(logger, 'error', () => {})

		const error = new Error('No trace')
		const result = asMockResult(await errorHandler(error, c))

		assert.strictEqual(result.status, 500)
		assert.strictEqual(result._data.error.code, 'INTERNAL_SERVER_ERROR')
		assert.strictEqual(result._data.error.message, 'Internal server error')
		assert.strictEqual(result._data.error.details, undefined)

		assert.strictEqual(loggerMock.mock.calls.length, 1)
	})

	test('should handle HTTPException without message', async () => {
		const c = createMockContext()
		const error = new HTTPException(404)

		const result = asMockResult(await errorHandler(error, c))

		assert.strictEqual(result.status, 404)
		assert.deepStrictEqual(result._data, {
			error: {
				code: 'NOT_FOUND',
				message: 'Not Found',
			},
		})
	})

	test('should handle TooManyRequestsError', async () => {
		const c = createMockContext()
		const error = new TooManyRequestsError('Rate limit exceeded')

		const result = asMockResult(await errorHandler(error, c))

		assert.strictEqual(result.status, 429)
		assert.deepStrictEqual(result._data, {
			error: {
				code: 'TOO_MANY_REQUESTS',
				message: 'Rate limit exceeded',
			},
		})
	})

	test('should handle TooManyRequestsError with retryAfter', async () => {
		const c = createMockContext()
		const error = new TooManyRequestsError('Rate limit exceeded', 60)

		const result = asMockResult(await errorHandler(error, c))

		assert.strictEqual(result.status, 429)
		assert.strictEqual(result.headers['Retry-After'], '60')
		assert.deepStrictEqual(result._data, {
			error: {
				code: 'TOO_MANY_REQUESTS',
				message: 'Rate limit exceeded',
				details: {
					retryAfter: 60,
				},
			},
		})
	})
})
