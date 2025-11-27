import * as assert from 'node:assert'

import { getCertificatePaths, getBaseUrl, hasCertificates } from './certificates'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { describe, test, after, before } from 'node:test'
import { join } from 'node:path'

describe('certificates', () => {
	const testDir = join(process.cwd(), '__test_certs__')
	const certPath = join(testDir, 'cert.pem')
	const keyPath = join(testDir, 'key.pem')

	before(() => {
		mkdirSync(testDir, { recursive: true })
		writeFileSync(certPath, 'mock-cert')
		writeFileSync(keyPath, 'mock-key')
	})

	after(() => {
		rmSync(testDir, { recursive: true, force: true })
	})

	describe('hasCertificates', () => {
		test('should return true when both certificates exist', () => {
			const result = hasCertificates(certPath, keyPath)

			assert.strictEqual(result, true)
		})

		test('should return false when certificates do not exist', () => {
			const result = hasCertificates('/nonexistent/cert.pem', '/nonexistent/key.pem')

			assert.strictEqual(result, false)
		})

		test('should return false when only cert exists', () => {
			const result = hasCertificates(certPath, '/nonexistent/key.pem')

			assert.strictEqual(result, false)
		})

		test('should return false when only key exists', () => {
			const result = hasCertificates('/nonexistent/cert.pem', keyPath)

			assert.strictEqual(result, false)
		})
	})

	describe('getCertificatePaths', () => {
		test('should return certificate paths object', () => {
			const result = getCertificatePaths('/path/to/cert.pem', '/path/to/key.pem')

			assert.deepStrictEqual(result, {
				cert: '/path/to/cert.pem',
				key: '/path/to/key.pem',
			})
		})
	})

	describe('getBaseUrl', () => {
		test('should return http URL when certificates do not exist', () => {
			const result = getBaseUrl('localhost', 3000, '/nonexistent/cert.pem', '/nonexistent/key.pem')

			assert.strictEqual(result, 'http://localhost:3000')
		})

		test('should return https URL when certificates exist', () => {
			const result = getBaseUrl('localhost', 3000, certPath, keyPath)

			assert.strictEqual(result, 'https://localhost:3000')
		})

		test('should construct URL with correct format', () => {
			const result = getBaseUrl('example.com', 8080, '/nonexistent/cert.pem', '/nonexistent/key.pem')

			assert.strictEqual(result, 'http://example.com:8080')
		})
	})
})
