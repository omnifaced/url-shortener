import * as assert from 'node:assert'

import { describe, test } from 'node:test'
import { Username } from './username'

describe('Username', () => {
	describe('create', () => {
		test('should create Username with valid string', () => {
			const username = Username.create('john')
			assert.strictEqual(username.getValue(), 'john')
		})

		test('should create Username with minimum length', () => {
			const username = Username.create('abc')
			assert.strictEqual(username.getValue(), 'abc')
		})

		test('should create Username with maximum length', () => {
			const longName = 'a'.repeat(255)
			const username = Username.create(longName)
			assert.strictEqual(username.getValue(), longName)
		})

		test('should throw error for too short username', () => {
			assert.throws(() => {
				Username.create('ab')
			}, /Username must be between 3 and 255 characters/)
		})

		test('should throw error for empty username', () => {
			assert.throws(() => {
				Username.create('')
			}, /Username must be between 3 and 255 characters/)
		})

		test('should throw error for too long username', () => {
			assert.throws(() => {
				Username.create('a'.repeat(256))
			}, /Username must be between 3 and 255 characters/)
		})
	})

	describe('getValue', () => {
		test('should return correct value', () => {
			const username = Username.create('test_user')
			assert.strictEqual(username.getValue(), 'test_user')
		})
	})
})
