import * as assert from 'node:assert'

import { describe, test } from 'node:test'
import { Click } from './click.entity'
import { Id } from '../value-objects'

describe('Click', () => {
	describe('create', () => {
		test('should create Click from props', () => {
			const props = {
				id: Id.create(1),
				linkId: Id.create(10),
				clickedAt: new Date(),
				ip: '127.0.0.1',
				userAgent: 'Mozilla/5.0',
				referer: 'https://github.com/omnifaced',
				deviceInfo: {
					browser: 'Chrome',
					os: 'Windows',
					device: 'Desktop',
				},
			}

			const click = Click.create(props)

			assert.strictEqual(click.getId().getValue(), 1)
			assert.strictEqual(click.getLinkId().getValue(), 10)
			assert.strictEqual(click.getIp(), '127.0.0.1')
			assert.strictEqual(click.getUserAgent(), 'Mozilla/5.0')
			assert.strictEqual(click.getReferer(), 'https://github.com/omnifaced')
			assert.deepStrictEqual(click.getDeviceInfo(), {
				browser: 'Chrome',
				os: 'Windows',
				device: 'Desktop',
			})
		})
	})

	describe('createNew', () => {
		test('should create new Click with all fields', () => {
			const linkId = Id.create(10)
			const ip = '127.0.0.1'
			const userAgent = 'Mozilla/5.0'
			const referer = 'https://github.com/omnifaced'
			const deviceInfo = {
				browser: 'Chrome',
				os: 'Windows',
				device: 'Desktop',
			}

			const click = Click.createNew(linkId, ip, userAgent, referer, deviceInfo)

			assert.strictEqual(click.getLinkId().getValue(), 10)
			assert.strictEqual(click.getIp(), '127.0.0.1')
			assert.strictEqual(click.getUserAgent(), 'Mozilla/5.0')
			assert.strictEqual(click.getReferer(), 'https://github.com/omnifaced')
			assert.deepStrictEqual(click.getDeviceInfo(), deviceInfo)
		})

		test('should create new Click with only linkId', () => {
			const linkId = Id.create(10)

			const click = Click.createNew(linkId)

			assert.strictEqual(click.getLinkId().getValue(), 10)
			assert.strictEqual(click.getIp(), null)
			assert.strictEqual(click.getUserAgent(), null)
			assert.strictEqual(click.getReferer(), null)
			assert.strictEqual(click.getDeviceInfo(), null)
		})

		test('should create new Click with partial fields', () => {
			const linkId = Id.create(10)
			const ip = '127.0.0.1'

			const click = Click.createNew(linkId, ip)

			assert.strictEqual(click.getLinkId().getValue(), 10)
			assert.strictEqual(click.getIp(), '127.0.0.1')
			assert.strictEqual(click.getUserAgent(), null)
			assert.strictEqual(click.getReferer(), null)
			assert.strictEqual(click.getDeviceInfo(), null)
		})
	})

	describe('getClickedAt', () => {
		test('should return clickedAt date', () => {
			const linkId = Id.create(10)
			const click = Click.createNew(linkId)

			assert.ok(click.getClickedAt() instanceof Date)
		})
	})
})
