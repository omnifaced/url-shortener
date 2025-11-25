import type { JwtPort, TokenBlacklistPort } from '../../../application'
import { HTTPException } from 'hono/http-exception'
import type { MiddlewareHandler } from 'hono'

type Variables = {
	userId: number
	username: string
}

export function createAuthMiddleware(
	jwtPort: JwtPort,
	tokenBlacklistPort?: TokenBlacklistPort
): MiddlewareHandler<{ Variables: Variables }> {
	return async (c, next) => {
		const authHeader = c.req.header('Authorization')
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new HTTPException(401, {
				message: 'Missing or invalid authorization header',
			})
		}

		const token = authHeader.substring(7)
		const payload = await jwtPort.verifyAccessToken(token)

		if (!payload) {
			throw new HTTPException(401, { message: 'Invalid or expired token' })
		}

		if (tokenBlacklistPort) {
			const isBlacklisted = await tokenBlacklistPort.isBlacklisted(token)
			if (isBlacklisted) {
				throw new HTTPException(401, { message: 'Token has been revoked' })
			}
		}

		c.set('userId', payload.userId.getValue())
		c.set('username', payload.username.getValue())

		await next()
	}
}
