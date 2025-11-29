import {
	clientErrorResponseSchema,
	createLinkSchema,
	linkIdParamSchema,
	linkResponseSchema,
	listLinksQuerySchema,
	listLinksResponseSchema,
	messageResponseSchema,
	qrQuerySchema,
	serverErrorResponseSchema,
	updateLinkSchema,
} from '../../../application'

import { createRoute } from '@hono/zod-openapi'
import { HTTP_STATUS } from '../../../shared'

export const createLinkRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Links'],
	security: [{ Bearer: [] }],
	request: {
		body: {
			content: {
				'application/json': {
					schema: createLinkSchema,
				},
			},
		},
	},
	responses: {
		[HTTP_STATUS.CREATED]: {
			content: {
				'application/json': {
					schema: linkResponseSchema,
				},
			},
			description: 'Link created successfully',
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
			description: 'Failed to generate unique short code',
		},
	},
})

export const listLinksRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Links'],
	security: [{ Bearer: [] }],
	request: {
		query: listLinksQuerySchema,
	},
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'application/json': {
					schema: listLinksResponseSchema,
				},
			},
			description: 'List of links',
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

export const getLinkRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Links'],
	security: [{ Bearer: [] }],
	request: {
		params: linkIdParamSchema,
	},
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'application/json': {
					schema: linkResponseSchema,
				},
			},
			description: 'Link details',
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

export const updateLinkRoute = createRoute({
	method: 'patch',
	path: '/{id}',
	tags: ['Links'],
	security: [{ Bearer: [] }],
	request: {
		params: linkIdParamSchema,
		body: {
			content: {
				'application/json': {
					schema: updateLinkSchema,
				},
			},
		},
	},
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'application/json': {
					schema: linkResponseSchema,
				},
			},
			description: 'Link updated successfully',
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

export const deleteLinkRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Links'],
	security: [{ Bearer: [] }],
	request: {
		params: linkIdParamSchema,
	},
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'application/json': {
					schema: messageResponseSchema,
				},
			},
			description: 'Link deleted successfully',
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

export const getQrCodeRoute = createRoute({
	method: 'get',
	path: '/{id}/qr',
	tags: ['Links'],
	security: [{ Bearer: [] }],
	request: {
		params: linkIdParamSchema,
		query: qrQuerySchema,
	},
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'image/svg+xml': {
					schema: {
						type: 'string',
						format: 'binary',
					},
				},
				'image/png': {
					schema: {
						type: 'string',
						format: 'binary',
					},
				},
			},
			description: 'QR code for the link',
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
