import * as assert from 'node:assert'

import type { JwtPayload, TokenBlacklistPort } from '../../../application'
import { createAuthMiddleware } from './auth.middleware'
import { JwtAdapter } from '../../../infrastructure'
import { HTTPException } from 'hono/http-exception'
import { describe, test, mock } from 'node:test'
import type { Context } from 'hono'

const JWT_SECRET = 'secret'
const JWT_TTL = 60

const createContext = (headers: Record<string, string> = {}) => {
	const setMock = mock.fn()

	return {
		req: {
			header: (name: string) => headers[name],
		},
		set: setMock,
		__setMock: setMock,
	} as unknown as Context & { __setMock: ReturnType<typeof mock.fn> }
}

const next = mock.fn(async () => {})

describe('auth middleware', () => {
	test('should throw if Authorization header missing', async () => {
		const jwtPort = new JwtAdapter(JWT_SECRET, JWT_TTL)
		const mw = createAuthMiddleware(jwtPort)

		await assert.rejects(
			() => mw(createContext(), next),
			(err: Error) => err instanceof HTTPException && err.status === 401
		)
	})

	test('should throw if header is not Bearer', async () => {
		const jwtPort = new JwtAdapter(JWT_SECRET, JWT_TTL)
		const mw = createAuthMiddleware(jwtPort)

		await assert.rejects(
			() => mw(createContext({ Authorization: 'Basic xyz' }), next),
			(err: Error) => err instanceof HTTPException && err.status === 401
		)
	})

	test('should throw if jwtAdapter returns null', async () => {
		const jwtPort = new JwtAdapter(JWT_SECRET, JWT_TTL)
		const mw = createAuthMiddleware(jwtPort)

		await assert.rejects(
			() => mw(createContext({ Authorization: 'Bearer invalid_token' }), next),
			(err: Error) => err instanceof HTTPException && err.status === 401
		)
	})

	test('should throw if token is blacklisted', async () => {
		const jwtPort = new JwtAdapter(JWT_SECRET, JWT_TTL)

		const token = await jwtPort.generateAccessToken({
			userId: { getValue: () => 1 },
			username: { getValue: () => 'john' },
		} as JwtPayload)

		const isBlacklistedMock = mock.fn(async () => true)

		const tokenBlacklistPort = {
			isBlacklisted: isBlacklistedMock,
			addToken: mock.fn(),
			addUserTokens: mock.fn(),
			trackUserToken: mock.fn(),
			removeUserToken: mock.fn(),
		} as TokenBlacklistPort

		const mw = createAuthMiddleware(jwtPort, tokenBlacklistPort)

		await assert.rejects(
			() => mw(createContext({ Authorization: `Bearer ${token}` }), next),
			(err: Error) => err instanceof HTTPException && err.status === 401
		)

		assert.strictEqual(isBlacklistedMock.mock.calls.length, 1)
	})

	test('should set user and username and call next()', async () => {
		const jwtPort = new JwtAdapter(JWT_SECRET, JWT_TTL)

		const isBlacklistedMock = mock.fn(async () => false)

		const tokenBlacklistPort: TokenBlacklistPort = {
			isBlacklisted: isBlacklistedMock,
			addToken: mock.fn(),
			addUserTokens: mock.fn(),
			trackUserToken: mock.fn(),
			removeUserToken: mock.fn(),
		}

		const ctx = createContext()

		const token = await jwtPort.generateAccessToken({
			userId: { getValue: () => 123 },
			username: { getValue: () => 'alice' },
		} as JwtPayload)

		ctx.req.header = (() => {
			return `Bearer ${token}`
		}) as unknown as Context['req']['header']

		const mw = createAuthMiddleware(jwtPort, tokenBlacklistPort)

		await mw(ctx, next)

		assert.strictEqual(isBlacklistedMock.mock.calls.length, 1)
		assert.strictEqual(ctx.__setMock.mock.calls.length, 2)
		assert.strictEqual(next.mock.calls.length, 1)
	})
})
