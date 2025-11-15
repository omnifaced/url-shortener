import {
	authResponseSchema,
	errorResponseSchema,
	loginSchema,
	messageResponseSchema,
	refreshResponseSchema,
	refreshSchema,
	registerSchema,
} from '../../dto'

import { createRoute } from '@hono/zod-openapi'

export const registerRoute = createRoute({
	method: 'post',
	path: '/register',
	tags: ['Authentication'],
	request: {
		body: {
			content: {
				'application/json': {
					schema: registerSchema.openapi('RegisterRequest'),
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				'application/json': {
					schema: authResponseSchema,
				},
			},
			description: 'User registered successfully',
		},
		400: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Bad request - username already exists',
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
					schema: loginSchema.openapi('LoginRequest'),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: authResponseSchema,
				},
			},
			description: 'Login successful',
		},
		401: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Invalid credentials',
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
					schema: refreshSchema.openapi('RefreshRequest'),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: refreshResponseSchema,
				},
			},
			description: 'Token refreshed successfully',
		},
		401: {
			content: {
				'application/json': {
					schema: errorResponseSchema,
				},
			},
			description: 'Invalid or expired refresh token',
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
					schema: refreshSchema.openapi('LogoutRequest'),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: messageResponseSchema,
				},
			},
			description: 'Logged out successfully',
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

export const logoutAllRoute = createRoute({
	method: 'post',
	path: '/logout-all',
	tags: ['Authentication'],
	security: [{ Bearer: [] }],
	responses: {
		200: {
			content: {
				'application/json': {
					schema: messageResponseSchema,
				},
			},
			description: 'All sessions terminated successfully',
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
