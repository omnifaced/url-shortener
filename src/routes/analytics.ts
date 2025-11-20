import type { RouteConfigToTypedResponse } from '@hono/zod-openapi'
import { authMiddleware, responseMiddleware } from '../middleware'
import { linkStatsRoute, overviewRoute } from '../openapi'
import { eq, and, count, desc, sql } from 'drizzle-orm'
import { validationErrorWrapperHook } from '../hooks'
import { HTTPException } from 'hono/http-exception'
import { OpenAPIHono } from '@hono/zod-openapi'
import { links, clicks } from '../db/schema'
import { db } from '../db'

const analyticsRouter = new OpenAPIHono({
	defaultHook: validationErrorWrapperHook,
})

analyticsRouter.use('*', responseMiddleware)
analyticsRouter.use('*', authMiddleware)

analyticsRouter.openapi(linkStatsRoute, async (c): Promise<RouteConfigToTypedResponse<typeof linkStatsRoute>> => {
	const { id } = c.req.valid('param')
	const auth = c.get('auth')

	const [link] = await db
		.select()
		.from(links)
		.where(and(eq(links.id, id), eq(links.userId, auth.userId)))
		.limit(1)

	if (!link) {
		throw new HTTPException(404, { message: 'Link not found' })
	}

	const [totalClicks] = await db.select({ count: count() }).from(clicks).where(eq(clicks.linkId, id))

	const recentClicks = await db
		.select({
			id: clicks.id,
			clickedAt: clicks.clickedAt,
			ip: clicks.ip,
			userAgent: clicks.userAgent,
			referer: clicks.referer,
			deviceInfo: clicks.deviceInfo,
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

	return c.json(
		{
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
				deviceInfo: click.deviceInfo,
			})),
			clicksByDate,
			topReferers,
		},
		200
	)
})

analyticsRouter.openapi(overviewRoute, async (c): Promise<RouteConfigToTypedResponse<typeof overviewRoute>> => {
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

	return c.json(
		{
			totalLinks: totalLinks.count,
			totalClicks: totalClicks.count,
			topLinks,
		},
		200
	)
})

export { analyticsRouter }
