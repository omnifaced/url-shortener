import * as assert from 'node:assert'

import { validationErrorWrapperHook } from './validation-error-wrapper'
import { describe, mock, test } from 'node:test'
import { HTTP_STATUS } from '../../../shared'
import type { Context } from 'hono'
import { ZodError } from 'zod'

describe('validationErrorWrapper', () => {
	test('should return formatted zod error', async () => {
		const fakeContext = {
			json: mock.fn((body, status) => new Response(JSON.stringify(body), { status })),
		} as unknown as Context

		const error = new ZodError([
			{
				path: ['field'],
				message: 'Invalid',
				code: 'custom',
			},
		])

		const result = {
			success: false,
			error,
		}

		const response = (await validationErrorWrapperHook(result, fakeContext))!
		const json = await response.json()

		assert.strictEqual(response.status, HTTP_STATUS.BAD_REQUEST)
		assert.strictEqual(json.error.code, 'VALIDATION_ERROR')
		assert.strictEqual(json.error.message, 'Validation error')
	})
})
