import type { MetricsUpdateService } from './metrics-update.service'
import type { CleanupService } from './cleanup.service'
import { logger } from '../../shared'
import { CronJob } from 'cron'

export function createCleanupJob(cleanupService: CleanupService, metricsUpdateService: MetricsUpdateService): CronJob {
	return new CronJob('0 * * * *', async () => {
		try {
			await Promise.all([cleanupService.runCleanup(), metricsUpdateService.updateGauges()])
		} catch (error) {
			logger.error('Cleanup job failed', error)
		}
	})
}

export function startCleanupJob(job: CronJob): void {
	job.start()
	logger.info('Cleanup job scheduled (runs every hour at :00)')
}

export function stopCleanupJob(job: CronJob): void {
	job.stop()
}
