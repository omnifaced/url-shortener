import {
	type PasswordPort,
	type JwtPort,
	type TokenBlacklistPort,
	RegisterUseCase,
	LoginUseCase,
	RefreshUseCase,
	LogoutUseCase,
	LogoutAllUseCase,
} from '../../application'

import type { UserRepository, RefreshTokenRepository } from '../../domain'
import { PasswordAdapter, JwtAdapter } from '../../infrastructure'

export interface AuthModule {
	passwordPort: PasswordPort
	jwtPort: JwtPort

	registerUseCase: RegisterUseCase
	loginUseCase: LoginUseCase
	refreshUseCase: RefreshUseCase
	logoutUseCase: LogoutUseCase
	logoutAllUseCase?: LogoutAllUseCase
}

interface AuthModuleDeps {
	userRepository: UserRepository
	refreshTokenRepository: RefreshTokenRepository
	tokenBlacklistPort?: TokenBlacklistPort
	jwtSecret: string
	accessTokenTtl: number
	refreshTokenTtl: number
}

export function createAuthModule(deps: AuthModuleDeps): AuthModule {
	const { userRepository, refreshTokenRepository, tokenBlacklistPort, jwtSecret, accessTokenTtl, refreshTokenTtl } =
		deps

	const passwordPort = new PasswordAdapter()
	const jwtPort = new JwtAdapter(jwtSecret, accessTokenTtl)

	const registerUseCase = new RegisterUseCase(
		userRepository,
		refreshTokenRepository,
		passwordPort,
		jwtPort,
		refreshTokenTtl,
		tokenBlacklistPort
	)

	const loginUseCase = new LoginUseCase(
		userRepository,
		refreshTokenRepository,
		passwordPort,
		jwtPort,
		refreshTokenTtl,
		tokenBlacklistPort
	)

	const refreshUseCase = new RefreshUseCase(userRepository, refreshTokenRepository, jwtPort, tokenBlacklistPort)

	const logoutUseCase = new LogoutUseCase(refreshTokenRepository, tokenBlacklistPort)

	let logoutAllUseCase: LogoutAllUseCase | undefined

	if (tokenBlacklistPort) {
		logoutAllUseCase = new LogoutAllUseCase(refreshTokenRepository, tokenBlacklistPort)
	}

	return {
		passwordPort,
		jwtPort,
		registerUseCase,
		loginUseCase,
		refreshUseCase,
		logoutUseCase,
		logoutAllUseCase,
	}
}
