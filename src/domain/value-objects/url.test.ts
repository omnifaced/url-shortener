import * as assert from 'node:assert'

import { describe, test } from 'node:test'
import { Url } from './url'

describe('Url', () => {
	describe('create', () => {
		test('should create Url with valid HTTP URL', () => {
			const url = Url.create('https://github.com/omnifaced')
			assert.strictEqual(url.getValue(), 'https://github.com/omnifaced')
		})

		test('should create Url with valid HTTPS URL', () => {
			const url = Url.create('https://github.com/omnifaced')
			assert.strictEqual(url.getValue(), 'https://github.com/omnifaced')
		})

		test('should create Url with path and query params', () => {
			const urlString = 'https://github.com/omnifaced/path?query=param'
			const url = Url.create(urlString)
			assert.strictEqual(url.getValue(), urlString)
		})

		test('should create Url with port', () => {
			const urlString = 'https://github.com/omnifaced:8080'
			const url = Url.create(urlString)
			assert.strictEqual(url.getValue(), urlString)
		})

		test('should create Url with fragment', () => {
			const urlString = 'https://github.com/omnifaced#section'
			const url = Url.create(urlString)
			assert.strictEqual(url.getValue(), urlString)
		})

		test('should throw error for invalid URL', () => {
			assert.throws(() => {
				Url.create('not a url')
			}, /Invalid URL format/)
		})

		test('should throw error for empty string', () => {
			assert.throws(() => {
				Url.create('')
			}, /Invalid URL format/)
		})

		test('should throw error for URL without protocol', () => {
			assert.throws(() => {
				Url.create('github.com/omnifaced')
			}, /Invalid URL format/)
		})
	})

	describe('getValue', () => {
		test('should return correct URL string', () => {
			const urlString = 'https://github.com/omnifaced/path'
			const url = Url.create(urlString)
			assert.strictEqual(url.getValue(), urlString)
		})
	})
})
