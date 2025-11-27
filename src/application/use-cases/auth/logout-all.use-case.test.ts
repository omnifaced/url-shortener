import * as assert from 'node:assert'

import type { RefreshTokenRepository } from '../../../domain'
import { LogoutAllUseCase } from './logout-all.use-case'
import type { TokenBlacklistPort } from '../../ports'
import { describe, test, mock } from 'node:test'

describe('LogoutAllUseCase', () => {
	test('should logout all sessions successfully', async () => {
		const addUserTokensMock = mock.fn(async (_id: number, _ttl: number) => {})
		const deleteByUserIdMock = mock.fn(async (_id: number) => {})

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			deleteByUserId: deleteByUserIdMock,
		} as unknown as RefreshTokenRepository

		const mockTokenBlacklistPort: TokenBlacklistPort = {
			addUserTokens: addUserTokensMock,
		} as unknown as TokenBlacklistPort

		const useCase = new LogoutAllUseCase(mockRefreshTokenRepository, mockTokenBlacklistPort)

		await useCase.execute(10)

		assert.strictEqual(addUserTokensMock.mock.calls.length, 1)
		assert.strictEqual(deleteByUserIdMock.mock.calls.length, 1)
	})

	test('should call addUserTokens with correct parameters', async () => {
		const addUserTokensMock = mock.fn(async (_id: number, _ttl: number) => {})

		const mockRefreshTokenRepository: RefreshTokenRepository = {
			deleteByUserId: mock.fn(async (_id: number) => {}),
		} as unknown as RefreshTokenRepository

		const mockTokenBlacklistPort: TokenBlacklistPort = {
			addUserTokens: addUserTokensMock,
		} as unknown as TokenBlacklistPort

		const useCase = new LogoutAllUseCase(mockRefreshTokenRepository, mockTokenBlacklistPort)

		await useCase.execute(42)

		assert.strictEqual(addUserTokensMock.mock.calls.length, 1)
		assert.strictEqual(addUserTokensMock.mock.calls[0].arguments[0], 42)
		assert.strictEqual(addUserTokensMock.mock.calls[0].arguments[1], 900)
	})
})
