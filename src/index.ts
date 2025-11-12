import { analyticsRouter, authRouter, linksRouter, redirectRouter } from './routes'
import { cleanupExpiredLinks, cleanupExpiredTokens, logger, redis } from './lib'
import { traceMiddleware, structuredLogger } from './middleware'
import { serveStatic } from '@hono/node-server/serve-static'
import { HTTPException } from 'hono/http-exception'
import { existsSync, readFileSync } from 'node:fs'
import { OpenAPIHono } from '@hono/zod-openapi'
import { createSecureServer } from 'node:http2'
import { swaggerUI } from '@hono/swagger-ui'
import { serve } from '@hono/node-server'
import { compress } from 'hono/compress'
import { landingPage } from './views'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { CronJob } from 'cron'

const app = new OpenAPIHono()

app.use('*', traceMiddleware)
app.use('*', structuredLogger)
app.use('*', cors())

app.use('/api/*', csrf({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173' }))
app.use('/api/docs', compress())
app.use('/api/doc', compress())

app.use('/favicon.ico', serveStatic({ path: './assets/favicon.ico' }))

app.doc('/api/doc', {
	openapi: '3.1.0',
	info: {
		title: 'URL Shortener API',
		version: '1.0.0',
		description: 'API for shortening URLs with authentication and analytics',
	},
	servers: [
		{
			url: 'http://localhost:3000',
			description: 'Local development server',
		},
	],
})

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
	type: 'http',
	scheme: 'bearer',
	bearerFormat: 'JWT',
	description: 'Enter your access token from login/register response',
})

app.get('/api/docs', swaggerUI({ url: '/api/doc' }))

app.get('/', (c) => {
	return c.html(landingPage())
})

app.route('/api/auth', authRouter)
app.route('/api/links', linksRouter)
app.route('/api/analytics', analyticsRouter)
app.route('/', redirectRouter)

app.onError((error, c) => {
	if (error instanceof HTTPException) {
		const errorObject: Record<string, unknown> = {
			message: error.message,
		}

		if (error.cause) {
			errorObject.details = error.cause
		}

		return c.json(
			{
				success: false,
				error: {
					message: error.message,
					...(error?.cause ? { details: error.cause } : {}),
				},
			},
			error.status
		)
	}

	return c.json(
		{
			success: false,
			error: {
				message: 'Internal server error',
			},
		},
		500
	)
})

const port = Number(process.env.PORT) || 3000

const certPath = './certificates/cert.pem'
const keyPath = './certificates/key.pem'

const hasCertificates = existsSync(certPath) && existsSync(keyPath)

if (hasCertificates) {
	serve({
		fetch: app.fetch,
		createServer: createSecureServer,
		port,
		serverOptions: {
			key: readFileSync(keyPath),
			cert: readFileSync(certPath),
			allowHTTP1: true,
		},
	})

	logger.success(`Server is running on https://localhost:${port}`)
} else {
	serve({
		fetch: app.fetch,
		port,
	})

	logger.success(`Server is running on http://localhost:${port}`)
}

const cleanupJob = new CronJob('0 * * * *', async () => {
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

cleanupJob.start()
logger.info('Cleanup job scheduled (runs every hour at :00)')

async function gracefulShutdown(signal: string) {
	logger.warn(`Received ${signal}, starting graceful shutdown`)

	try {
		logger.info('Stopping cron job')
		cleanupJob.stop()

		logger.info('Closing Redis connection')
		await redis.quit()

		logger.success('Graceful shutdown completed')
		process.exit(0)
	} catch (error) {
		logger.error('Error during shutdown', { error })
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
