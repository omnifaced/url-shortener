import * as assert from 'node:assert'

import type { RefreshTokenRepository } from '../../../domain'
import type { TokenBlacklistPort } from '../../ports'
import { LogoutUseCase } from './logout.use-case'
import { describe, test, mock } from 'node:test'

describe('LogoutUseCase', () => {
	test('should logout successfully with access token', async () => {
		const deleteByTokenMock = mock.fn(async () => {})
		const addTokenMock = mock.fn(async () => {})

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			deleteByToken: deleteByTokenMock,
		} as unknown as RefreshTokenRepository

		const mockTokenBlacklistPort: TokenBlacklistPort = {
			addToken: addTokenMock,
		} as unknown as TokenBlacklistPort

		const useCase = new LogoutUseCase(mockRefreshTokenRepository, mockTokenBlacklistPort)

		await useCase.execute(
			{
				refreshToken: 'refresh_token_123',
			},
			'access_token_123',
			3600
		)

		assert.strictEqual(deleteByTokenMock.mock.calls.length, 1)
		assert.strictEqual(addTokenMock.mock.calls.length, 1)
	})

	test('should logout without access token blacklisting', async () => {
		const deleteByTokenMock = mock.fn(async () => {})

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			deleteByToken: deleteByTokenMock,
		} as unknown as RefreshTokenRepository

		const mockTokenBlacklistPort: TokenBlacklistPort = {
			addToken: mock.fn(async () => {}),
		} as unknown as TokenBlacklistPort

		const useCase = new LogoutUseCase(mockRefreshTokenRepository, mockTokenBlacklistPort)

		await useCase.execute({
			refreshToken: 'refresh_token_123',
		})

		assert.strictEqual(deleteByTokenMock.mock.calls.length, 1)
	})

	test('should work without tokenBlacklistPort', async () => {
		const deleteByTokenMock = mock.fn(async () => {})

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			deleteByToken: deleteByTokenMock,
		} as unknown as RefreshTokenRepository

		const useCase = new LogoutUseCase(mockRefreshTokenRepository)

		await useCase.execute({
			refreshToken: 'refresh_token_123',
		})

		assert.strictEqual(deleteByTokenMock.mock.calls.length, 1)
	})

	test('should only blacklist access token if both accessToken and accessTokenTtl are provided', async () => {
		const deleteByTokenMock = mock.fn(async () => {})
		const addTokenMock = mock.fn(async () => {})

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			deleteByToken: deleteByTokenMock,
		} as unknown as RefreshTokenRepository

		const mockTokenBlacklistPort: TokenBlacklistPort = {
			addToken: addTokenMock,
		} as unknown as TokenBlacklistPort

		const useCase = new LogoutUseCase(mockRefreshTokenRepository, mockTokenBlacklistPort)

		await useCase.execute(
			{
				refreshToken: 'refresh_token_123',
			},
			'access_token_123'
		)

		assert.strictEqual(deleteByTokenMock.mock.calls.length, 1)
		assert.strictEqual(addTokenMock.mock.calls.length, 0)
	})
})
