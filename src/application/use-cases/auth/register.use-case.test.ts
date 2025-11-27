import * as assert from 'node:assert'

import { Id, User, Username, type UserRepository, type RefreshTokenRepository } from '../../../domain'
import type { PasswordPort, JwtPort, TokenBlacklistPort } from '../../ports'
import { RegisterUseCase } from './register.use-case'
import { describe, test, mock } from 'node:test'
import { ConflictError } from '../../errors'

describe('RegisterUseCase', () => {
	test('should register new user successfully', async () => {
		const savedUser = User.create({
			id: Id.create(1),
			username: Username.create('new_user'),
			passwordHash: 'hashed_password',
			createdAt: new Date(),
		})

		const findByUsernameMock = mock.fn(async () => null)
		const hashMock = mock.fn(async () => 'hashed_password')
		const saveUserMock = mock.fn(async () => savedUser)
		const saveRefreshTokenMock = mock.fn(async () => ({}))
		const generateAccessTokenMock = mock.fn(async () => 'access_token_123')
		const generateRefreshTokenMock = mock.fn(() => 'refresh_token_123')
		const trackUserTokenMock = mock.fn(async () => {})

		const mockUserRepository: UserRepository = {
			findByUsername: findByUsernameMock,
			save: saveUserMock,
		} as unknown as UserRepository

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			save: saveRefreshTokenMock,
		} as unknown as RefreshTokenRepository

		const mockPasswordPort: PasswordPort = {
			hash: hashMock,
		} as unknown as PasswordPort

		const mockJwtPort: JwtPort = {
			generateAccessToken: generateAccessTokenMock,
			generateRefreshToken: generateRefreshTokenMock,
		} as unknown as JwtPort

		const mockTokenBlacklistPort: TokenBlacklistPort = {
			trackUserToken: trackUserTokenMock,
		} as unknown as TokenBlacklistPort

		const useCase = new RegisterUseCase(
			mockUserRepository,
			mockRefreshTokenRepository,
			mockPasswordPort,
			mockJwtPort,
			3600,
			mockTokenBlacklistPort
		)

		const result = await useCase.execute(
			{
				username: 'new_user',
				password: 'password123',
			},
			'Mozilla/5.0',
			'127.0.0.1'
		)

		assert.strictEqual(result.accessToken, 'access_token_123')
		assert.strictEqual(result.refreshToken, 'refresh_token_123')
		assert.strictEqual(result.user.id, 1)
		assert.strictEqual(result.user.username, 'new_user')
		assert.strictEqual(findByUsernameMock.mock.calls.length, 1)
		assert.strictEqual(hashMock.mock.calls.length, 1)
		assert.strictEqual(saveUserMock.mock.calls.length, 1)
		assert.strictEqual(saveRefreshTokenMock.mock.calls.length, 1)
		assert.strictEqual(generateAccessTokenMock.mock.calls.length, 1)
		assert.strictEqual(generateRefreshTokenMock.mock.calls.length, 1)
		assert.strictEqual(trackUserTokenMock.mock.calls.length, 1)
	})

	test('should throw ConflictError when username already exists', async () => {
		const existingUser = User.create({
			id: Id.create(1),
			username: Username.create('existing_user'),
			passwordHash: 'hashed_password',
			createdAt: new Date(),
		})

		const mockUserRepository: UserRepository = {
			findByUsername: mock.fn(async () => existingUser),
		} as unknown as UserRepository

		const mockRefreshTokenRepository: RefreshTokenRepository = {} as unknown as RefreshTokenRepository
		const mockPasswordPort: PasswordPort = {} as unknown as PasswordPort
		const mockJwtPort: JwtPort = {} as unknown as JwtPort

		const useCase = new RegisterUseCase(
			mockUserRepository,
			mockRefreshTokenRepository,
			mockPasswordPort,
			mockJwtPort,
			3600
		)

		await assert.rejects(async () => {
			await useCase.execute({
				username: 'existing_user',
				password: 'password123',
			})
		}, ConflictError)
	})

	test('should work without tokenBlacklistPort', async () => {
		const savedUser = User.create({
			id: Id.create(1),
			username: Username.create('new_user'),
			passwordHash: 'hashed_password',
			createdAt: new Date(),
		})

		const mockUserRepository: UserRepository = {
			findByUsername: mock.fn(async () => null),
			save: mock.fn(async () => savedUser),
		} as unknown as UserRepository

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			save: mock.fn(async () => ({})),
		} as unknown as RefreshTokenRepository

		const mockPasswordPort: PasswordPort = {
			hash: mock.fn(async () => 'hashed_password'),
		} as unknown as PasswordPort

		const mockJwtPort: JwtPort = {
			generateAccessToken: mock.fn(async () => 'access_token_123'),
			generateRefreshToken: mock.fn(() => 'refresh_token_123'),
		} as unknown as JwtPort

		const useCase = new RegisterUseCase(
			mockUserRepository,
			mockRefreshTokenRepository,
			mockPasswordPort,
			mockJwtPort,
			3600
		)

		const result = await useCase.execute({
			username: 'new_user',
			password: 'password123',
		})

		assert.strictEqual(result.accessToken, 'access_token_123')
		assert.strictEqual(result.refreshToken, 'refresh_token_123')
	})

	test('should work without userAgent and ip', async () => {
		const savedUser = User.create({
			id: Id.create(1),
			username: Username.create('new_user'),
			passwordHash: 'hashed_password',
			createdAt: new Date(),
		})

		const mockUserRepository: UserRepository = {
			findByUsername: mock.fn(async () => null),
			save: mock.fn(async () => savedUser),
		} as unknown as UserRepository

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			save: mock.fn(async () => ({})),
		} as unknown as RefreshTokenRepository

		const mockPasswordPort: PasswordPort = {
			hash: mock.fn(async () => 'hashed_password'),
		} as unknown as PasswordPort

		const mockJwtPort: JwtPort = {
			generateAccessToken: mock.fn(async () => 'access_token_123'),
			generateRefreshToken: mock.fn(() => 'refresh_token_123'),
		} as unknown as JwtPort

		const useCase = new RegisterUseCase(
			mockUserRepository,
			mockRefreshTokenRepository,
			mockPasswordPort,
			mockJwtPort,
			3600
		)

		const result = await useCase.execute({
			username: 'new_user',
			password: 'password123',
		})

		assert.strictEqual(result.accessToken, 'access_token_123')
	})
})
