import { z } from '@hono/zod-openapi'

export const createLinkSchema = z.object({
	originalUrl: z.url(),
	title: z.string().max(255).optional(),
	expiresAt: z
		.string()
		.pipe(z.coerce.date())
		.refine((date) => date > new Date(), {
			message: 'Expiration date must be in the future',
		})
		.optional(),
})

export const updateLinkSchema = z.object({
	title: z.string().max(255).optional().nullable(),
	isActive: z.boolean().optional(),
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

export const qrQuerySchema = z.object({
	format: z.enum(['svg', 'png']).optional().default('svg').openapi({ example: 'png' }),
	size: z.string().optional().default('200').transform(Number).openapi({ example: '512' }),
	ecc: z.enum(['low', 'medium', 'quartile', 'high']).optional().default('medium').openapi({ example: 'medium' }),
})

const linkDataSchema = z.object({
	id: z.number().openapi({ example: 1 }),
	originalUrl: z.string().openapi({ example: 'https://example.com/very/long/url' }),
	shortCode: z.string().openapi({ example: 'abc123' }),
	title: z.string().nullable().openapi({ example: 'My Example Link' }),
	isActive: z.boolean().openapi({ example: true }),
	createdAt: z.string().openapi({ example: '2025-01-01T00:00:00Z' }),
	expiresAt: z.string().nullable().openapi({ example: '2025-12-31T23:59:59Z' }),
})

export const linkResponseSchema = z.object({
	success: z.literal(true),
	data: linkDataSchema,
})

export const listLinksResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		links: z.array(linkDataSchema),
		pagination: z.object({
			page: z.number().openapi({ example: 1 }),
			limit: z.number().openapi({ example: 10 }),
			total: z.number().openapi({ example: 100 }),
			totalPages: z.number().openapi({ example: 10 }),
		}),
	}),
})

export type CreateLinkDto = z.infer<typeof createLinkSchema>
export type UpdateLinkDto = z.infer<typeof updateLinkSchema>
export type ListLinksQueryDto = z.infer<typeof listLinksQuerySchema>

export type LinkResponseDto = z.infer<typeof linkDataSchema>

export interface ListLinksResponseDto {
	links: LinkResponseDto[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
}
