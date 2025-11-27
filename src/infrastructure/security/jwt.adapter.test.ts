import * as assert from 'node:assert'

import { Id, Username } from '../../domain'
import { describe, test } from 'node:test'
import { JwtAdapter } from './jwt.adapter'
import { sign } from 'hono/jwt'

describe('JwtAdapter', () => {
	const jwtSecret = 'test-secret'
	const accessTokenTtl = 3600
	const adapter = new JwtAdapter(jwtSecret, accessTokenTtl)

	describe('generateAccessToken', () => {
		test('should generate access token with correct payload', async () => {
			const payload = {
				userId: Id.create(1),
				username: Username.create('test_user'),
			}

			const token = await adapter.generateAccessToken(payload)

			assert.ok(token)
			assert.strictEqual(typeof token, 'string')
		})
	})

	describe('generateRefreshToken', () => {
		test('should generate random refresh token', () => {
			const token1 = adapter.generateRefreshToken()
			const token2 = adapter.generateRefreshToken()

			assert.ok(token1)
			assert.ok(token2)
			assert.notStrictEqual(token1, token2)
			assert.strictEqual(typeof token1, 'string')
		})

		test('should generate refresh token with correct format', () => {
			const token = adapter.generateRefreshToken()

			assert.strictEqual(typeof token, 'string')
			assert.strictEqual(token.length, 128)
			assert.match(token, /^[0-9a-f]{128}$/)
		})
	})

	describe('verifyAccessToken', () => {
		test('should return null for invalid token', async () => {
			const adapter = new JwtAdapter('secret', 3600)
			const result = await adapter.verifyAccessToken('invalid.token.here')

			assert.strictEqual(result, null)
		})

		test('should return null for malformed token', async () => {
			const adapter = new JwtAdapter('secret', 3600)
			const result = await adapter.verifyAccessToken('not.a.jwt.token')

			assert.strictEqual(result, null)
		})

		test('should return null for token with null payload', async () => {
			const adapter = new JwtAdapter(jwtSecret, accessTokenTtl)

			const tokenWithNullPayload = await sign(null!, jwtSecret)
			const result = await adapter.verifyAccessToken(tokenWithNullPayload)

			assert.strictEqual(result, null)
		})

		test('should return null for token with undefined payload', async () => {
			const adapter = new JwtAdapter(jwtSecret, accessTokenTtl)

			const tokenWithUndefinedPayload = await sign(undefined!, jwtSecret)
			const result = await adapter.verifyAccessToken(tokenWithUndefinedPayload)

			assert.strictEqual(result, null)
		})

		test('should return null when token has exp as falsy value', async () => {
			const adapter = new JwtAdapter(jwtSecret, accessTokenTtl)

			const tokenWithFalsyExp = await sign(
				{
					userId: 1,
					username: 'test',
					exp: 0,
				},
				jwtSecret
			)

			const result = await adapter.verifyAccessToken(tokenWithFalsyExp)

			assert.strictEqual(result, null)
		})

		test('should return null when token has NaN exp', async () => {
			const adapter = new JwtAdapter(jwtSecret, accessTokenTtl)

			const tokenWithNaNExp = await sign(
				{
					userId: 1,
					username: 'test',
					exp: Number.NaN,
				},
				jwtSecret
			)

			const result = await adapter.verifyAccessToken(tokenWithNaNExp)

			assert.strictEqual(result, null)
		})

		test('should return payload for valid token', async () => {
			const adapter = new JwtAdapter(jwtSecret, accessTokenTtl)

			const payload = {
				userId: Id.create(42),
				username: Username.create('valid_user'),
			}

			const token = await adapter.generateAccessToken(payload)
			const result = await adapter.verifyAccessToken(token)

			assert.ok(result)
			assert.strictEqual(result.userId.getValue(), 42)
			assert.strictEqual(result.username.getValue(), 'valid_user')
		})

		test('should return null when token has no exp', async () => {
			const adapter = new JwtAdapter(jwtSecret, accessTokenTtl)

			// генерируем валидный JWT без exp
			const tokenWithoutExp = await sign(
				{
					userId: 1,
					username: 'no_exp_user',
				},
				jwtSecret
			)

			const result = await adapter.verifyAccessToken(tokenWithoutExp)

			assert.strictEqual(result, null)
		})

		test('should return null for expired token', async () => {
			const adapter = new JwtAdapter(jwtSecret, accessTokenTtl)

			// exp в прошлом
			const expiredToken = await sign(
				{
					userId: 1,
					username: 'expired_user',
					exp: Math.floor(Date.now() / 1000) - 10,
				},
				jwtSecret
			)

			const result = await adapter.verifyAccessToken(expiredToken)

			assert.strictEqual(result, null)
		})

		test('should return null for token expiring exactly now', async () => {
			const adapter = new JwtAdapter(jwtSecret, accessTokenTtl)

			const nowToken = await sign(
				{
					userId: 1,
					username: 'now_user',
					exp: Math.floor(Date.now() / 1000),
				},
				jwtSecret
			)

			const result = await adapter.verifyAccessToken(nowToken)

			assert.strictEqual(result, null)
		})

		test('should return payload for token with future exp', async () => {
			const adapter = new JwtAdapter(jwtSecret, accessTokenTtl)

			const futureToken = await sign(
				{
					userId: 123,
					username: 'future_user',
					exp: Math.floor(Date.now() / 1000) + 3600,
				},
				jwtSecret
			)

			const result = await adapter.verifyAccessToken(futureToken)

			assert.ok(result)
			assert.strictEqual(result.userId.getValue(), 123)
			assert.strictEqual(result.username.getValue(), 'future_user')
		})

		test('should return null for token with empty payload object', async () => {
			const adapter = new JwtAdapter(jwtSecret, accessTokenTtl)

			const emptyPayloadToken = await sign({}, jwtSecret)
			const result = await adapter.verifyAccessToken(emptyPayloadToken)

			assert.strictEqual(result, null)
		})
	})
})
