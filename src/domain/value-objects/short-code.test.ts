import * as assert from 'node:assert'

import { describe, test } from 'node:test'
import { ShortCode } from './short-code'

describe('ShortCode', () => {
	describe('create', () => {
		test('should create ShortCode with valid string', () => {
			const code = ShortCode.create('abc123')
			assert.strictEqual(code.getValue(), 'abc123')
		})

		test('should create ShortCode with single character', () => {
			const code = ShortCode.create('a')
			assert.strictEqual(code.getValue(), 'a')
		})

		test('should create ShortCode with max length', () => {
			const code = ShortCode.create('a'.repeat(10))
			assert.strictEqual(code.getValue(), 'a'.repeat(10))
		})

		test('should throw error for empty string', () => {
			assert.throws(() => {
				ShortCode.create('')
			}, /Short code must be between 1 and 10 characters/)
		})

		test('should throw error for too long string', () => {
			assert.throws(() => {
				ShortCode.create('a'.repeat(11))
			}, /Short code must be between 1 and 10 characters/)
		})
	})

	describe('generate', () => {
		test('should generate ShortCode with default length', () => {
			const code = ShortCode.generate()
			assert.strictEqual(code.getValue().length, 6)
		})

		test('should generate ShortCode with only allowed characters', () => {
			const code = ShortCode.generate()
			const allowedChars = /^[a-zA-Z0-9]+$/
			assert.match(code.getValue(), allowedChars)
		})

		test('should generate different codes', () => {
			const code1 = ShortCode.generate()
			const code2 = ShortCode.generate()
			assert.notStrictEqual(code1.getValue(), code2.getValue())
		})
	})

	describe('configure', () => {
		test('should configure length and maxLength', () => {
			ShortCode.configure(8, 12)
			const code = ShortCode.generate()
			assert.strictEqual(code.getValue().length, 8)

			ShortCode.configure(6, 10)
		})
	})

	describe('getValue', () => {
		test('should return correct value', () => {
			const code = ShortCode.create('test123')
			assert.strictEqual(code.getValue(), 'test123')
		})
	})
})
