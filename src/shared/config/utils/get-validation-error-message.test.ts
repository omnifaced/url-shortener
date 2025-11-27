import * as assert from 'node:assert'

import { getValidationErrorMessage } from './get-validation-error-message'
import { describe, test } from 'node:test'
import type { ErrorObject } from 'ajv'

describe('getValidationErrorMessage', () => {
	test('should format required error', () => {
		const error: ErrorObject = {
			keyword: 'required',
			instancePath: '/config',
			params: { missingProperty: 'port' },
			schemaPath: '/',
		}

		const message = getValidationErrorMessage(error, 'config.yaml')

		assert.strictEqual(message, "Missing required field '/config/port' in config.yaml")
	})

	test('should format type error', () => {
		const error = {
			keyword: 'type',
			instancePath: '/config',
			params: { missingProperty: 'port', type: 'number' },
			data: 'string',
			schemaPath: '/',
		}

		const message = getValidationErrorMessage(error, 'config.yaml')

		assert.strictEqual(message, "Field '/config/port' in config.yaml must be of type number, but found string")
	})

	test('should format additionalProperties error', () => {
		const error = {
			keyword: 'additionalProperties',
			instancePath: '/config',
			params: { missingProperty: 'extra' },
			schemaPath: '/',
		}

		const message = getValidationErrorMessage(error, 'config.yaml')

		assert.strictEqual(
			message,
			"Field '/config/extra' in config.yaml contains additional properties not allowed by the schema"
		)
	})

	test('should format enum error', () => {
		const error = {
			keyword: 'enum',
			instancePath: '/config',
			params: { missingProperty: 'env', allowedValues: ['dev', 'prod'] },
			schemaPath: '/',
		}

		const message = getValidationErrorMessage(error, 'config.yaml')

		assert.strictEqual(message, "Field '/config/env' in config.yaml must be one of: dev, prod")
	})

	test('should format pattern error', () => {
		const error = {
			keyword: 'pattern',
			instancePath: '/config',
			params: { missingProperty: 'host', pattern: '^[a-z]+$' },
			schemaPath: '/',
		}

		const message = getValidationErrorMessage(error, 'config.yaml')

		assert.strictEqual(
			message,
			"Field '/config/host' in config.yaml does not match the required pattern '^[a-z]+$'"
		)
	})

	test('should format minimum error', () => {
		const error = {
			keyword: 'minimum',
			instancePath: '/config',
			params: { missingProperty: 'port', limit: 1 },
			schemaPath: '/',
		}

		const message = getValidationErrorMessage(error, 'config.yaml')

		assert.strictEqual(message, "Field '/config/port' in config.yaml must be greater than or equal to 1")
	})

	test('should format maximum error', () => {
		const error = {
			keyword: 'maximum',
			instancePath: '/config',
			params: { missingProperty: 'port', limit: 65535 },
			schemaPath: '/',
		}

		const message = getValidationErrorMessage(error, 'config.yaml')

		assert.strictEqual(message, "Field '/config/port' in config.yaml must be less than or equal to 65535")
	})

	test('should format unknown error with message', () => {
		const error = {
			keyword: 'unknown',
			instancePath: '/config',
			params: { missingProperty: 'field' },
			message: 'Custom error message',
			schemaPath: '/',
		}

		const message = getValidationErrorMessage(error, 'config.yaml')

		assert.strictEqual(message, "Invalid value for field '/config/field' in config.yaml: Custom error message")
	})

	test('should format unknown error without message', () => {
		const error = {
			keyword: 'unknown',
			instancePath: '/config',
			params: { missingProperty: 'field' },
			schemaPath: '/',
		}

		const message = getValidationErrorMessage(error, 'config.yaml')

		assert.strictEqual(message, "Invalid value for field '/config/field' in config.yaml: Unknown error")
	})
})
