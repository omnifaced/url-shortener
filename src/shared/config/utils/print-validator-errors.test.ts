import * as assert from 'node:assert'

import { printValidatorErrors } from './print-validator-errors'
import { describe, test, mock } from 'node:test'
import type { ConsolaInstance } from 'consola'
import type { ErrorObject } from 'ajv'

describe('printValidatorErrors', () => {
	test('should print validation errors with logger', () => {
		const errorMock = mock.fn()
		const warnMock = mock.fn()

		const mockLogger = {
			error: errorMock,
			warn: warnMock,
		} as unknown as ConsolaInstance

		const errors: ErrorObject[] = [
			{
				keyword: 'required',
				instancePath: '/app',
				params: { missingProperty: 'port' },
				schemaPath: '',
				data: {},
			},
			{
				keyword: 'type',
				instancePath: '/app',
				params: { type: 'number', missingProperty: 'host' },
				schemaPath: '',
				data: 123,
			},
		]

		printValidatorErrors(errors, 'config.yaml', mockLogger)

		assert.strictEqual(errorMock.mock.calls.length, 2)
		assert.strictEqual(warnMock.mock.calls.length, 2)
		assert.strictEqual(errorMock.mock.calls[0].arguments[0], 'Configuration validation failed for: config.yaml')
		assert.strictEqual(errorMock.mock.calls[1].arguments[0], 'Found 2 validation error(s)')
	})

	test('should not print anything when errors array is empty', () => {
		const errorMock = mock.fn()
		const warnMock = mock.fn()

		const mockLogger = {
			error: errorMock,
			warn: warnMock,
		} as unknown as ConsolaInstance

		printValidatorErrors([], 'config.yaml', mockLogger)

		assert.strictEqual(errorMock.mock.calls.length, 0)
		assert.strictEqual(warnMock.mock.calls.length, 0)
	})

	test('should handle undefined errors gracefully', () => {
		const errorMock = mock.fn()
		const warnMock = mock.fn()

		const mockLogger = {
			error: errorMock,
			warn: warnMock,
		} as unknown as ConsolaInstance

		printValidatorErrors(undefined!, 'config.yaml', mockLogger)

		assert.strictEqual(errorMock.mock.calls.length, 0)
		assert.strictEqual(warnMock.mock.calls.length, 0)
	})
})
