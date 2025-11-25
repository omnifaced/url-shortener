import type { UserRepository, RefreshTokenRepository } from '../../../domain'
import type { RefreshDto, RefreshResponseDto } from '../../dto'
import { UnauthorizedError, NotFoundError } from '../../errors'
import type { JwtPort, TokenBlacklistPort } from '../../ports'
import { authAttemptsTotal } from '../../../shared'

export class RefreshUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly refreshTokenRepository: RefreshTokenRepository,
		private readonly jwtPort: JwtPort,
		private readonly tokenBlacklistPort?: TokenBlacklistPort
	) {}

	public async execute(data: RefreshDto): Promise<RefreshResponseDto> {
		const refreshToken = await this.refreshTokenRepository.findByToken(data.refreshToken)
		if (!refreshToken) {
			authAttemptsTotal.inc({ type: 'refresh', status: 'failed' })
			throw new UnauthorizedError('Invalid refresh token')
		}

		if (refreshToken.isExpired()) {
			await this.refreshTokenRepository.deleteByToken(data.refreshToken)
			authAttemptsTotal.inc({ type: 'refresh', status: 'failed' })
			throw new UnauthorizedError('Refresh token expired')
		}

		const user = await this.userRepository.findById(refreshToken.getUserId())
		if (!user) {
			throw new NotFoundError('User', refreshToken.getUserId().getValue())
		}

		const accessToken = await this.jwtPort.generateAccessToken({
			userId: user.getId(),
			username: user.getUsername(),
		})

		if (this.tokenBlacklistPort) {
			await this.tokenBlacklistPort.trackUserToken(user.getId().getValue(), accessToken)
		}

		authAttemptsTotal.inc({ type: 'refresh', status: 'success' })

		return {
			accessToken,
		}
	}
}
