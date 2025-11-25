import { Username, RefreshToken, type UserRepository, type RefreshTokenRepository } from '../../../domain'
import type { PasswordPort, JwtPort, TokenBlacklistPort } from '../../ports'
import type { LoginDto, AuthResponseDto } from '../../dto'
import { authAttemptsTotal } from '../../../shared'
import { UnauthorizedError } from '../../errors'

export class LoginUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly refreshTokenRepository: RefreshTokenRepository,
		private readonly passwordPort: PasswordPort,
		private readonly jwtPort: JwtPort,
		private readonly refreshTokenTtl: number,
		private readonly tokenBlacklistPort?: TokenBlacklistPort
	) {}

	public async execute(data: LoginDto, userAgent?: string, ip?: string): Promise<AuthResponseDto> {
		const username = Username.create(data.username)

		const user = await this.userRepository.findByUsername(username)
		if (!user) {
			authAttemptsTotal.inc({ type: 'login', status: 'failed' })
			throw new UnauthorizedError('Invalid credentials')
		}

		const isPasswordValid = await this.passwordPort.verify(data.password, user.getPasswordHash())
		if (!isPasswordValid) {
			authAttemptsTotal.inc({ type: 'login', status: 'failed' })
			throw new UnauthorizedError('Invalid credentials')
		}

		const accessToken = await this.jwtPort.generateAccessToken({
			userId: user.getId(),
			username: user.getUsername(),
		})

		const refreshTokenValue = this.jwtPort.generateRefreshToken()
		const refreshTokenExpiresAt = new Date(Date.now() + this.refreshTokenTtl * 1000)

		const refreshToken = RefreshToken.createNew(
			user.getId(),
			refreshTokenValue,
			refreshTokenExpiresAt,
			userAgent,
			ip
		)

		await this.refreshTokenRepository.save(refreshToken)

		if (this.tokenBlacklistPort) {
			await this.tokenBlacklistPort.trackUserToken(user.getId().getValue(), accessToken)
		}

		authAttemptsTotal.inc({ type: 'login', status: 'success' })

		return {
			accessToken,
			refreshToken: refreshTokenValue,
			user: {
				id: user.getId().getValue(),
				username: user.getUsername().getValue(),
			},
		}
	}
}
