import * as assert from 'node:assert/strict'

import { clickDetailSchema, clicksByDateSchema, linkStatsResponseSchema, topRefererSchema } from './analytics.dto'
import { describe, it } from 'node:test'

describe('analytics.dto', () => {
	describe('clickDetailSchema', () => {
		it('should parse valid click with all fields', () => {
			const data = {
				id: 1,
				clickedAt: '2025-01-15T10:30:00Z',
				ip: '192.168.1.1',
				userAgent: 'Mozilla/5.0...',
				referer: 'https://github.com/omnifaced',
			}

			const result = clickDetailSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should parse valid click with null fields', () => {
			const data = {
				id: 1,
				clickedAt: '2025-01-15T10:30:00Z',
				ip: null,
				userAgent: null,
				referer: null,
			}

			const result = clickDetailSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when id is missing', () => {
			const data = {
				clickedAt: '2025-01-15T10:30:00Z',
				ip: null,
				userAgent: null,
				referer: null,
			}

			assert.throws(() => clickDetailSchema.parse(data))
		})
	})

	describe('clicksByDateSchema', () => {
		it('should parse valid clicks by date', () => {
			const data = {
				date: '2025-01-15',
				count: 42,
			}

			const result = clicksByDateSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when count is not a number', () => {
			const data = {
				date: '2025-01-15',
				count: '42',
			}

			assert.throws(() => clicksByDateSchema.parse(data))
		})
	})

	describe('topRefererSchema', () => {
		it('should parse valid referer', () => {
			const data = {
				referer: 'https://github.com/omnifaced',
				count: 42,
			}

			const result = topRefererSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should parse referer with null', () => {
			const data = {
				referer: null,
				count: 10,
			}

			const result = topRefererSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when count is missing', () => {
			const data = {
				referer: 'https://github.com/omnifaced',
			}

			assert.throws(() => topRefererSchema.parse(data))
		})
	})

	describe('linkStatsResponseSchema', () => {
		it('should parse valid link stats response', () => {
			const data = {
				success: true,
				data: {
					link: {
						id: 1,
						originalUrl: 'https://github.com/omnifaced',
						shortCode: 'abc123',
						title: 'My Link',
						isActive: true,
						createdAt: '2025-01-01T00:00:00Z',
						expiresAt: '2025-12-31T23:59:59Z',
					},
					totalClicks: 150,
				},
			}

			const result = linkStatsResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should parse link stats with null title and expiresAt', () => {
			const data = {
				success: true,
				data: {
					link: {
						id: 1,
						originalUrl: 'https://github.com/omnifaced',
						shortCode: 'abc123',
						title: null,
						isActive: true,
						createdAt: '2025-01-01T00:00:00Z',
						expiresAt: null,
					},
					totalClicks: 0,
				},
			}

			const result = linkStatsResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when success is not true', () => {
			const data = {
				success: false,
				data: {
					link: {
						id: 1,
						originalUrl: 'https://github.com/omnifaced',
						shortCode: 'abc123',
						title: null,
						isActive: true,
						createdAt: '2025-01-01T00:00:00Z',
						expiresAt: null,
					},
					totalClicks: 0,
					clicksByDate: [],
				},
			}

			assert.throws(() => linkStatsResponseSchema.parse(data))
		})
	})
})
