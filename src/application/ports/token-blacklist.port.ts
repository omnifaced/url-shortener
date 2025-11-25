export interface TokenBlacklistPort {
	addToken(token: string, expiresInSeconds: number): Promise<void>
	isBlacklisted(token: string): Promise<boolean>
	addUserTokens(userId: number, expiresInSeconds: number): Promise<void>
	trackUserToken(userId: number, token: string): Promise<void>
	removeUserToken(userId: number, token: string): Promise<void>
}
