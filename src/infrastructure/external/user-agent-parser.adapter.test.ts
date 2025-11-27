import * as assert from 'node:assert'

import { UserAgentParserAdapter } from './user-agent-parser.adapter'
import { describe, test } from 'node:test'

describe('UserAgentParserAdapter', () => {
	test('should parse Chrome on Windows', () => {
		const adapter = new UserAgentParserAdapter()
		const userAgent =
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

		const result = adapter.parse(userAgent)

		assert.strictEqual(result.browser, 'Chrome')
		assert.strictEqual(result.os, 'Windows')
		assert.strictEqual(result.device, 'desktop')
	})

	test('should parse Firefox on Linux', () => {
		const adapter = new UserAgentParserAdapter()
		const userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0'

		const result = adapter.parse(userAgent)

		assert.strictEqual(result.browser, 'Firefox')
		assert.strictEqual(result.os, 'Linux')
		assert.strictEqual(result.device, 'desktop')
	})

	test('should parse Safari on macOS', () => {
		const adapter = new UserAgentParserAdapter()
		const userAgent =
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'

		const result = adapter.parse(userAgent)

		assert.strictEqual(result.browser, 'Safari')
		assert.strictEqual(result.os, 'macOS')
	})

	test('should parse mobile Safari on iPhone', () => {
		const adapter = new UserAgentParserAdapter()
		const userAgent =
			'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'

		const result = adapter.parse(userAgent)

		assert.strictEqual(result.browser, 'Mobile Safari')
		assert.strictEqual(result.os, 'iOS')
		assert.strictEqual(result.device, 'mobile')
	})

	test('should handle unknown user agent', () => {
		const adapter = new UserAgentParserAdapter()
		const userAgent = 'Unknown User Agent'

		const result = adapter.parse(userAgent)

		assert.ok(result)
		assert.ok('browser' in result)
		assert.ok('os' in result)
		assert.ok('device' in result)
	})
})
