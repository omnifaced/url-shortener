import {
	hashPassword,
	verifyPassword,
	generateAccessToken,
	generateRefreshToken,
	getRefreshTokenExpiry,
	getAccessTokenExpiry,
	addTokenToBlacklist,
	addUserTokensToBlacklist,
	trackUserToken,
} from '../lib'

import { registerSchema, loginSchema, refreshSchema } from '../validators'
import { authMiddleware, responseMiddleware } from '../middleware'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { validationErrorWrapperHook } from '../hooks'
import { users, refreshTokens } from '../db/schema'
import type { Variables } from '../types'
import { eq, and } from 'drizzle-orm'
import { logger } from '../lib'
import { db } from '../db'

const authResponseSchema = z.object({
	accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
	refreshToken: z.string().openapi({ example: 'abc123...' }),
	user: z.object({
		id: z.number().openapi({ example: 1 }),
		username: z.string().openapi({ example: 'johndoe' }),
	}),
})

const refreshResponseSchema = z.object({
	accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
})

const messageResponseSchema = z.object({
	message: z.string(),
})

const errorResponseSchema = z.object({
	error: z.string(),
})

const registerRoute = createRoute({
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

const loginRoute = createRoute({
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

const authRouter = new OpenAPIHono<{ Variables: Variables }>({
	defaultHook: validationErrorWrapperHook,
})

authRouter.use('*', responseMiddleware)

authRouter.openapi(registerRoute, async (c) => {
	const { username, password } = c.req.valid('json')

	const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1)

	if (existingUser.length > 0) {
		logger.warn('Registration attempt with existing username', { username })
		return c.json({ error: 'Username already exists' }, 400)
	}

	const hashedPassword = await hashPassword(password)

	const [newUser] = await db
		.insert(users)
		.values({
			username,
			password: hashedPassword,
		})
		.returning()

	const accessToken = await generateAccessToken(newUser.id, newUser.username)
	const refreshTokenValue = generateRefreshToken()

	const userAgent = c.req.header('user-agent') || null
	const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null

	await Promise.all([
		db.insert(refreshTokens).values({
			userId: newUser.id,
			token: refreshTokenValue,
			userAgent,
			ip,
			expiresAt: getRefreshTokenExpiry(),
		}),
		trackUserToken(newUser.id, accessToken),
	])

	logger.success('User registered', { userId: newUser.id, username: newUser.username })

	return c.json(
		{
			accessToken,
			refreshToken: refreshTokenValue,
			user: {
				id: newUser.id,
				username: newUser.username,
			},
		},
		201
	)
})

// @ts-expect-error - OpenAPI type inference issue
authRouter.openapi(loginRoute, async (c) => {
	const { username, password } = c.req.valid('json')

	const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)

	if (!user) {
		logger.warn('Login attempt with non-existent username', { username })
		return c.json({ error: 'Invalid credentials' }, 401)
	}

	const isValidPassword = await verifyPassword(password, user.password)

	if (!isValidPassword) {
		logger.warn('Login attempt with invalid password', { userId: user.id, username })
		return c.json({ error: 'Invalid credentials' }, 401)
	}

	const accessToken = await generateAccessToken(user.id, user.username)
	const refreshTokenValue = generateRefreshToken()

	const userAgent = c.req.header('user-agent') || null
	const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null

	await Promise.all([
		db.insert(refreshTokens).values({
			userId: user.id,
			token: refreshTokenValue,
			userAgent,
			ip,
			expiresAt: getRefreshTokenExpiry(),
		}),
		trackUserToken(user.id, accessToken),
	])

	logger.success('User logged in', { userId: user.id, username: user.username, ip })

	return c.json({
		accessToken,
		refreshToken: refreshTokenValue,
		user: {
			id: user.id,
			username: user.username,
		},
	})
})

const refreshRoute = createRoute({
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

const logoutRoute = createRoute({
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

const logoutAllRoute = createRoute({
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

// @ts-expect-error - OpenAPI type inference issue
authRouter.openapi(refreshRoute, async (c) => {
	const { refreshToken: refreshTokenValue } = c.req.valid('json')

	const [tokenRecord] = await db
		.select()
		.from(refreshTokens)
		.where(eq(refreshTokens.token, refreshTokenValue))
		.limit(1)

	if (!tokenRecord) {
		return c.json({ error: 'Invalid refresh token' }, 401)
	}

	if (new Date(tokenRecord.expiresAt) < new Date()) {
		await db.delete(refreshTokens).where(eq(refreshTokens.id, tokenRecord.id))
		return c.json({ error: 'Refresh token expired' }, 401)
	}

	const [user] = await db.select().from(users).where(eq(users.id, tokenRecord.userId)).limit(1)

	if (!user) {
		return c.json({ error: 'User not found' }, 401)
	}

	const accessToken = await generateAccessToken(user.id, user.username)

	await trackUserToken(user.id, accessToken)

	return c.json({
		accessToken,
	})
})

const authenticatedAuthRouter = new OpenAPIHono<{ Variables: Variables }>({
	defaultHook: validationErrorWrapperHook,
})

authenticatedAuthRouter.use('*', responseMiddleware)
authenticatedAuthRouter.use('*', authMiddleware)

// @ts-expect-error - OpenAPI type inference issue
authenticatedAuthRouter.openapi(logoutRoute, async (c) => {
	const { refreshToken: refreshTokenValue } = c.req.valid('json')
	const auth = c.get('auth')

	const authHeader = c.req.header('Authorization')
	const accessToken = authHeader?.substring(7)

	await Promise.all([
		db
			.delete(refreshTokens)
			.where(and(eq(refreshTokens.token, refreshTokenValue), eq(refreshTokens.userId, auth.userId))),
		accessToken ? addTokenToBlacklist(accessToken, getAccessTokenExpiry()) : Promise.resolve(),
	])

	logger.info('User logged out', { userId: auth.userId, username: auth.username })

	return c.json({ message: 'Logged out successfully' })
})

// @ts-expect-error - OpenAPI type inference issue
authenticatedAuthRouter.openapi(logoutAllRoute, async (c) => {
	const auth = c.get('auth')

	await Promise.all([
		db.delete(refreshTokens).where(eq(refreshTokens.userId, auth.userId)),
		addUserTokensToBlacklist(auth.userId, getAccessTokenExpiry()),
	])

	logger.warn('User terminated all sessions', { userId: auth.userId, username: auth.username })

	return c.json({ message: 'All sessions terminated successfully' })
})

authRouter.route('/', authenticatedAuthRouter)

export { authRouter }
