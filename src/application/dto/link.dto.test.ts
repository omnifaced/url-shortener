import * as assert from 'node:assert/strict'

import {
	createLinkSchema,
	updateLinkSchema,
	listLinksQuerySchema,
	linkIdParamSchema,
	qrQuerySchema,
	linkDataSchema,
	linkResponseSchema,
	listLinksResponseSchema,
} from './link.dto'

import { describe, it } from 'node:test'

describe('link.dto', () => {
	describe('createLinkSchema', () => {
		it('should parse valid link with only required fields', () => {
			const data = {
				originalUrl: 'https://github.com/omnifaced',
			}

			const result = createLinkSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should parse valid link with title', () => {
			const data = {
				originalUrl: 'https://github.com/omnifaced',
				title: 'My Link',
			}

			const result = createLinkSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should parse valid link with expiresAt', () => {
			const futureDate = new Date(Date.now() + 86400000).toISOString()
			const data = {
				originalUrl: 'https://github.com/omnifaced',
				expiresAt: futureDate,
			}

			const result = createLinkSchema.parse(data)
			assert.strictEqual(result.originalUrl, data.originalUrl)
			assert.strictEqual(result.expiresAt, futureDate)
		})

		it('should fail when originalUrl is not a valid URL', () => {
			const data = {
				originalUrl: 'not-a-url',
			}

			assert.throws(() => createLinkSchema.parse(data))
		})

		it('should fail when title is too long', () => {
			const data = {
				originalUrl: 'https://github.com/omnifaced',
				title: 'a'.repeat(256),
			}

			assert.throws(() => createLinkSchema.parse(data))
		})

		it('should fail when expiresAt is in the past', () => {
			const pastDate = new Date(Date.now() - 86400000).toISOString()
			const data = {
				originalUrl: 'https://github.com/omnifaced',
				expiresAt: pastDate,
			}

			assert.throws(() => createLinkSchema.parse(data))
		})
	})

	describe('updateLinkSchema', () => {
		it('should parse update with title', () => {
			const data = {
				title: 'Updated Title',
			}

			const result = updateLinkSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should parse update without title field', () => {
			const data = {}

			const result = updateLinkSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should parse update with isActive', () => {
			const data = {
				isActive: false,
			}

			const result = updateLinkSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should parse update with both title and isActive', () => {
			const data = {
				title: 'New Title',
				isActive: true,
			}

			const result = updateLinkSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should parse empty update', () => {
			const data = {}

			const result = updateLinkSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})
	})

	describe('listLinksQuerySchema', () => {
		it('should parse with default values', () => {
			const data = {}

			const result = listLinksQuerySchema.parse(data)
			assert.strictEqual(result.page, 1)
			assert.strictEqual(result.limit, 10)
		})

		it('should parse with custom page and limit', () => {
			const data = {
				page: '2',
				limit: '20',
			}

			const result = listLinksQuerySchema.parse(data)
			assert.strictEqual(result.page, 2)
			assert.strictEqual(result.limit, 20)
		})

		it('should transform string to number', () => {
			const data = {
				page: '5',
				limit: '15',
			}

			const result = listLinksQuerySchema.parse(data)
			assert.strictEqual(typeof result.page, 'number')
			assert.strictEqual(typeof result.limit, 'number')
		})
	})

	describe('linkIdParamSchema', () => {
		it('should parse valid id', () => {
			const data = {
				id: '123',
			}

			const result = linkIdParamSchema.parse(data)
			assert.strictEqual(result.id, 123)
		})

		it('should transform string to number', () => {
			const data = {
				id: '1',
			}

			const result = linkIdParamSchema.parse(data)
			assert.strictEqual(typeof result.id, 'number')
		})
	})

	describe('qrQuerySchema', () => {
		it('should parse with default values', () => {
			const data = {}

			const result = qrQuerySchema.parse(data)
			assert.strictEqual(result.format, 'svg')
			assert.strictEqual(result.size, 200)
			assert.strictEqual(result.ecc, 'medium')
		})

		it('should parse with custom format', () => {
			const data = {
				format: 'png',
			}

			const result = qrQuerySchema.parse(data)
			assert.strictEqual(result.format, 'png')
		})

		it('should parse with custom size', () => {
			const data = {
				size: '512',
			}

			const result = qrQuerySchema.parse(data)
			assert.strictEqual(result.size, 512)
		})

		it('should parse with custom ecc', () => {
			const data = {
				ecc: 'high',
			}

			const result = qrQuerySchema.parse(data)
			assert.strictEqual(result.ecc, 'high')
		})

		it('should fail with invalid format', () => {
			const data = {
				format: 'jpg',
			}

			assert.throws(() => qrQuerySchema.parse(data))
		})

		it('should fail with invalid ecc', () => {
			const data = {
				ecc: 'invalid',
			}

			assert.throws(() => qrQuerySchema.parse(data))
		})
	})

	describe('linkDataSchema', () => {
		it('should parse valid link data', () => {
			const data = {
				id: 1,
				originalUrl: 'https://github.com/omnifaced',
				shortCode: 'abc123',
				title: 'My Example Link',
				isActive: true,
				createdAt: '2025-01-01T00:00:00Z',
				expiresAt: '2025-12-31T23:59:59Z',
			}

			const result = linkDataSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should parse link data with null title and expiresAt', () => {
			const data = {
				id: 1,
				originalUrl: 'https://github.com/omnifaced',
				shortCode: 'abc123',
				title: null,
				isActive: true,
				createdAt: '2025-01-01T00:00:00Z',
				expiresAt: null,
			}

			const result = linkDataSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when id is missing', () => {
			const data = {
				originalUrl: 'https://github.com/omnifaced',
				shortCode: 'abc123',
				title: null,
				isActive: true,
				createdAt: '2025-01-01T00:00:00Z',
				expiresAt: null,
			}

			assert.throws(() => linkDataSchema.parse(data))
		})

		it('should fail when isActive is not boolean', () => {
			const data = {
				id: 1,
				originalUrl: 'https://github.com/omnifaced',
				shortCode: 'abc123',
				title: null,
				isActive: 'true',
				createdAt: '2025-01-01T00:00:00Z',
				expiresAt: null,
			}

			assert.throws(() => linkDataSchema.parse(data))
		})
	})

	describe('linkResponseSchema', () => {
		it('should parse valid link response', () => {
			const data = {
				success: true,
				data: {
					id: 1,
					originalUrl: 'https://github.com/omnifaced',
					shortCode: 'abc123',
					title: 'My Example Link',
					isActive: true,
					createdAt: '2025-01-01T00:00:00Z',
					expiresAt: '2025-12-31T23:59:59Z',
				},
			}

			const result = linkResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when success is not true', () => {
			const data = {
				success: false,
				data: {
					id: 1,
					originalUrl: 'https://github.com/omnifaced',
					shortCode: 'abc123',
					title: 'My Example Link',
					isActive: true,
					createdAt: '2025-01-01T00:00:00Z',
					expiresAt: '2025-12-31T23:59:59Z',
				},
			}

			assert.throws(() => linkResponseSchema.parse(data))
		})
	})

	describe('listLinksResponseSchema', () => {
		it('should parse valid list response', () => {
			const data = {
				success: true,
				data: {
					links: [
						{
							id: 1,
							originalUrl: 'https://github.com/omnifaced',
							shortCode: 'abc123',
							title: 'My Example Link',
							isActive: true,
							createdAt: '2025-01-01T00:00:00Z',
							expiresAt: '2025-12-31T23:59:59Z',
						},
					],
					pagination: {
						page: 1,
						limit: 10,
						total: 100,
						totalPages: 10,
					},
				},
			}

			const result = listLinksResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should parse list response with empty links', () => {
			const data = {
				success: true,
				data: {
					links: [],
					pagination: {
						page: 1,
						limit: 10,
						total: 0,
						totalPages: 0,
					},
				},
			}

			const result = listLinksResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when pagination is missing', () => {
			const data = {
				success: true,
				data: {
					links: [],
				},
			}

			assert.throws(() => listLinksResponseSchema.parse(data))
		})
	})
})
