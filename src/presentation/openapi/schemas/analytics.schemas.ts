import {
	clicksByDateQuerySchema,
	clicksByDateResponseSchema,
	errorResponseSchema,
	linkClicksQuerySchema,
	linkClicksResponseSchema,
	linkIdParamSchema,
	linkStatsResponseSchema,
	listAnalyticsLinksQuerySchema,
	listAnalyticsLinksResponseSchema,
} from '../../../application'

import { createRoute } from '@hono/zod-openapi'
import { HTTP_STATUS } from '../../../shared'

export const listAnalyticsLinksRoute = createRoute({
	method: 'get',
	path: '/links',
	tags: ['Analytics'],
	security: [{ Bearer: [] }],
	request: {
		query: listAnalyticsLinksQuerySchema,
	},
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'application/json': {
					schema: listAnalyticsLinksResponseSchema,
				},
			},
			description: 'List of links with analytics',
		},
		[HTTP_STATUS.UNAUTHORIZED]: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Unauthorized',
		},
		[HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Internal server error',
		},
	},
})

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
					schema: errorResponseSchema,
				},
			},
			description: 'Unauthorized',
		},
		[HTTP_STATUS.NOT_FOUND]: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Link not found',
		},
		[HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Internal server error',
		},
	},
})

export const linkClicksRoute = createRoute({
	method: 'get',
	path: '/links/{id}/clicks',
	tags: ['Analytics'],
	security: [{ Bearer: [] }],
	request: {
		params: linkIdParamSchema,
		query: linkClicksQuerySchema,
	},
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'application/json': {
					schema: linkClicksResponseSchema,
				},
			},
			description: 'Link clicks details',
		},
		[HTTP_STATUS.UNAUTHORIZED]: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Unauthorized',
		},
		[HTTP_STATUS.NOT_FOUND]: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Link not found',
		},
		[HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Internal server error',
		},
	},
})

export const clicksByDateRoute = createRoute({
	method: 'get',
	path: '/links/{id}/clicks-by-date',
	tags: ['Analytics'],
	security: [{ Bearer: [] }],
	request: {
		params: linkIdParamSchema,
		query: clicksByDateQuerySchema,
	},
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'application/json': {
					schema: clicksByDateResponseSchema,
				},
			},
			description: 'Clicks aggregated by date',
		},
		[HTTP_STATUS.UNAUTHORIZED]: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Unauthorized',
		},
		[HTTP_STATUS.NOT_FOUND]: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Link not found',
		},
		[HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Internal server error',
		},
	},
})
