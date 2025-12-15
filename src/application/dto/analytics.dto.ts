import { paginationSchema, type PaginationDto } from './common.dto'
import { linkDataSchema, type LinkResponseDto } from './link.dto'
import { z } from '@hono/zod-openapi'

export const clickDetailSchema = z.object({
	id: z.number().openapi({ example: 1 }),
	clickedAt: z.iso.datetime().openapi({ example: '2025-01-15T10:30:00Z' }),
	ip: z.string().nullable().openapi({ example: '192.168.1.1' }),
	userAgent: z.string().nullable().openapi({ example: 'Mozilla/5.0...' }),
	referer: z.string().nullable().openapi({ example: 'https://github.com/omnifaced' }),
})

export const clicksByDateSchema = z.object({
	date: z.string(),
	count: z.number(),
})

export const topRefererSchema = z.object({
	referer: z.string().nullable().openapi({ example: 'https://github.com/omnifaced' }),
	count: z.number().openapi({ example: 42 }),
})

export const analyticsLinkSchema = z.object({
	id: z.number().openapi({ example: 1 }),
	originalUrl: z.string().openapi({ example: 'https://github.com/omnifaced' }),
	shortCode: z.string().openapi({ example: 'abc123' }),
	title: z.string().nullable().openapi({ example: 'My Link' }),
	clickCount: z.number().openapi({ example: 42 }),
	createdAt: z.iso.datetime().openapi({ example: '2025-01-01T00:00:00Z' }),
})

export const listAnalyticsLinksQuerySchema = z.object({
	sort: z.enum(['top', 'recent']).optional().default('top').openapi({ example: 'top' }),
	page: z.string().optional().default('1').transform(Number).openapi({ example: '1' }),
	limit: z.string().optional().default('10').transform(Number).openapi({ example: '10' }),
})

export const linkClicksQuerySchema = z.object({
	type: z.enum(['recent', 'referers']).openapi({ example: 'recent' }),
	page: z.string().optional().default('1').transform(Number).openapi({ example: '1' }),
	limit: z.string().optional().default('10').transform(Number).openapi({ example: '10' }),
})

export const clicksByDateQuerySchema = z.object({
	days: z.string().optional().default('30').transform(Number).openapi({ example: '30' }),
	page: z.string().optional().default('1').transform(Number).openapi({ example: '1' }),
	limit: z.string().optional().default('10').transform(Number).openapi({ example: '10' }),
})

const topLinksDataSchema = z.object({
	type: z.literal('top'),
	links: z.array(analyticsLinkSchema),
	pagination: paginationSchema,
})

const recentLinksDataSchema = z.object({
	type: z.literal('recent'),
	links: z.array(analyticsLinkSchema),
	pagination: paginationSchema,
})

export const listAnalyticsLinksResponseSchema = z.object({
	success: z.literal(true),
	data: z.discriminatedUnion('type', [topLinksDataSchema, recentLinksDataSchema]),
})

export const linkStatsResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		link: linkDataSchema,
		totalClicks: z.number().openapi({ example: 150 }),
	}),
})

const recentClicksDataSchema = z.object({
	type: z.literal('recent'),
	clicks: z.array(clickDetailSchema),
	pagination: paginationSchema,
})

const topReferersDataSchema = z.object({
	type: z.literal('referers'),
	referers: z.array(topRefererSchema),
	pagination: paginationSchema,
})

export const linkClicksResponseSchema = z.object({
	success: z.literal(true),
	data: z.discriminatedUnion('type', [recentClicksDataSchema, topReferersDataSchema]),
})

export const clicksByDateResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		items: z.array(clicksByDateSchema),
		pagination: paginationSchema,
	}),
})

export type ListAnalyticsLinksQueryDto = z.infer<typeof listAnalyticsLinksQuerySchema>
export type LinkClicksQueryDto = z.infer<typeof linkClicksQuerySchema>
export type ClicksByDateQueryDto = z.infer<typeof clicksByDateQuerySchema>

export type ListAnalyticsLinksResponseDto =
	| {
			type: 'top'
			links: Array<z.infer<typeof analyticsLinkSchema>>
			pagination: PaginationDto
	  }
	| {
			type: 'recent'
			links: Array<z.infer<typeof analyticsLinkSchema>>
			pagination: PaginationDto
	  }

export interface LinkStatsResponseDto {
	link: LinkResponseDto
	totalClicks: number
}

export type LinkClicksResponseDto =
	| {
			type: 'recent'
			clicks: Array<z.infer<typeof clickDetailSchema>>
			pagination: PaginationDto
	  }
	| {
			type: 'referers'
			referers: Array<z.infer<typeof topRefererSchema>>
			pagination: PaginationDto
	  }

export interface ClicksByDateResponseDto {
	items: Array<z.infer<typeof clicksByDateSchema>>
	pagination: PaginationDto
}
