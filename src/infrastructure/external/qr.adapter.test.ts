import * as assert from 'node:assert'

import { describe, test } from 'node:test'
import { QrAdapter } from './qr.adapter'

describe('QrAdapter', () => {
	test('should generate QR code', async () => {
		const adapter = new QrAdapter()
		const url = 'https://example.com'

		const qrCodeSvg = await adapter.generate(url, {
			format: 'svg',
			size: 300,
			ecc: 'quartile',
		})

		assert.ok(qrCodeSvg)
		assert.ok(qrCodeSvg.length > 0)

		const qrCodePng = await adapter.generate(url, {
			format: 'png',
			size: 300,
			ecc: 'medium',
		})

		assert.ok(qrCodePng)
		assert.ok(qrCodePng.length > 0)
	})
})
