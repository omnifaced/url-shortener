import { errorResponseSchema, linkIdParamSchema, linkStatsResponseSchema, overviewResponseSchema } from '../../dto'
import { createRoute } from '@hono/zod-openapi'

export const linkStatsRoute = createRoute({
	method: 'get',
	path: '/links/{id}/stats',
	tags: ['Analytics'],
	security: [{ Bearer: [] }],
	request: {
		params: linkIdParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: linkStatsResponseSchema,
				},
			},
			description: 'Link statistics',
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

export const overviewRoute = createRoute({
	method: 'get',
	path: '/overview',
	tags: ['Analytics'],
	security: [{ Bearer: [] }],
	responses: {
		200: {
			content: {
				'application/json': {
					schema: overviewResponseSchema,
				},
			},
			description: 'Analytics overview',
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
