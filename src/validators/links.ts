import { z } from 'zod'

export const createLinkSchema = z.object({
	originalUrl: z.url(),
	title: z.string().max(255).optional(),
	expiresAt: z
		.string()
		.pipe(z.coerce.date())
		.refine((date) => date > new Date(), { message: 'Expiration date must be in the future' })
		.optional(),
})

export const listLinksQuerySchema = z.object({
	page: z.string().optional().default('1').transform(Number).openapi({ example: '1' }),
	limit: z.string().optional().default('10').transform(Number).openapi({ example: '10' }),
})

export const linkIdParamSchema = z.object({
	id: z
		.string()
		.transform(Number)
		.openapi({ param: { name: 'id', in: 'path' }, example: '1' }),
})

export const shortCodeParamSchema = z.object({
	shortCode: z
		.string()
		.min(1)
		.max(10)
		.openapi({ param: { name: 'shortCode', in: 'path' }, example: 'abc123' }),
})
