import {
	clientErrorResponseSchema,
	linkIdParamSchema,
	linkStatsResponseSchema,
	overviewResponseSchema,
	serverErrorResponseSchema,
} from '../../../application'

import { createRoute } from '@hono/zod-openapi'
import { HTTP_STATUS } from '../../../shared'

export const linkStatsRoute = createRoute({
	method: 'get',
	path: '/links/{id}/stats',
	tags: ['Analytics'],
	security: [{ Bearer: [] }],
	request: {
		params: linkIdParamSchema,
	},
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'application/json': {
					schema: linkStatsResponseSchema,
				},
			},
			description: 'Link statistics',
		},
		[HTTP_STATUS.UNAUTHORIZED]: {
			content: {
				'application/json': {
					schema: clientErrorResponseSchema,
				},
			},
			description: 'Unauthorized',
		},
		[HTTP_STATUS.NOT_FOUND]: {
			content: {
				'application/json': {
					schema: clientErrorResponseSchema,
				},
			},
			description: 'Link not found',
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

export const overviewRoute = createRoute({
	method: 'get',
	path: '/overview',
	tags: ['Analytics'],
	security: [{ Bearer: [] }],
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'application/json': {
					schema: overviewResponseSchema,
				},
			},
			description: 'Analytics overview',
		},
		[HTTP_STATUS.UNAUTHORIZED]: {
			content: {
				'application/json': {
					schema: clientErrorResponseSchema,
				},
			},
			description: 'Unauthorized',
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
