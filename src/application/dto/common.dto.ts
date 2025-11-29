import { z } from '@hono/zod-openapi'

export const clientErrorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		message: z.string(),
		details: z.object({
			message: z.string(),
		}),
	}),
})

export const serverErrorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		message: z.string(),
		details: z.object({
			message: z.string(),
			traceId: z.string(),
		}),
	}),
})

export const messageResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		message: z.string(),
	}),
})
