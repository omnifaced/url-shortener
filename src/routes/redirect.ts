import { validationErrorWrapperHook } from '../hooks'
import { HTTPException } from 'hono/http-exception'
import { responseMiddleware } from '../middleware'
import { OpenAPIHono } from '@hono/zod-openapi'
import { links, clicks } from '../db/schema'
import { redirectRoute } from '../openapi'
import { redis, logger } from '../lib'
import { eq } from 'drizzle-orm'
import { db } from '../db'

const redirectRouter = new OpenAPIHono({
	defaultHook: validationErrorWrapperHook,
})

redirectRouter.use('*', responseMiddleware)

redirectRouter.openapi(redirectRoute, async (c) => {
	const { shortCode } = c.req.valid('param')
	const cacheKey = `link:${shortCode}`

	const cached = await redis.get(cacheKey)

	if (cached) {
		const linkData = JSON.parse(cached)

		if (!linkData.isActive) {
			logger.warn('Redirect attempt to inactive link', { shortCode, linkId: linkData.id })
			throw new HTTPException(410, { message: 'Link is inactive' })
		}

		if (linkData.expiresAt && new Date(linkData.expiresAt) < new Date()) {
			await redis.del(cacheKey)
			logger.warn('Redirect attempt to expired link', { shortCode, linkId: linkData.id })
			throw new HTTPException(410, { message: 'Link has expired' })
		}

		const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null
		const userAgent = c.req.header('user-agent') || null
		const referer = c.req.header('referer') || null

		await db.insert(clicks).values({
			linkId: linkData.id,
			ip,
			userAgent,
			referer,
		})

		logger.info('Redirect from cache', { shortCode, linkId: linkData.id, ip })

		return c.redirect(linkData.originalUrl, 301)
	}

	const [link] = await db.select().from(links).where(eq(links.shortCode, shortCode)).limit(1)

	if (!link) {
		logger.warn('Redirect attempt to non-existent link', { shortCode })
		throw new HTTPException(404, { message: 'Link not found' })
	}

	if (!link.isActive) {
		logger.warn('Redirect attempt to inactive link', { shortCode, linkId: link.id })
		throw new HTTPException(410, { message: 'Link is inactive' })
	}

	if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
		logger.warn('Redirect attempt to expired link', { shortCode, linkId: link.id })
		throw new HTTPException(410, { message: 'Link has expired' })
	}

	await redis.setex(
		cacheKey,
		300,
		JSON.stringify({
			id: link.id,
			originalUrl: link.originalUrl,
			isActive: link.isActive,
			expiresAt: link.expiresAt,
		})
	)

	const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null
	const userAgent = c.req.header('user-agent') || null
	const referer = c.req.header('referer') || null

	await db.insert(clicks).values({
		linkId: link.id,
		ip,
		userAgent,
		referer,
	})

	logger.info('Redirect from database', { shortCode, linkId: link.id, ip })

	return c.redirect(link.originalUrl, 301)
})

export { redirectRouter }
