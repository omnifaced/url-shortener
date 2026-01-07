import * as assert from 'node:assert'

import { Id, User, Username, type UserRepository, type RefreshTokenRepository } from '../../../domain'
import type { PasswordPort, JwtPort, TokenBlacklistPort } from '../../ports'
import { describe, test, mock } from 'node:test'
import { UnauthorizedError } from '../../errors'
import { LoginUseCase } from './login.use-case'

describe('LoginUseCase', () => {
	test('should login successfully with valid credentials', async () => {
		const user = User.create({
			id: Id.create(1),
			username: Username.create('test_user'),
			passwordHash: 'hashed_password',
			createdAt: new Date(),
		})

		const findByUsernameMock = mock.fn(async () => user)
		const verifyMock = mock.fn(async () => true)
		const generateAccessTokenMock = mock.fn(async () => 'access_token_123')
		const generateRefreshTokenMock = mock.fn(() => 'refresh_token_123')
		const saveMock = mock.fn(async () => ({}))
		const trackUserTokenMock = mock.fn(async () => {})

		const mockUserRepository: UserRepository = {
			findByUsername: findByUsernameMock,
		} as unknown as UserRepository

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			save: saveMock,
		} as unknown as RefreshTokenRepository

		const mockPasswordPort: PasswordPort = {
			verify: verifyMock,
		} as unknown as PasswordPort

		const mockJwtPort: JwtPort = {
			generateAccessToken: generateAccessTokenMock,
			generateRefreshToken: generateRefreshTokenMock,
		} as unknown as JwtPort

		const mockTokenBlacklistPort: TokenBlacklistPort = {
			trackUserToken: trackUserTokenMock,
		} as unknown as TokenBlacklistPort

		const useCase = new LoginUseCase(
			mockUserRepository,
			mockRefreshTokenRepository,
			mockPasswordPort,
			mockJwtPort,
			3600,
			mockTokenBlacklistPort
		)

		const result = await useCase.execute(
			{
				username: 'test_user',
				password: 'password123',
			},
			'Mozilla/5.0',
			'127.0.0.1'
		)

		assert.strictEqual(result.accessToken, 'access_token_123')
		assert.strictEqual(result.refreshToken, 'refresh_token_123')
		assert.strictEqual(result.user.id, 1)
		assert.strictEqual(result.user.username, 'test_user')
		assert.strictEqual(findByUsernameMock.mock.calls.length, 1)
		assert.strictEqual(verifyMock.mock.calls.length, 1)
		assert.strictEqual(generateAccessTokenMock.mock.calls.length, 1)
		assert.strictEqual(generateRefreshTokenMock.mock.calls.length, 1)
		assert.strictEqual(saveMock.mock.calls.length, 1)
		assert.strictEqual(trackUserTokenMock.mock.calls.length, 1)
	})

	test('should throw UnauthorizedError when user not found', async () => {
		const mockUserRepository: UserRepository = {
			findByUsername: mock.fn(async () => null),
		} as unknown as UserRepository

		const mockRefreshTokenRepository: RefreshTokenRepository = {} as unknown as RefreshTokenRepository
		const mockPasswordPort: PasswordPort = {} as unknown as PasswordPort
		const mockJwtPort: JwtPort = {} as unknown as JwtPort

		const useCase = new LoginUseCase(
			mockUserRepository,
			mockRefreshTokenRepository,
			mockPasswordPort,
			mockJwtPort,
			3600
		)

		await assert.rejects(async () => {
			await useCase.execute({
				username: 'nonexistent',
				password: 'password123',
			})
		}, UnauthorizedError)
	})

	test('should throw UnauthorizedError when password is invalid', async () => {
		const user = User.create({
			id: Id.create(1),
			username: Username.create('test_user'),
			passwordHash: 'hashed_password',
			createdAt: new Date(),
		})

		const mockUserRepository: UserRepository = {
			findByUsername: mock.fn(async () => user),
		} as unknown as UserRepository

		const mockRefreshTokenRepository: RefreshTokenRepository = {} as unknown as RefreshTokenRepository

		const mockPasswordPort: PasswordPort = {
			verify: mock.fn(async () => false),
		} as unknown as PasswordPort

		const mockJwtPort: JwtPort = {} as unknown as JwtPort

		const useCase = new LoginUseCase(
			mockUserRepository,
			mockRefreshTokenRepository,
			mockPasswordPort,
			mockJwtPort,
			3600
		)

		await assert.rejects(async () => {
			await useCase.execute({
				username: 'test_user',
				password: 'wrong_password',
			})
		}, UnauthorizedError)
	})

	const createLoginUseCaseWithoutBlacklist = () => {
		const user = User.create({
			id: Id.create(1),
			username: Username.create('test_user'),
			passwordHash: 'hashed_password',
			createdAt: new Date(),
		})

		const mockUserRepository: UserRepository = {
			findByUsername: mock.fn(async () => user),
		} as unknown as UserRepository

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			save: mock.fn(async () => ({})),
		} as unknown as RefreshTokenRepository

		const mockPasswordPort: PasswordPort = {
			verify: mock.fn(async () => true),
		} as unknown as PasswordPort

		const mockJwtPort: JwtPort = {
			generateAccessToken: mock.fn(async () => 'access_token_123'),
			generateRefreshToken: mock.fn(() => 'refresh_token_123'),
		} as unknown as JwtPort

		return new LoginUseCase(mockUserRepository, mockRefreshTokenRepository, mockPasswordPort, mockJwtPort, 3600)
	}

	test('should work without tokenBlacklistPort', async () => {
		const useCase = createLoginUseCaseWithoutBlacklist()

		const result = await useCase.execute({
			username: 'test_user',
			password: 'password123',
		})

		assert.strictEqual(result.accessToken, 'access_token_123')
		assert.strictEqual(result.refreshToken, 'refresh_token_123')
	})

	test('should work without userAgent and ip', async () => {
		const useCase = createLoginUseCaseWithoutBlacklist()

		const result = await useCase.execute({
			username: 'test_user',
			password: 'password123',
		})

		assert.strictEqual(result.accessToken, 'access_token_123')
	})
})
