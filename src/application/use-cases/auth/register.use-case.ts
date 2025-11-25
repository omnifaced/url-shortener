import { User, Username, RefreshToken, type UserRepository, type RefreshTokenRepository } from '../../../domain'
import type { PasswordPort, JwtPort, TokenBlacklistPort } from '../../ports'
import type { RegisterDto, AuthResponseDto } from '../../dto'
import { authAttemptsTotal } from '../../../shared'
import { ConflictError } from '../../errors'

export class RegisterUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly refreshTokenRepository: RefreshTokenRepository,
		private readonly passwordPort: PasswordPort,
		private readonly jwtPort: JwtPort,
		private readonly refreshTokenTtl: number,
		private readonly tokenBlacklistPort?: TokenBlacklistPort
	) {}

	public async execute(data: RegisterDto, userAgent?: string, ip?: string): Promise<AuthResponseDto> {
		const username = Username.create(data.username)

		const existingUser = await this.userRepository.findByUsername(username)
		if (existingUser) {
			authAttemptsTotal.inc({ type: 'register', status: 'failed' })
			throw new ConflictError('Username already exists')
		}

		const passwordHash = await this.passwordPort.hash(data.password)
		const user = User.createNew(username, passwordHash)
		const savedUser = await this.userRepository.save(user)

		const accessToken = await this.jwtPort.generateAccessToken({
			userId: savedUser.getId(),
			username: savedUser.getUsername(),
		})

		const refreshTokenValue = this.jwtPort.generateRefreshToken()
		const refreshTokenExpiresAt = new Date(Date.now() + this.refreshTokenTtl * 1000)

		const refreshToken = RefreshToken.createNew(
			savedUser.getId(),
			refreshTokenValue,
			refreshTokenExpiresAt,
			userAgent,
			ip
		)

		await this.refreshTokenRepository.save(refreshToken)

		if (this.tokenBlacklistPort) {
			await this.tokenBlacklistPort.trackUserToken(savedUser.getId().getValue(), accessToken)
		}

		authAttemptsTotal.inc({ type: 'register', status: 'success' })

		return {
			accessToken,
			refreshToken: refreshTokenValue,
			user: {
				id: savedUser.getId().getValue(),
				username: savedUser.getUsername().getValue(),
			},
		}
	}
}
