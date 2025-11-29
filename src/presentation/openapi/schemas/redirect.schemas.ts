import { clientErrorResponseSchema, serverErrorResponseSchema } from '../../../application'
import { createRoute } from '@hono/zod-openapi'
import { HTTP_STATUS } from '../../../shared'
import { z } from 'zod'

export const shortCodeParamSchema = z.object({
	shortCode: z.string(),
})

export const redirectRoute = createRoute({
	method: 'get',
	path: '/{shortCode}',
	tags: ['Redirect'],
	request: {
		params: shortCodeParamSchema,
	},
	responses: {
		[HTTP_STATUS.MOVED_PERMANENTLY]: {
			description: 'Redirect to original URL',
		},
		[HTTP_STATUS.FOUND]: {
			description: 'Redirect to original URL',
		},
		[HTTP_STATUS.NOT_FOUND]: {
			content: {
				'application/json': {
					schema: clientErrorResponseSchema,
				},
			},
			description: 'Short code not found',
		},
		[HTTP_STATUS.GONE]: {
			content: {
				'application/json': {
					schema: clientErrorResponseSchema,
				},
			},
			description: 'Link expired or inactive',
		},
		[HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
			content: {
				'application/json': {
					schema: serverErrorResponseSchema,
				},
			},
			description: 'Internal server error',
		},
	},
})
