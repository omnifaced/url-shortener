import * as assert from 'node:assert'

import { PasswordAdapter } from './password.adapter'
import { describe, test } from 'node:test'

describe('PasswordAdapter', () => {
	describe('hash', () => {
		test('should hash password', async () => {
			const adapter = new PasswordAdapter()
			const password = 'my_password123'

			const hash = await adapter.hash(password)

			assert.ok(hash)
			assert.ok(hash.includes(':'))
			assert.ok(hash.length > 0)
		})

		test('should generate different hashes for same password', async () => {
			const adapter = new PasswordAdapter()
			const password = 'my_password123'

			const hash1 = await adapter.hash(password)
			const hash2 = await adapter.hash(password)

			assert.notStrictEqual(hash1, hash2)
		})

		test('should generate hash with salt and key', async () => {
			const adapter = new PasswordAdapter()
			const password = 'my_password123'

			const hash = await adapter.hash(password)
			const parts = hash.split(':')

			assert.strictEqual(parts.length, 2)
			assert.ok(parts[0].length > 0)
			assert.ok(parts[1].length > 0)
		})
	})

	describe('verify', () => {
		test('should verify correct password', async () => {
			const adapter = new PasswordAdapter()
			const password = 'my_password123'

			const hash = await adapter.hash(password)
			const isValid = await adapter.verify(password, hash)

			assert.strictEqual(isValid, true)
		})

		test('should reject incorrect password', async () => {
			const adapter = new PasswordAdapter()
			const password = 'my_password123'

			const hash = await adapter.hash(password)
			const isValid = await adapter.verify('wrong_password', hash)

			assert.strictEqual(isValid, false)
		})

		test('should verify password with different case', async () => {
			const adapter = new PasswordAdapter()
			const password = 'my_password123'

			const hash = await adapter.hash(password)
			const isValid = await adapter.verify('MY_PASSWORD123', hash)

			assert.strictEqual(isValid, false)
		})

		test('should handle empty password', async () => {
			const adapter = new PasswordAdapter()
			const password = ''

			const hash = await adapter.hash(password)
			const isValid = await adapter.verify('', hash)

			assert.strictEqual(isValid, true)
		})
	})
})
