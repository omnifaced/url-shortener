import { errorResponseSchema, shortCodeParamSchema } from '../../dto'
import { createRoute } from '@hono/zod-openapi'

export const redirectRoute = createRoute({
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
