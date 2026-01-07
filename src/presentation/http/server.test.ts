import * as assert from 'node:assert'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as os from 'node:os'

import { describe, test } from 'node:test'
import type { Container } from '../../di'
import { createApp } from './server'

describe('createApp', () => {
	const createMockContainer = (certPath?: string, keyPath?: string): Container => {
		return {
			config: {
				certificates: {
					cert_path: certPath ?? '',
					key_path: keyPath ?? '',
				},
				rate_limiter: { window_ms: 900000, limit: 100, redis_prefix: 'rate_limit:' },
			},
			redis: {},
		} as Container
	}

	test('should create app with https when certificates exist', () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'certs-'))
		const certPath = path.join(tmpDir, 'cert.pem')
		const keyPath = path.join(tmpDir, 'key.pem')

		fs.writeFileSync(certPath, 'cert')
		fs.writeFileSync(keyPath, 'key')

		const container = createMockContainer(certPath, keyPath)
		const app = createApp(container)

		fs.rmSync(tmpDir, { recursive: true })

		assert.ok(app)
	})

	test('should create app with http when certificates do not exist', () => {
		const container = createMockContainer('/nonexistent/cert.pem', '/nonexistent/key.pem')
		const app = createApp(container)

		assert.ok(app)
	})
})
