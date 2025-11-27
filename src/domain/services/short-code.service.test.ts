import * as assert from 'node:assert'

import { ShortCodeService } from './short-code.service'
import type { LinkRepository } from '../repositories'
import type { ShortCode } from '../value-objects'
import { describe, test, mock } from 'node:test'

describe('ShortCodeService', () => {
	describe('generateUniqueCode', () => {
		test('should generate unique code on first attempt', async () => {
			const findByShortCodeMock = mock.fn(async () => null)
			const mockLinkRepository: LinkRepository = {
				findByShortCode: findByShortCodeMock,
			} as unknown as LinkRepository

			const service = new ShortCodeService(mockLinkRepository, 10)
			const code = await service.generateUniqueCode()

			assert.ok(code)
			assert.strictEqual(findByShortCodeMock.mock.calls.length, 1)
		})

		test('should retry when code already exists', async () => {
			let callCount = 0
			const findByShortCodeMock = mock.fn(async () => {
				callCount++
				if (callCount < 3) {
					return {}
				}
				return null
			})
			const mockLinkRepository: LinkRepository = {
				findByShortCode: findByShortCodeMock,
			} as unknown as LinkRepository

			const service = new ShortCodeService(mockLinkRepository, 10)
			const code = await service.generateUniqueCode()

			assert.ok(code)
			assert.strictEqual(findByShortCodeMock.mock.calls.length, 3)
		})

		test('should throw error after max attempts', async () => {
			const findByShortCodeMock = mock.fn(async () => ({}))
			const mockLinkRepository: LinkRepository = {
				findByShortCode: findByShortCodeMock,
			} as unknown as LinkRepository

			const service = new ShortCodeService(mockLinkRepository, 5)

			await assert.rejects(async () => {
				await service.generateUniqueCode()
			}, /Failed to generate unique short code after maximum attempts/)

			assert.strictEqual(findByShortCodeMock.mock.calls.length, 5)
		})

		test('should generate different codes on retry', async () => {
			let callCount = 0
			const generatedCodes: string[] = []
			const findByShortCodeMock = mock.fn(async (code: ShortCode) => {
				const value = code.getValue()
				generatedCodes.push(value)
				callCount++

				if (callCount >= 3) {
					return null
				}
				return {}
			})
			const mockLinkRepository: LinkRepository = {
				findByShortCode: findByShortCodeMock,
			} as unknown as LinkRepository

			const service = new ShortCodeService(mockLinkRepository, 10)
			const code = await service.generateUniqueCode()

			assert.ok(code)
			assert.strictEqual(generatedCodes.length, 3)
		})
	})
})
