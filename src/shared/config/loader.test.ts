import * as assert from 'node:assert'

import { describe, test } from 'node:test'
import { loadConfig } from './loader'

describe('loadConfig', () => {
	test('should load configuration', () => {
		const config = loadConfig()

		assert.ok(config)
		assert.ok(config.app)
		assert.strictEqual(typeof config.app.port, 'number')
	})
})
