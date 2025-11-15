import { cleanupExpiredLinks, cleanupExpiredTokens, logger } from '../lib'
import { CronJob } from 'cron'

export const cleanupJob = new CronJob('0 * * * *', async () => {
	logger.start('Running cleanup job...')

	try {
		const [deletedLinks, deletedTokens] = await Promise.all([cleanupExpiredLinks(), cleanupExpiredTokens()])

		if (deletedLinks > 0 || deletedTokens > 0) {
			logger.success('Cleanup completed', {
				deletedLinks,
				deletedTokens,
			})
		} else {
			logger.info('Cleanup completed - no expired items found')
		}
	} catch (error) {
		logger.error('Cleanup job failed', error)
	}
})

export function startCleanupJob(): void {
	cleanupJob.start()
	logger.info('Cleanup job scheduled (runs every hour at :00)')
}

export function stopCleanupJob(): void {
	cleanupJob.stop()
}
