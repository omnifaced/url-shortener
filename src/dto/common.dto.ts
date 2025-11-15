import { z } from 'zod'

export const errorResponseSchema = z.object({
	error: z.string(),
})

export const messageResponseSchema = z.object({
	message: z.string(),
})
