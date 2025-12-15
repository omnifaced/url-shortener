import {
	authResponseSchema,
	errorResponseSchema,
	loginSchema,
	messageResponseSchema,
	refreshResponseSchema,
	refreshSchema,
	registerSchema,
} from '../../../application'

import { createRoute } from '@hono/zod-openapi'
import { HTTP_STATUS } from '../../../shared'

export const registerRoute = createRoute({
	method: 'post',
	path: '/register',
	tags: ['Authentication'],
	request: {
		body: {
			content: {
				'application/json': {
					schema: registerSchema,
				},
			},
		},
	},
	responses: {
		[HTTP_STATUS.CREATED]: {
			content: {
				'application/json': {
					schema: authResponseSchema,
				},
			},
			description: 'User registered successfully',
		},
		[HTTP_STATUS.BAD_REQUEST]: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Bad request - username already exists',
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

export const loginRoute = createRoute({
	method: 'post',
	path: '/login',
	tags: ['Authentication'],
	request: {
		body: {
			content: {
				'application/json': {
					schema: loginSchema,
				},
			},
		},
	},
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'application/json': {
					schema: authResponseSchema,
				},
			},
			description: 'Login successful',
		},
		[HTTP_STATUS.UNAUTHORIZED]: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Invalid credentials',
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

export const refreshRoute = createRoute({
	method: 'post',
	path: '/refresh',
	tags: ['Authentication'],
	request: {
		body: {
			content: {
				'application/json': {
					schema: refreshSchema,
				},
			},
		},
	},
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'application/json': {
					schema: refreshResponseSchema,
				},
			},
			description: 'Token refreshed successfully',
		},
		[HTTP_STATUS.UNAUTHORIZED]: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Invalid or expired refresh token',
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

export const logoutRoute = createRoute({
	method: 'post',
	path: '/logout',
	tags: ['Authentication'],
	security: [{ Bearer: [] }],
	request: {
		body: {
			content: {
				'application/json': {
					schema: refreshSchema,
				},
			},
		},
	},
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'application/json': {
					schema: messageResponseSchema,
				},
			},
			description: 'Logged out successfully',
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

export const logoutAllRoute = createRoute({
	method: 'post',
	path: '/logout-all',
	tags: ['Authentication'],
	security: [{ Bearer: [] }],
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'application/json': {
					schema: messageResponseSchema,
				},
			},
			description: 'All sessions terminated successfully',
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
