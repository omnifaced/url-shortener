import { z } from '@hono/zod-openapi'

export const errorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		message: z.string(),
		details: z.object({
			message: z.string(),
			traceId: z.string().optional(),
		}),
	}),
})

export const messageResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		message: z.string(),
	}),
})
