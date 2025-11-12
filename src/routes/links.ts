import { createLinkSchema, listLinksQuerySchema, linkIdParamSchema } from '../validators'
import { authMiddleware, responseMiddleware } from '../middleware'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { validationErrorWrapperHook } from '../hooks'
import { generateShortCode, logger } from '../lib'
import { eq, and, desc, count } from 'drizzle-orm'
import type { Variables } from '../types'
import { links } from '../db/schema'
import { db } from '../db'

const linkResponseSchema = z.object({
	id: z.number().openapi({ example: 1 }),
	originalUrl: z.string().openapi({ example: 'https://example.com/very/long/url' }),
	shortCode: z.string().openapi({ example: 'abc123' }),
	title: z.string().nullable().openapi({ example: 'My Example Link' }),
	isActive: z.boolean().openapi({ example: true }),
	createdAt: z.string().openapi({ example: '2025-01-01T00:00:00Z' }),
	expiresAt: z.string().nullable().openapi({ example: '2025-12-31T23:59:59Z' }),
})

const errorResponseSchema = z.object({
	error: z.string(),
})

const messageResponseSchema = z.object({
	message: z.string(),
})

const listLinksResponseSchema = z.object({
	links: z.array(linkResponseSchema),
	pagination: z.object({
		page: z.number().openapi({ example: 1 }),
		limit: z.number().openapi({ example: 10 }),
		total: z.number().openapi({ example: 100 }),
		totalPages: z.number().openapi({ example: 10 }),
	}),
})

const createLinkRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Links'],
	security: [{ Bearer: [] }],
	request: {
		body: {
			content: {
				'application/json': {
					schema: createLinkSchema.openapi('CreateLinkRequest'),
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				'application/json': {
					schema: linkResponseSchema,
				},
			},
			description: 'Link created successfully',
		},
		401: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Unauthorized',
		},
		500: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Failed to generate unique short code',
		},
	},
})

const listLinksRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Links'],
	security: [{ Bearer: [] }],
	request: {
		query: listLinksQuerySchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: listLinksResponseSchema,
				},
			},
			description: 'List of links',
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

const getLinkRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Links'],
	security: [{ Bearer: [] }],
	request: {
		params: linkIdParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: linkResponseSchema,
				},
			},
			description: 'Link details',
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

const deleteLinkRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Links'],
	security: [{ Bearer: [] }],
	request: {
		params: linkIdParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: messageResponseSchema,
				},
			},
			description: 'Link deleted successfully',
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

const linksRouter = new OpenAPIHono<{ Variables: Variables }>({
	defaultHook: validationErrorWrapperHook,
})

linksRouter.use('*', responseMiddleware)
linksRouter.use('*', authMiddleware)

linksRouter.openapi(createLinkRoute, async (c) => {
	const { originalUrl, title, expiresAt } = c.req.valid('json')
	const auth = c.get('auth')

	let shortCode = generateShortCode()
	let attempts = 0
	const maxAttempts = 10

	while (attempts < maxAttempts) {
		const existing = await db.select().from(links).where(eq(links.shortCode, shortCode)).limit(1)

		if (existing.length === 0) {
			break
		}

		shortCode = generateShortCode()
		attempts++
	}

	if (attempts === maxAttempts) {
		logger.error('Failed to generate unique short code', { userId: auth.userId, attempts })
		return c.json({ error: 'Failed to generate unique short code' }, 500)
	}

	const [newLink] = await db
		.insert(links)
		.values({
			userId: auth.userId,
			originalUrl,
			shortCode,
			title: title || null,
			expiresAt: expiresAt ? new Date(expiresAt) : null,
		})
		.returning()

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

// @ts-expect-error - OpenAPI type inference issue
linksRouter.openapi(listLinksRoute, async (c) => {
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

	return c.json({
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
	})
})

// @ts-expect-error - OpenAPI type inference issue
linksRouter.openapi(getLinkRoute, async (c) => {
	const { id } = c.req.valid('param')
	const auth = c.get('auth')

	const [link] = await db
		.select()
		.from(links)
		.where(and(eq(links.id, id), eq(links.userId, auth.userId)))
		.limit(1)

	if (!link) {
		logger.warn('Link get requested for non-existent link', { linkId: id, userId: auth.userId })
		return c.json({ error: 'Link not found' }, 404)
	}

	logger.info('Link details retrieved', { linkId: link.id, userId: auth.userId, shortCode: link.shortCode })

	return c.json({
		id: link.id,
		originalUrl: link.originalUrl,
		shortCode: link.shortCode,
		title: link.title,
		isActive: link.isActive,
		createdAt: link.createdAt.toISOString(),
		expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
	})
})

// @ts-expect-error - OpenAPI type inference issue
linksRouter.openapi(deleteLinkRoute, async (c) => {
	const { id } = c.req.valid('param')
	const auth = c.get('auth')

	const deleted = await db
		.delete(links)
		.where(and(eq(links.id, id), eq(links.userId, auth.userId)))
		.returning()

	if (deleted.length === 0) {
		logger.warn('Link delete requested for non-existent link', { linkId: id, userId: auth.userId })
		return c.json({ error: 'Link not found' }, 404)
	}

	logger.success('Link deleted', { linkId: deleted[0].id, userId: auth.userId, shortCode: deleted[0].shortCode })

	return c.json({ message: 'Link deleted successfully' })
})

export { linksRouter }
