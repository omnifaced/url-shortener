import type { RefreshTokenRepository } from '../../../domain'
import type { TokenBlacklistPort } from '../../ports'
import { Id } from '../../../domain'

const ACCESS_TOKEN_EXPIRY = 60 * 15

export class LogoutAllUseCase {
	constructor(
		private readonly refreshTokenRepository: RefreshTokenRepository,
		private readonly tokenBlacklist: TokenBlacklistPort
	) {}

	public async execute(userId: number): Promise<void> {
		await Promise.all([
			this.tokenBlacklist.addUserTokens(userId, ACCESS_TOKEN_EXPIRY),
			this.refreshTokenRepository.deleteByUserId(Id.create(userId)),
		])
	}
}
