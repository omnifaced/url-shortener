import { z } from '@hono/zod-openapi'

export const clickDetailSchema = z.object({
	id: z.number().openapi({ example: 1 }),
	clickedAt: z.string().openapi({ example: '2025-01-15T10:30:00Z' }),
	ip: z.string().nullable().openapi({ example: '192.168.1.1' }),
	userAgent: z.string().nullable().openapi({ example: 'Mozilla/5.0...' }),
	referer: z.string().nullable().openapi({ example: 'https://google.com' }),
})

export const clicksByDateSchema = z.object({
	date: z.string(),
	count: z.number(),
})

export const topRefererSchema = z.object({
	referer: z.string().nullable().openapi({ example: '2025-01-15' }),
	count: z.number().openapi({ example: 42 }),
})

const topLinkSchema = z.object({
	linkId: z.number().openapi({ example: 1 }),
	originalUrl: z.string().openapi({ example: 'https://example.com' }),
	shortCode: z.string().openapi({ example: 'abc123' }),
	title: z.string().nullable().openapi({ example: 'My Link' }),
	clickCount: z.number().openapi({ example: 42 }),
})

export const linkStatsResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
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
	}),
})

export const overviewResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		totalLinks: z.number().openapi({ example: 25 }),
		totalClicks: z.number().openapi({ example: 500 }),
		topLinks: z.array(topLinkSchema),
	}),
})

export interface LinkStatsResponseDto {
	link: {
		id: number
		originalUrl: string
		shortCode: string
		title: string | null
		createdAt: string
	}
	totalClicks: number
	recentClicks: Array<z.infer<typeof clickDetailSchema>>
	clicksByDate: Array<z.infer<typeof clicksByDateSchema>>
	topReferers: Array<z.infer<typeof topRefererSchema>>
}

export interface OverviewResponseDto {
	totalLinks: number
	totalClicks: number
	topLinks: Array<z.infer<typeof topLinkSchema>>
}
