import * as assert from 'node:assert'

import { describe, test } from 'node:test'
import { Url } from './url'

describe('Url', () => {
	describe('create', () => {
		test('should create Url with valid HTTP URL', () => {
			const url = Url.create('http://example.com')
			assert.strictEqual(url.getValue(), 'http://example.com')
		})

		test('should create Url with valid HTTPS URL', () => {
			const url = Url.create('https://example.com')
			assert.strictEqual(url.getValue(), 'https://example.com')
		})

		test('should create Url with path and query params', () => {
			const urlString = 'https://example.com/path?query=param'
			const url = Url.create(urlString)
			assert.strictEqual(url.getValue(), urlString)
		})

		test('should create Url with port', () => {
			const urlString = 'https://example.com:8080'
			const url = Url.create(urlString)
			assert.strictEqual(url.getValue(), urlString)
		})

		test('should create Url with fragment', () => {
			const urlString = 'https://example.com#section'
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
				Url.create('example.com')
			}, /Invalid URL format/)
		})
	})

	describe('getValue', () => {
		test('should return correct URL string', () => {
			const urlString = 'https://example.com/path'
			const url = Url.create(urlString)
			assert.strictEqual(url.getValue(), urlString)
		})
	})
})
