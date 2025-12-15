import { z } from '@hono/zod-openapi'

const errorDetailsSchema = z.object({
	message: z.string().optional(),
	traceId: z.string().optional(),
	issues: z.array(z.any()).optional(),
})

export const errorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: errorDetailsSchema.optional(),
	}),
})

export const messageResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		message: z.string(),
	}),
})

export const paginationSchema = z.object({
	page: z.number().openapi({ example: 1 }),
	limit: z.number().openapi({ example: 10 }),
	total: z.number().openapi({ example: 100 }),
	totalPages: z.number().openapi({ example: 10 }),
})

export type PaginationDto = z.infer<typeof paginationSchema>
