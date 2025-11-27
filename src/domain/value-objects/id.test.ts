import * as assert from 'node:assert'

import { describe, test } from 'node:test'
import { Id } from './id'

describe('Id', () => {
	describe('create', () => {
		test('should create Id with positive integer', () => {
			const id = Id.create(1)
			assert.strictEqual(id.getValue(), 1)
		})

		test('should create Id with large positive integer', () => {
			const id = Id.create(999999)
			assert.strictEqual(id.getValue(), 999999)
		})

		test('should throw error for zero', () => {
			assert.throws(() => {
				Id.create(0)
			}, /ID must be a positive integer/)
		})

		test('should throw error for negative number', () => {
			assert.throws(() => {
				Id.create(-1)
			}, /ID must be a positive integer/)
		})

		test('should throw error for non-integer', () => {
			assert.throws(() => {
				Id.create(1.5)
			}, /ID must be a positive integer/)
		})
	})

	describe('createNew', () => {
		test('should create new unsaved Id', () => {
			const id = Id.createNew()
			assert.throws(() => {
				id.getValue()
			}, /Cannot get value of unsaved entity ID/)
		})
	})

	describe('getValue', () => {
		test('should return correct value for saved Id', () => {
			const id = Id.create(42)
			assert.strictEqual(id.getValue(), 42)
		})

		test('should throw error for unsaved Id', () => {
			const id = Id.createNew()
			assert.throws(() => {
				id.getValue()
			}, /Cannot get value of unsaved entity ID/)
		})
	})
})
