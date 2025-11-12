import { verifyToken, isTokenBlacklisted, logger } from '../lib'
import { HTTPException } from 'hono/http-exception'
import type { Context, Next } from 'hono'

export interface AuthContext {
	userId: number
	username: string
}

export async function authMiddleware(c: Context, next: Next) {
	const authHeader = c.req.header('Authorization')

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		throw new HTTPException(401, { message: 'Unauthorized', cause: { message: 'Missing or invalid Authorization header' } })
	}

	const token = authHeader.substring(7)

	try {
		const payload = await verifyToken(token)

		if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
			logger.warn('Expired token used', { userId: payload.userId })
			throw new HTTPException(401, { message: 'Unauthorized', cause: { message: 'Token expired' } })
		}

		const isBlacklisted = await isTokenBlacklisted(token)

		if (isBlacklisted) {
			logger.warn('Blacklisted token used', { userId: payload.userId })
			throw new HTTPException(401, { message: 'Unauthorized', cause: { message: 'Token has been revoked' } })
		}

		c.set('auth', {
			userId: payload.userId,
			username: payload.username,
		})

		await next()
	} catch (error) {
		if (error instanceof HTTPException) {
			throw error
		}

		logger.error('Token verification failed', { error: error instanceof Error ? error.message : String(error) })
		throw new HTTPException(401, { message: 'Unauthorized', cause: { message: 'Invalid token' } })
	}
}
