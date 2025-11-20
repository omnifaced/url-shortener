import { getLinkFromCache, setLinkToCache, deleteLinkFromCache, parseUserAgent, logger } from '../lib'
import { validationErrorWrapperHook } from '../hooks'
import { HTTPException } from 'hono/http-exception'
import { responseMiddleware } from '../middleware'
import { OpenAPIHono } from '@hono/zod-openapi'
import { links, clicks } from '../db/schema'
import { redirectRoute } from '../openapi'
import { eq } from 'drizzle-orm'
import { db } from '../db'

const redirectRouter = new OpenAPIHono({
	defaultHook: validationErrorWrapperHook,
})

redirectRouter.use('*', responseMiddleware)

redirectRouter.openapi(redirectRoute, async (c) => {
	const { shortCode } = c.req.valid('param')

	const linkData = getLinkFromCache(shortCode)

	if (linkData) {
		if (!linkData.isActive) {
			throw new HTTPException(410, { message: 'Link is inactive' })
		}

		if (linkData.expiresAt && new Date(linkData.expiresAt) < new Date()) {
			deleteLinkFromCache(shortCode)
			throw new HTTPException(410, { message: 'Link has expired' })
		}

		const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null
		const userAgent = c.req.header('user-agent') || null
		const referer = c.req.header('referer') || null
		const deviceInfo = parseUserAgent(userAgent)

		db.insert(clicks)
			.values({
				linkId: linkData.id,
				ip,
				userAgent,
				referer,
				deviceInfo,
			})
			.catch((err) => {
				console.error('Failed to insert click (cached):', err)
			})

		return c.redirect(linkData.originalUrl, 301)
	}

	const [link] = await db.select().from(links).where(eq(links.shortCode, shortCode)).limit(1)

	if (!link) {
		throw new HTTPException(404, { message: 'Link not found' })
	}

	if (!link.isActive) {
		throw new HTTPException(410, { message: 'Link is inactive' })
	}

	if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
		throw new HTTPException(410, { message: 'Link has expired' })
	}

	setLinkToCache(shortCode, {
		id: link.id,
		originalUrl: link.originalUrl,
		isActive: link.isActive,
		expiresAt: link.expiresAt,
	})

	const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null
	const userAgent = c.req.header('user-agent') || null
	const referer = c.req.header('referer') || null
	const deviceInfo = parseUserAgent(userAgent)

	db.insert(clicks)
		.values({
			linkId: link.id,
			ip,
			userAgent,
			referer,
			deviceInfo,
		})
		.catch((error) => {
			logger.error('Failed to insert click (cached):', error)
		})

	return c.redirect(link.originalUrl, 301)
})

export { redirectRouter }
