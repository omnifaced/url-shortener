import { linkExpirationTotal, tokenExpirationTotal, logger } from '../../shared'
import type { LinkRepository, RefreshTokenRepository } from '../../domain'

export class CleanupService {
	constructor(
		private readonly linkRepository: LinkRepository,
		private readonly refreshTokenRepository: RefreshTokenRepository
	) {}

	public async cleanupExpiredLinks(): Promise<number> {
		const expiredLinks = await this.linkRepository.findExpiredLinks()

		for (const link of expiredLinks) {
			await this.linkRepository.delete(link.getId())
		}

		linkExpirationTotal.inc(expiredLinks.length)

		return expiredLinks.length
	}

	public async cleanupExpiredTokens(): Promise<number> {
		await this.refreshTokenRepository.deleteExpired()

		tokenExpirationTotal.inc(1)

		return 1
	}

	public async runCleanup(): Promise<{
		deletedLinks: number
		deletedTokens: number
	}> {
		logger.start('Running cleanup job...')

		try {
			const [deletedLinks, deletedTokens] = await Promise.all([
				this.cleanupExpiredLinks(),
				this.cleanupExpiredTokens(),
			])

			if (deletedLinks > 0 || deletedTokens > 0) {
				logger.success('Cleanup completed', {
					deletedLinks,
					deletedTokens,
				})
			} else {
				logger.info('Cleanup completed - no expired items found')
			}

			return { deletedLinks, deletedTokens }
		} catch (error) {
			logger.error('Cleanup job failed', error)
			throw error
		}
	}
}
