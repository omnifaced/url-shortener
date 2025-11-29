import * as assert from 'node:assert/strict'

import { registerSchema, loginSchema, refreshSchema, authResponseSchema, refreshResponseSchema } from './auth.dto'
import { describe, it } from 'node:test'

describe('auth.dto', () => {
	describe('registerSchema', () => {
		it('should parse valid registration data', () => {
			const data = {
				username: 'omnifaced',
				password: 'password123',
			}

			const result = registerSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when username is too short', () => {
			const data = {
				username: 'ab',
				password: 'password123',
			}

			assert.throws(() => registerSchema.parse(data))
		})

		it('should fail when password is too short', () => {
			const data = {
				username: 'omnifaced',
				password: '12345',
			}

			assert.throws(() => registerSchema.parse(data))
		})

		it('should fail when username is too long', () => {
			const data = {
				username: 'a'.repeat(256),
				password: 'password123',
			}

			assert.throws(() => registerSchema.parse(data))
		})
	})

	describe('loginSchema', () => {
		it('should parse valid login data', () => {
			const data = {
				username: 'omnifaced',
				password: 'password123',
			}

			const result = loginSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when username is missing', () => {
			const data = {
				password: 'password123',
			}

			assert.throws(() => loginSchema.parse(data))
		})

		it('should fail when password is missing', () => {
			const data = {
				username: 'omnifaced',
			}

			assert.throws(() => loginSchema.parse(data))
		})
	})

	describe('refreshSchema', () => {
		it('should parse valid refresh token', () => {
			const data = {
				refreshToken: 'abc123...',
			}

			const result = refreshSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when refreshToken is empty', () => {
			const data = {
				refreshToken: '',
			}

			assert.throws(() => refreshSchema.parse(data))
		})

		it('should fail when refreshToken is missing', () => {
			const data = {}

			assert.throws(() => refreshSchema.parse(data))
		})
	})

	describe('authResponseSchema', () => {
		it('should parse valid auth response', () => {
			const data = {
				success: true,
				data: {
					accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
					refreshToken: 'abc123...',
					user: {
						id: 1,
						username: 'omnifaced',
					},
				},
			}

			const result = authResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when success is not true', () => {
			const data = {
				success: false,
				data: {
					accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
					refreshToken: 'abc123...',
					user: {
						id: 1,
						username: 'omnifaced',
					},
				},
			}

			assert.throws(() => authResponseSchema.parse(data))
		})

		it('should fail when user id is not a number', () => {
			const data = {
				success: true,
				data: {
					accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
					refreshToken: 'abc123...',
					user: {
						id: '1',
						username: 'omnifaced',
					},
				},
			}

			assert.throws(() => authResponseSchema.parse(data))
		})
	})

	describe('refreshResponseSchema', () => {
		it('should parse valid refresh response', () => {
			const data = {
				success: true,
				data: {
					accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
				},
			}

			const result = refreshResponseSchema.parse(data)
			assert.deepStrictEqual(result, data)
		})

		it('should fail when accessToken is missing', () => {
			const data = {
				success: true,
				data: {},
			}

			assert.throws(() => refreshResponseSchema.parse(data))
		})

		it('should fail when success is not true', () => {
			const data = {
				success: false,
				data: {
					accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
				},
			}

			assert.throws(() => refreshResponseSchema.parse(data))
		})
	})
})
