import type { RefreshTokenRepository } from '../../../domain'
import type { TokenBlacklistPort } from '../../ports'
import type { RefreshDto } from '../../dto'

export class LogoutUseCase {
	constructor(
		private readonly refreshTokenRepository: RefreshTokenRepository,
		private readonly tokenBlacklistPort?: TokenBlacklistPort
	) {}

	public async execute(data: RefreshDto, accessToken?: string, accessTokenTtl?: number): Promise<void> {
		const promises: Promise<void>[] = [this.refreshTokenRepository.deleteByToken(data.refreshToken)]

		if (this.tokenBlacklistPort && accessToken && accessTokenTtl) {
			promises.push(this.tokenBlacklistPort.addToken(accessToken, accessTokenTtl))
		}

		await Promise.all(promises)
	}
}
