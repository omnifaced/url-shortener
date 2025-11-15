import {
	createLinkSchema,
	errorResponseSchema,
	linkIdParamSchema,
	linkResponseSchema,
	listLinksQuerySchema,
	listLinksResponseSchema,
	messageResponseSchema,
	qrQuerySchema,
} from '../../dto'

import { createRoute } from '@hono/zod-openapi'

export const createLinkRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Links'],
	security: [{ Bearer: [] }],
	request: {
		body: {
			content: {
				'application/json': {
					schema: createLinkSchema.openapi('CreateLinkRequest'),
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				'application/json': {
					schema: linkResponseSchema,
				},
			},
			description: 'Link created successfully',
		},
		401: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Unauthorized',
		},
		500: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
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
		200: {
			content: {
				'application/json': {
					schema: listLinksResponseSchema,
				},
			},
			description: 'List of links',
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

export const getLinkRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Links'],
	security: [{ Bearer: [] }],
	request: {
		params: linkIdParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: linkResponseSchema,
				},
			},
			description: 'Link details',
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

export const deleteLinkRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Links'],
	security: [{ Bearer: [] }],
	request: {
		params: linkIdParamSchema,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: messageResponseSchema,
				},
			},
			description: 'Link deleted successfully',
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
		200: {
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
