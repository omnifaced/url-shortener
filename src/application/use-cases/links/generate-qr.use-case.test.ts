import * as assert from 'node:assert'

import { createMockLink, createMockOwnershipService } from './links.test-helpers'
import { NotFoundError, ForbiddenError } from '../../errors'
import { GenerateQrUseCase } from './generate-qr.use-case'
import { describe, test, mock } from 'node:test'
import type { QrPort } from '../../ports'

describe('GenerateQrUseCase', () => {
	test('should generate QR code for link', async () => {
		const link = createMockLink()
		const mockQrCode = Buffer.from('qr-code-data')
		const mockOwnershipService = createMockOwnershipService(link)

		let capturedUrl: string | undefined

		const generateMock = mock.fn(async (url: string) => {
			capturedUrl = url
			return mockQrCode
		})

		const mockQrPort: QrPort = {
			generate: generateMock,
		}

		const useCase = new GenerateQrUseCase(mockOwnershipService, mockQrPort, 'https://short.url')

		const result = await useCase.execute(10, 1, { format: 'png', size: 512, ecc: 'high' })

		assert.deepStrictEqual(result, mockQrCode)
		assert.strictEqual(generateMock.mock.calls.length, 1)
		assert.strictEqual(capturedUrl, 'https://short.url/abc123')
	})

	test('should throw NotFoundError when link does not exist', async () => {
		const mockOwnershipService = createMockOwnershipService(null, new NotFoundError('Link', 1))

		const mockQrPort: QrPort = {
			generate: mock.fn(),
		}

		const useCase = new GenerateQrUseCase(mockOwnershipService, mockQrPort, 'https://short.url')

		await assert.rejects(async () => {
			await useCase.execute(10, 1, { format: 'png', size: 512, ecc: 'high' })
		}, NotFoundError)
	})

	test('should throw ForbiddenError when user does not own the link', async () => {
		const mockOwnershipService = createMockOwnershipService(
			null,
			new ForbiddenError('You do not have permission to access this link')
		)

		const mockQrPort: QrPort = {
			generate: mock.fn(),
		}

		const useCase = new GenerateQrUseCase(mockOwnershipService, mockQrPort, 'https://short.url')

		await assert.rejects(async () => {
			await useCase.execute(99, 1, { format: 'png', size: 512, ecc: 'high' })
		}, ForbiddenError)
	})
})
