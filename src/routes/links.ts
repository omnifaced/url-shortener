import { createLinkRoute, deleteLinkRoute, getLinkRoute, getQrCodeRoute, listLinksRoute } from '../openapi'
import type { RouteConfigToTypedResponse } from '@hono/zod-openapi'
import { authMiddleware, responseMiddleware } from '../middleware'
import { generateShortCode, generateQrCode, logger } from '../lib'
import { validationErrorWrapperHook } from '../hooks'
import { HTTPException } from 'hono/http-exception'
import { eq, and, desc, count } from 'drizzle-orm'
import { OpenAPIHono } from '@hono/zod-openapi'
import type { Variables } from '../types'
import { links } from '../db/schema'
import { db } from '../db'

const linksRouter = new OpenAPIHono<{ Variables: Variables }>({
	defaultHook: validationErrorWrapperHook,
})

linksRouter.use('*', responseMiddleware)
linksRouter.use('*', authMiddleware)

linksRouter.openapi(createLinkRoute, async (c) => {
	const { originalUrl, title, expiresAt } = c.req.valid('json')
	const auth = c.get('auth')

	const newLink = await db.transaction(async (tx) => {
		let shortCode = generateShortCode()
		let attempts = 0
		const maxAttempts = 10

		while (attempts < maxAttempts) {
			const existing = await tx.select().from(links).where(eq(links.shortCode, shortCode)).limit(1)

			if (existing.length === 0) {
				break
			}

			shortCode = generateShortCode()
			attempts++
		}

		if (attempts === maxAttempts) {
			logger.error('Failed to generate unique short code', { userId: auth.userId, attempts })
			throw new HTTPException(500, { message: 'Failed to generate unique short code' })
		}

		const [link] = await tx
			.insert(links)
			.values({
				userId: auth.userId,
				originalUrl,
				shortCode,
				title: title || null,
				expiresAt: expiresAt ? new Date(expiresAt) : null,
			})
			.returning()

		return link
	})

	logger.success('Link created', {
		linkId: newLink.id,
		userId: auth.userId,
		shortCode: newLink.shortCode,
		originalUrl: newLink.originalUrl,
	})

	return c.json(
		{
			id: newLink.id,
			originalUrl: newLink.originalUrl,
			shortCode: newLink.shortCode,
			title: newLink.title,
			isActive: newLink.isActive,
			createdAt: newLink.createdAt.toISOString(),
			expiresAt: newLink.expiresAt ? newLink.expiresAt.toISOString() : null,
		},
		201
	)
})

linksRouter.openapi(listLinksRoute, async (c): Promise<RouteConfigToTypedResponse<typeof listLinksRoute>> => {
	const { page, limit } = c.req.valid('query')
	const auth = c.get('auth')

	const offset = (page - 1) * limit

	const [userLinks, [totalCount]] = await Promise.all([
		db
			.select()
			.from(links)
			.where(eq(links.userId, auth.userId))
			.orderBy(desc(links.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ count: count() }).from(links).where(eq(links.userId, auth.userId)),
	])

	logger.info('Links list retrieved', { userId: auth.userId, page, limit, total: totalCount.count })

	return c.json(
		{
			links: userLinks.map((link) => ({
				id: link.id,
				originalUrl: link.originalUrl,
				shortCode: link.shortCode,
				title: link.title,
				isActive: link.isActive,
				createdAt: link.createdAt.toISOString(),
				expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
			})),
			pagination: {
				page,
				limit,
				total: totalCount.count,
				totalPages: Math.ceil(totalCount.count / limit),
			},
		},
		200
	)
})

linksRouter.openapi(getLinkRoute, async (c): Promise<RouteConfigToTypedResponse<typeof getLinkRoute>> => {
	const { id } = c.req.valid('param')
	const auth = c.get('auth')

	const [link] = await db
		.select()
		.from(links)
		.where(and(eq(links.id, id), eq(links.userId, auth.userId)))
		.limit(1)

	if (!link) {
		logger.warn('Link get requested for non-existent link', { linkId: id, userId: auth.userId })
		throw new HTTPException(404, { message: 'Link not found' })
	}

	logger.info('Link details retrieved', { linkId: link.id, userId: auth.userId, shortCode: link.shortCode })

	return c.json(
		{
			id: link.id,
			originalUrl: link.originalUrl,
			shortCode: link.shortCode,
			title: link.title,
			isActive: link.isActive,
			createdAt: link.createdAt.toISOString(),
			expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
		},
		200
	)
})

linksRouter.openapi(deleteLinkRoute, async (c): Promise<RouteConfigToTypedResponse<typeof deleteLinkRoute>> => {
	const { id } = c.req.valid('param')
	const auth = c.get('auth')

	const deleted = await db
		.delete(links)
		.where(and(eq(links.id, id), eq(links.userId, auth.userId)))
		.returning()

	if (deleted.length === 0) {
		logger.warn('Link delete requested for non-existent link', { linkId: id, userId: auth.userId })
		throw new HTTPException(404, { message: 'Link not found' })
	}

	logger.success('Link deleted', { linkId: deleted[0].id, userId: auth.userId, shortCode: deleted[0].shortCode })

	return c.json({ message: 'Link deleted successfully' }, 200)
})

linksRouter.openapi(getQrCodeRoute, async (c) => {
	const { id } = c.req.valid('param')
	const { format, size, ecc } = c.req.valid('query')
	const auth = c.get('auth')

	const [link] = await db
		.select()
		.from(links)
		.where(and(eq(links.id, id), eq(links.userId, auth.userId)))
		.limit(1)

	if (!link) {
		logger.warn('QR code requested for non-existent link', { linkId: id, userId: auth.userId })
		throw new HTTPException(404, { message: 'Link not found' })
	}

	const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
	const shortUrl = `${baseUrl}/${link.shortCode}`

	const { data, contentType } = generateQrCode(shortUrl, { format, size, ecc })

	logger.info('QR code generated', { linkId: id, userId: auth.userId, format, size })

	return c.body(data, 200, {
		'Content-Type': contentType,
		'Cache-Control': 'public, max-age=3600',
	})
})

export { linksRouter }
