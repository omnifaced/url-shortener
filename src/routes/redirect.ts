import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { validationErrorWrapperHook } from '../hooks'
import { shortCodeParamSchema } from '../validators'
import { responseMiddleware } from '../middleware'
import { links, clicks } from '../db/schema'
import { redis, logger } from '../lib'
import { eq } from 'drizzle-orm'
import { db } from '../db'

const errorResponseSchema = z.object({
	error: z.string(),
})

const redirectRoute = createRoute({
	method: 'get',
	path: '/{shortCode}',
	tags: ['Redirect'],
	request: {
		params: shortCodeParamSchema,
	},
	responses: {
		301: {
			description: 'Redirect to original URL',
		},
		404: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Link not found',
		},
		410: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Link is inactive or expired',
		},
	},
})

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
			return c.json({ error: 'Link is inactive' }, 410)
		}

		if (linkData.expiresAt && new Date(linkData.expiresAt) < new Date()) {
			await redis.del(cacheKey)
			logger.warn('Redirect attempt to expired link', { shortCode, linkId: linkData.id })
			return c.json({ error: 'Link has expired' }, 410)
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
		return c.json({ error: 'Link not found' }, 404)
	}

	if (!link.isActive) {
		logger.warn('Redirect attempt to inactive link', { shortCode, linkId: link.id })
		return c.json({ error: 'Link is inactive' }, 410)
	}

	if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
		logger.warn('Redirect attempt to expired link', { shortCode, linkId: link.id })
		return c.json({ error: 'Link has expired' }, 410)
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
