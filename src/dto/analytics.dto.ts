import { z } from '@hono/zod-openapi'

const clickDetailSchema = z.object({
	id: z.number().openapi({ example: 1 }),
	clickedAt: z.string().openapi({ example: '2025-01-15T10:30:00Z' }),
	ip: z.string().nullable().openapi({ example: '192.168.1.1' }),
	userAgent: z.string().nullable().openapi({ example: 'Mozilla/5.0...' }),
	referer: z.string().nullable().openapi({ example: 'https://google.com' }),
})

const clicksByDateSchema = z.object({
	date: z.string().openapi({ example: '2025-01-15' }),
	count: z.number().openapi({ example: 42 }),
})

const topRefererSchema = z.object({
	referer: z.string().nullable().openapi({ example: 'https://google.com' }),
	count: z.number().openapi({ example: 15 }),
})

const linkStatsResponseSchema = z.object({
	link: z.object({
		id: z.number().openapi({ example: 1 }),
		originalUrl: z.string().openapi({ example: 'https://example.com/very/long/url' }),
		shortCode: z.string().openapi({ example: 'abc123' }),
		title: z.string().nullable().openapi({ example: 'My Link' }),
		createdAt: z.string().openapi({ example: '2025-01-01T00:00:00Z' }),
	}),
	totalClicks: z.number().openapi({ example: 150 }),
	recentClicks: z.array(clickDetailSchema),
	clicksByDate: z.array(clicksByDateSchema),
	topReferers: z.array(topRefererSchema),
})

const topLinkSchema = z.object({
	linkId: z.number().openapi({ example: 1 }),
	originalUrl: z.string().openapi({ example: 'https://example.com' }),
	shortCode: z.string().openapi({ example: 'abc123' }),
	title: z.string().nullable().openapi({ example: 'My Link' }),
	clickCount: z.number().openapi({ example: 42 }),
})

const overviewResponseSchema = z.object({
	totalLinks: z.number().openapi({ example: 25 }),
	totalClicks: z.number().openapi({ example: 500 }),
	topLinks: z.array(topLinkSchema),
})

export {
	clickDetailSchema,
	clicksByDateSchema,
	topRefererSchema,
	linkStatsResponseSchema,
	topLinkSchema,
	overviewResponseSchema,
}
