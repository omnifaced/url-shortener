import * as assert from 'node:assert'

import { RefreshToken } from './refresh-token.entity'
import { describe, test } from 'node:test'
import { Id } from '../value-objects'

function assertRefreshTokenFields(
	refreshToken: RefreshToken,
	expected: {
		userId: number
		token: string
		userAgent: string | null
		ip: string | null
		expiresAt: Date
	}
) {
	assert.strictEqual(refreshToken.getUserId().getValue(), expected.userId)
	assert.strictEqual(refreshToken.getToken(), expected.token)
	assert.strictEqual(refreshToken.getUserAgent(), expected.userAgent)
	assert.strictEqual(refreshToken.getIp(), expected.ip)
	assert.deepStrictEqual(refreshToken.getExpiresAt(), expected.expiresAt)
}

describe('RefreshToken', () => {
	describe('create', () => {
		test('should create RefreshToken from props', () => {
			const expiresAt = new Date('2025-12-31')
			const props = {
				id: Id.create(1),
				userId: Id.create(10),
				token: 'refresh_token_123',
				userAgent: 'Mozilla/5.0',
				ip: '127.0.0.1',
				expiresAt,
				createdAt: new Date(),
			}

			const refreshToken = RefreshToken.create(props)

			assert.strictEqual(refreshToken.getId().getValue(), 1)
			assertRefreshTokenFields(refreshToken, {
				userId: 10,
				token: 'refresh_token_123',
				userAgent: 'Mozilla/5.0',
				ip: '127.0.0.1',
				expiresAt,
			})
		})
	})

	describe('createNew', () => {
		test('should create new RefreshToken with all fields', () => {
			const userId = Id.create(10)
			const token = 'refresh_token_123'
			const expiresAt = new Date('2025-12-31')
			const userAgent = 'Mozilla/5.0'
			const ip = '127.0.0.1'

			const refreshToken = RefreshToken.createNew(userId, token, expiresAt, userAgent, ip)

			assertRefreshTokenFields(refreshToken, {
				userId: 10,
				token: 'refresh_token_123',
				userAgent: 'Mozilla/5.0',
				ip: '127.0.0.1',
				expiresAt,
			})
		})

		test('should create new RefreshToken without optional fields', () => {
			const userId = Id.create(10)
			const token = 'refresh_token_123'
			const expiresAt = new Date('2025-12-31')

			const refreshToken = RefreshToken.createNew(userId, token, expiresAt)

			assertRefreshTokenFields(refreshToken, {
				userId: 10,
				token: 'refresh_token_123',
				userAgent: null,
				ip: null,
				expiresAt,
			})
		})
	})

	describe('isExpired', () => {
		test('should return false when token is not expired', () => {
			const userId = Id.create(10)
			const token = 'refresh_token_123'
			const futureDate = new Date()
			futureDate.setFullYear(futureDate.getFullYear() + 1)

			const refreshToken = RefreshToken.createNew(userId, token, futureDate)

			assert.strictEqual(refreshToken.isExpired(), false)
		})

		test('should return true when token is expired', () => {
			const userId = Id.create(10)
			const token = 'refresh_token_123'
			const pastDate = new Date('2020-01-01')

			const refreshToken = RefreshToken.createNew(userId, token, pastDate)

			assert.strictEqual(refreshToken.isExpired(), true)
		})
	})
})
