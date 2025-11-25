import type { RefreshToken } from '../entities'
import type { Id } from '../value-objects'

export interface RefreshTokenRepository {
	save(token: RefreshToken): Promise<RefreshToken>
	findByToken(token: string): Promise<RefreshToken | null>
	deleteByToken(token: string): Promise<void>
	deleteByUserId(userId: Id): Promise<void>
	deleteExpired(): Promise<void>
}
