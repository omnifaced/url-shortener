import { createServerAdapter, startCleanupJob, stopCleanupJob, MetricsUpdateService } from './infrastructure'
import { loadConfig, logger } from './shared'
import { createApp } from './presentation'
import { createContainer } from './di'

const config = loadConfig()

const container = await createContainer(config)

const app = createApp(container)

if (container.cleanupJob) {
	startCleanupJob(container.cleanupJob)
}

const metricsUpdateService = new MetricsUpdateService(container.database)

await metricsUpdateService.updateGauges().catch((error) => {
	logger.error('Failed to update metrics gauges', error)
})

const server = createServerAdapter(
	app,
	config.app.port,
	config.app.host,
	config.certificates.cert_path,
	config.certificates.key_path
)

const gracefulShutdown = async (signal: string) => {
	logger.warn(`Received ${signal}, starting graceful shutdown`)

	try {
		if (container.cleanupJob) {
			logger.info('Stopping cron job')
			stopCleanupJob(container.cleanupJob)
		}

		if (container.redis) {
			logger.info('Closing Redis connection')
			await container.redis.quit()
		}

		server.close(() => {
			logger.success('Graceful shutdown completed')
			process.exit(0)
		})

		setTimeout(() => {
			logger.error('Forced shutdown')
			process.exit(1)
		}, 10000)
	} catch (error) {
		logger.error('Error during shutdown', error)
		process.exit(1)
	}
}

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
