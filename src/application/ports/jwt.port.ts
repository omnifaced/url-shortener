import type { Id, Username } from '../../domain'

export interface JwtPayload {
	userId: Id
	username: Username
}

export interface JwtPort {
	generateAccessToken(payload: JwtPayload): Promise<string>
	generateRefreshToken(): string
	verifyAccessToken(token: string): Promise<JwtPayload | null>
}
