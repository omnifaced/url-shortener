import { randomBytes } from 'node:crypto'
import { sign, verify } from 'hono/jwt'

const JWT_SECRET = process.env.JWT_SECRET!
const ACCESS_TOKEN_EXPIRY = 60 * 15
const REFRESH_TOKEN_EXPIRY = 60 * 60 * 24 * 30

export function getAccessTokenExpiry(): number {
	return ACCESS_TOKEN_EXPIRY
}

export interface TokenPayload {
	userId: number
	username: string
	exp: number
	[key: string]: unknown
}

export async function generateAccessToken(userId: number, username: string): Promise<string> {
	const payload: TokenPayload = {
		userId,
		username,
		exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY,
	}

	return await sign(payload, JWT_SECRET)
}

export function generateRefreshToken(): string {
	return randomBytes(64).toString('hex')
}

export function getRefreshTokenExpiry(): Date {
	return new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000)
}

export async function verifyToken(token: string): Promise<TokenPayload> {
	const payload = await verify(token, JWT_SECRET)

	return payload as TokenPayload
}
