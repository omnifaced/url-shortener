/* node:coverage disable */

import type { JwtPort, JwtPayload } from '../../application'
import { Id, Username } from '../../domain'
import { randomBytes } from 'node:crypto'
import { sign, verify } from 'hono/jwt'

interface JwtTokenPayload {
	userId: number
	username: string
	exp: number
}

export class JwtAdapter implements JwtPort {
	constructor(
		private readonly jwtSecret: string,
		private readonly accessTokenTtl: number
	) {}

	public async generateAccessToken(payload: JwtPayload): Promise<string> {
		const tokenPayload = {
			userId: payload.userId.getValue(),
			username: payload.username.getValue(),
			exp: Math.floor(Date.now() / 1000) + this.accessTokenTtl,
		}

		return await sign(tokenPayload, this.jwtSecret)
	}

	public generateRefreshToken(): string {
		return randomBytes(64).toString('hex')
	}

	public async verifyAccessToken(token: string): Promise<JwtPayload | null> {
		try {
			const payload = (await verify(token, this.jwtSecret, {
				alg: 'HS256',
			})) as unknown as JwtTokenPayload

			if (!payload || !payload.exp) {
				return null
			}

			if (payload.exp < Math.floor(Date.now() / 1000)) {
				return null
			}

			return {
				userId: Id.create(payload.userId),
				username: Username.create(payload.username),
			}
		} catch {
			return null
		}
	}
}

/* node:coverage enable */
