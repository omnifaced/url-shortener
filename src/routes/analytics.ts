import { authMiddleware, responseMiddleware } from '../middleware'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { eq, and, count, desc, sql } from 'drizzle-orm'
import { validationErrorWrapperHook } from '../hooks'
import { linkIdParamSchema } from '../validators'
import { links, clicks } from '../db/schema'
import type { Variables } from '../types'
import { logger } from '../lib'
import { db } from '../db'

const errorResponseSchema = z.object({
	error: z.string(),
})

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

const linkStatsRoute = createRoute({
	method: 'get',
	path: '/links/{id}/stats',
	tags: ['Analytics'],
	security: [{ Bearer: [] }],
	request: {
		params: linkIdParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: linkStatsResponseSchema,
				},
			},
			description: 'Link statistics',
		},
		401: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Unauthorized',
		},
		404: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Link not found',
		},
	},
})

const overviewRoute = createRoute({
	method: 'get',
	path: '/overview',
	tags: ['Analytics'],
	security: [{ Bearer: [] }],
	responses: {
		200: {
			content: {
				'application/json': {
					schema: overviewResponseSchema,
				},
			},
			description: 'Analytics overview',
		},
		401: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Unauthorized',
		},
	},
})

const analyticsRouter = new OpenAPIHono<{ Variables: Variables }>({
	defaultHook: validationErrorWrapperHook,
})

analyticsRouter.use('*', responseMiddleware)
analyticsRouter.use('*', authMiddleware)

// @ts-expect-error - OpenAPI type inference issue
analyticsRouter.openapi(linkStatsRoute, async (c) => {
	const { id } = c.req.valid('param')
	const auth = c.get('auth')

	const [link] = await db
		.select()
		.from(links)
		.where(and(eq(links.id, id), eq(links.userId, auth.userId)))
		.limit(1)

	if (!link) {
		logger.warn('Link stats requested for non-existent link', { linkId: id, userId: auth.userId })
		return c.json({ error: 'Link not found' }, 404)
	}

	const [totalClicks] = await db.select({ count: count() }).from(clicks).where(eq(clicks.linkId, id))

	const recentClicks = await db
		.select({
			id: clicks.id,
			clickedAt: clicks.clickedAt,
			ip: clicks.ip,
			userAgent: clicks.userAgent,
			referer: clicks.referer,
		})
		.from(clicks)
		.where(eq(clicks.linkId, id))
		.orderBy(desc(clicks.clickedAt))
		.limit(100)

	const clicksByDate = await db
		.select({
			date: sql<string>`DATE(${clicks.clickedAt})`,
			count: count(),
		})
		.from(clicks)
		.where(eq(clicks.linkId, id))
		.groupBy(sql`DATE(${clicks.clickedAt})`)
		.orderBy(desc(sql`DATE(${clicks.clickedAt})`))
		.limit(30)

	const topReferers = await db
		.select({
			referer: clicks.referer,
			count: count(),
		})
		.from(clicks)
		.where(and(eq(clicks.linkId, id), sql`${clicks.referer} IS NOT NULL`))
		.groupBy(clicks.referer)
		.orderBy(desc(count()))
		.limit(10)

	logger.info('Link stats retrieved', {
		linkId: link.id,
		userId: auth.userId,
		shortCode: link.shortCode,
		totalClicks: totalClicks.count,
	})

	return c.json({
		link: {
			id: link.id,
			originalUrl: link.originalUrl,
			shortCode: link.shortCode,
			title: link.title,
			createdAt: link.createdAt.toISOString(),
		},
		totalClicks: totalClicks.count,
		recentClicks: recentClicks.map((click) => ({
			id: click.id,
			clickedAt: click.clickedAt.toISOString(),
			ip: click.ip,
			userAgent: click.userAgent,
			referer: click.referer,
		})),
		clicksByDate,
		topReferers,
	})
})

// @ts-expect-error - OpenAPI type inference issue
analyticsRouter.openapi(overviewRoute, async (c) => {
	const auth = c.get('auth')

	const [totalLinks] = await db.select({ count: count() }).from(links).where(eq(links.userId, auth.userId))

	const userLinks = await db.select({ id: links.id }).from(links).where(eq(links.userId, auth.userId))

	const linkIds = userLinks.map((link) => link.id)

	const [totalClicks] =
		linkIds.length > 0
			? await db.select({ count: count() }).from(clicks).where(sql`${clicks.linkId} IN ${linkIds}`)
			: [{ count: 0 }]

	const topLinks =
		linkIds.length > 0
			? await db
					.select({
						linkId: clicks.linkId,
						originalUrl: links.originalUrl,
						shortCode: links.shortCode,
						title: links.title,
						clickCount: count(),
					})
					.from(clicks)
					.innerJoin(links, eq(clicks.linkId, links.id))
					.where(and(sql`${clicks.linkId} IN ${linkIds}`, eq(links.userId, auth.userId)))
					.groupBy(clicks.linkId, links.originalUrl, links.shortCode, links.title)
					.orderBy(desc(count()))
					.limit(10)
			: []

	logger.info('Analytics overview retrieved', {
		userId: auth.userId,
		totalLinks: totalLinks.count,
		totalClicks: totalClicks.count,
	})

	return c.json({
		totalLinks: totalLinks.count,
		totalClicks: totalClicks.count,
		topLinks,
	})
})

export { analyticsRouter }
