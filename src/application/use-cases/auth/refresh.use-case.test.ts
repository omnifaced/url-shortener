import * as assert from 'node:assert'

import { Id, User, Username, RefreshToken, type UserRepository, type RefreshTokenRepository } from '../../../domain'
import { UnauthorizedError, NotFoundError } from '../../errors'
import type { JwtPort, TokenBlacklistPort } from '../../ports'
import { RefreshUseCase } from './refresh.use-case'
import { describe, test, mock } from 'node:test'

describe('RefreshUseCase', () => {
	test('should refresh access token successfully', async () => {
		const refreshToken = RefreshToken.create({
			id: Id.create(1),
			userId: Id.create(10),
			token: 'refresh_token_123',
			userAgent: null,
			ip: null,
			expiresAt: new Date(Date.now() + 3600000),
			createdAt: new Date(),
		})

		const user = User.create({
			id: Id.create(10),
			username: Username.create('test_user'),
			passwordHash: 'hashed_password',
			createdAt: new Date(),
		})

		const findByTokenMock = mock.fn(async () => refreshToken)
		const findByIdMock = mock.fn(async () => user)
		const generateAccessTokenMock = mock.fn(async () => 'new_access_token')
		const trackUserTokenMock = mock.fn(async () => {})

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			findByToken: findByTokenMock,
		} as unknown as RefreshTokenRepository

		const mockUserRepository: UserRepository = {
			findById: findByIdMock,
		} as unknown as UserRepository

		const mockJwtPort: JwtPort = {
			generateAccessToken: generateAccessTokenMock,
		} as unknown as JwtPort

		const mockTokenBlacklistPort: TokenBlacklistPort = {
			trackUserToken: trackUserTokenMock,
		} as unknown as TokenBlacklistPort

		const useCase = new RefreshUseCase(
			mockUserRepository,
			mockRefreshTokenRepository,
			mockJwtPort,
			mockTokenBlacklistPort
		)

		const result = await useCase.execute({
			refreshToken: 'refresh_token_123',
		})

		assert.strictEqual(result.accessToken, 'new_access_token')
		assert.strictEqual(findByTokenMock.mock.calls.length, 1)
		assert.strictEqual(findByIdMock.mock.calls.length, 1)
		assert.strictEqual(generateAccessTokenMock.mock.calls.length, 1)
		assert.strictEqual(trackUserTokenMock.mock.calls.length, 1)
	})

	test('should throw UnauthorizedError when refresh token not found', async () => {
		const mockRefreshTokenRepository: RefreshTokenRepository = {
			findByToken: mock.fn(async () => null),
		} as unknown as RefreshTokenRepository

		const mockUserRepository: UserRepository = {} as unknown as UserRepository
		const mockJwtPort: JwtPort = {} as unknown as JwtPort

		const useCase = new RefreshUseCase(mockUserRepository, mockRefreshTokenRepository, mockJwtPort)

		await assert.rejects(async () => {
			await useCase.execute({
				refreshToken: 'invalid_token',
			})
		}, UnauthorizedError)
	})

	test('should throw UnauthorizedError when refresh token is expired', async () => {
		const refreshToken = RefreshToken.create({
			id: Id.create(1),
			userId: Id.create(10),
			token: 'refresh_token_123',
			userAgent: null,
			ip: null,
			expiresAt: new Date('2020-01-01'),
			createdAt: new Date(),
		})

		const deleteByTokenMock = mock.fn(async () => {})

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			findByToken: mock.fn(async () => refreshToken),
			deleteByToken: deleteByTokenMock,
		} as unknown as RefreshTokenRepository

		const mockUserRepository: UserRepository = {} as unknown as UserRepository
		const mockJwtPort: JwtPort = {} as unknown as JwtPort

		const useCase = new RefreshUseCase(mockUserRepository, mockRefreshTokenRepository, mockJwtPort)

		await assert.rejects(async () => {
			await useCase.execute({
				refreshToken: 'refresh_token_123',
			})
		}, UnauthorizedError)

		assert.strictEqual(deleteByTokenMock.mock.calls.length, 1)
	})

	test('should throw NotFoundError when user not found', async () => {
		const refreshToken = RefreshToken.create({
			id: Id.create(1),
			userId: Id.create(10),
			token: 'refresh_token_123',
			userAgent: null,
			ip: null,
			expiresAt: new Date(Date.now() + 3600000),
			createdAt: new Date(),
		})

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			findByToken: mock.fn(async () => refreshToken),
		} as unknown as RefreshTokenRepository

		const mockUserRepository: UserRepository = {
			findById: mock.fn(async () => null),
		} as unknown as UserRepository

		const mockJwtPort: JwtPort = {} as unknown as JwtPort

		const useCase = new RefreshUseCase(mockUserRepository, mockRefreshTokenRepository, mockJwtPort)

		await assert.rejects(async () => {
			await useCase.execute({
				refreshToken: 'refresh_token_123',
			})
		}, NotFoundError)
	})

	test('should work without tokenBlacklistPort', async () => {
		const refreshToken = RefreshToken.create({
			id: Id.create(1),
			userId: Id.create(10),
			token: 'refresh_token_123',
			userAgent: null,
			ip: null,
			expiresAt: new Date(Date.now() + 3600000),
			createdAt: new Date(),
		})

		const user = User.create({
			id: Id.create(10),
			username: Username.create('test_user'),
			passwordHash: 'hashed_password',
			createdAt: new Date(),
		})

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			findByToken: mock.fn(async () => refreshToken),
		} as unknown as RefreshTokenRepository

		const mockUserRepository: UserRepository = {
			findById: mock.fn(async () => user),
		} as unknown as UserRepository

		const mockJwtPort: JwtPort = {
			generateAccessToken: mock.fn(async () => 'new_access_token'),
		} as unknown as JwtPort

		const useCase = new RefreshUseCase(mockUserRepository, mockRefreshTokenRepository, mockJwtPort)

		const result = await useCase.execute({
			refreshToken: 'refresh_token_123',
		})

		assert.strictEqual(result.accessToken, 'new_access_token')
	})
})
