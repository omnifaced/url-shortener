import { stopCleanupJob } from './cleanup-job'
import { logger, redis } from '../lib'

async function gracefulShutdown(signal: string): Promise<void> {
	logger.warn(`Received ${signal}, starting graceful shutdown`)

	try {
		logger.info('Stopping cron job')
		stopCleanupJob()

		logger.info('Closing Redis connection')
		await redis.quit()

		logger.success('Graceful shutdown completed')
		process.exit(0)
	} catch (error) {
		logger.error('Error during shutdown', error)
		process.exit(1)
	}
}

export function setupGracefulShutdown(): void {
	process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
	process.on('SIGINT', () => gracefulShutdown('SIGINT'))

	process.on('uncaughtException', (error) => {
		logger.error('Uncaught exception', {
			error: error.message,
			stack: error.stack,
		})

		void gracefulShutdown('uncaughtException')
	})

	process.on('unhandledRejection', (reason) => {
		logger.error('Unhandled rejection', {
			reason: reason instanceof Error ? reason.message : String(reason),
			stack: reason instanceof Error ? reason.stack : undefined,
		})

		void gracefulShutdown('unhandledRejection')
	})
}
