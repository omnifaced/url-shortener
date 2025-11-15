import {
	addTokenToBlacklist,
	addUserTokensToBlacklist,
	generateAccessToken,
	generateRefreshToken,
	getAccessTokenExpiry,
	getRefreshTokenExpiry,
	hashPassword,
	trackUserToken,
	verifyPassword,
	logger,
} from '../lib'

import { loginRoute, logoutAllRoute, logoutRoute, refreshRoute, registerRoute } from '../openapi'
import type { RouteConfigToTypedResponse } from '@hono/zod-openapi'
import { authMiddleware, responseMiddleware } from '../middleware'
import { validationErrorWrapperHook } from '../hooks'
import { HTTPException } from 'hono/http-exception'
import { users, refreshTokens } from '../db/schema'
import { OpenAPIHono } from '@hono/zod-openapi'
import type { Variables } from '../types'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'

const authRouter = new OpenAPIHono<{ Variables: Variables }>({
	defaultHook: validationErrorWrapperHook,
})

authRouter.use('*', responseMiddleware)

authRouter.openapi(registerRoute, async (c) => {
	const { username, password } = c.req.valid('json')

	const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1)

	if (existingUser.length > 0) {
		logger.warn('Registration attempt with existing username', { username })
		throw new HTTPException(400, { message: 'Username already exists' })
	}

	const hashedPassword = await hashPassword(password)

	const result = await db.transaction(async (tx) => {
		const [newUser] = await tx
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

		await tx.insert(refreshTokens).values({
			userId: newUser.id,
			token: refreshTokenValue,
			userAgent,
			ip,
			expiresAt: getRefreshTokenExpiry(),
		})

		await trackUserToken(newUser.id, accessToken)

		return {
			newUser,
			accessToken,
			refreshTokenValue,
		}
	})

	logger.success('User registered', { userId: result.newUser.id, username: result.newUser.username })

	return c.json(
		{
			accessToken: result.accessToken,
			refreshToken: result.refreshTokenValue,
			user: {
				id: result.newUser.id,
				username: result.newUser.username,
			},
		},
		201
	)
})

authRouter.openapi(loginRoute, async (c): Promise<RouteConfigToTypedResponse<typeof loginRoute>> => {
	const { username, password } = c.req.valid('json')

	const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)

	if (!user) {
		logger.warn('Login attempt with non-existent username', { username })
		throw new HTTPException(401, { message: 'Invalid credentials' })
	}

	const isValidPassword = await verifyPassword(password, user.password)

	if (!isValidPassword) {
		logger.warn('Login attempt with invalid password', { userId: user.id, username })
		throw new HTTPException(401, { message: 'Invalid credentials' })
	}

	const result = await db.transaction(async (tx) => {
		const accessToken = await generateAccessToken(user.id, user.username)
		const refreshTokenValue = generateRefreshToken()

		const userAgent = c.req.header('user-agent') || null
		const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null

		await tx.insert(refreshTokens).values({
			userId: user.id,
			token: refreshTokenValue,
			userAgent,
			ip,
			expiresAt: getRefreshTokenExpiry(),
		})

		await trackUserToken(user.id, accessToken)

		return {
			accessToken,
			refreshTokenValue,
		}
	})

	logger.success('User logged in', {
		userId: user.id,
		username: user.username,
		ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
	})

	return c.json(
		{
			accessToken: result.accessToken,
			refreshToken: result.refreshTokenValue,
			user: {
				id: user.id,
				username: user.username,
			},
		},
		200
	)
})

authRouter.openapi(refreshRoute, async (c): Promise<RouteConfigToTypedResponse<typeof refreshRoute>> => {
	const { refreshToken: refreshTokenValue } = c.req.valid('json')

	const accessToken = await db.transaction(async (tx) => {
		const [tokenRecord] = await tx
			.select()
			.from(refreshTokens)
			.where(eq(refreshTokens.token, refreshTokenValue))
			.limit(1)

		if (!tokenRecord) {
			throw new HTTPException(401, { message: 'Invalid refresh token' })
		}

		if (new Date(tokenRecord.expiresAt) < new Date()) {
			await tx.delete(refreshTokens).where(eq(refreshTokens.id, tokenRecord.id))
			throw new HTTPException(401, { message: 'Refresh token expired' })
		}

		const [user] = await tx.select().from(users).where(eq(users.id, tokenRecord.userId)).limit(1)

		if (!user) {
			throw new HTTPException(401, { message: 'User not found' })
		}

		const newAccessToken = await generateAccessToken(user.id, user.username)

		await trackUserToken(user.id, newAccessToken)

		return newAccessToken
	})

	return c.json(
		{
			accessToken,
		},
		200
	)
})

const authenticatedAuthRouter = new OpenAPIHono<{ Variables: Variables }>({
	defaultHook: validationErrorWrapperHook,
})

authenticatedAuthRouter.use('*', responseMiddleware)
authenticatedAuthRouter.use('*', authMiddleware)

authenticatedAuthRouter.openapi(logoutRoute, async (c): Promise<RouteConfigToTypedResponse<typeof logoutRoute>> => {
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

	return c.json({ message: 'Logged out successfully' }, 200)
})

authenticatedAuthRouter.openapi(
	logoutAllRoute,
	async (c): Promise<RouteConfigToTypedResponse<typeof logoutAllRoute>> => {
		const auth = c.get('auth')

		await Promise.all([
			db.delete(refreshTokens).where(eq(refreshTokens.userId, auth.userId)),
			addUserTokensToBlacklist(auth.userId, getAccessTokenExpiry()),
		])

		logger.warn('User terminated all sessions', { userId: auth.userId, username: auth.username })

		return c.json({ message: 'All sessions terminated successfully' }, 200)
	}
)

authRouter.route('/', authenticatedAuthRouter)

export { authRouter }
