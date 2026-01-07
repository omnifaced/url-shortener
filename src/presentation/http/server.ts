import {
	createAnalyticsController,
	createAuthController,
	createLinksController,
	createMetricsController,
	createRedirectController,
} from './controllers'

import { createRateLimiter, errorHandler, structuredLogger, traceMiddleware, metricsMiddleware } from './middleware'
import { serveStatic } from '@hono/node-server/serve-static'
import { OpenAPIHono } from '@hono/zod-openapi'
import { hasCertificates } from '../../shared'
import { swaggerUI } from '@hono/swagger-ui'
import type { Container } from '../../di'
import { cors } from 'hono/cors'

export function createApp(container: Container): OpenAPIHono {
	const app = new OpenAPIHono()

	app.use('*', cors())
	app.use('*', traceMiddleware)
	app.use('*', metricsMiddleware)
	app.use('*', structuredLogger)
	app.use(
		'*',
		createRateLimiter({
			rateLimiterConfig: container.config.rate_limiter,
			redis: container.redis,
		})
	)

	app.use('/favicon.ico', serveStatic({ path: './assets/favicon.ico' }))

	app.doc('/api/doc', {
		openapi: '3.1.0',
		info: {
			title: 'URL Shortener API',
			version: '2.2.0',
			description: 'API for shortening URLs with authentication and analytics',
		},
		servers: [
			{
				url: `${hasCertificates(container.config.certificates.cert_path, container.config.certificates.key_path) ? 'https' : 'http'}://${container.config.app.host}:${container.config.app.port}`,
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

	const metricsController = createMetricsController()
	const authController = createAuthController(container)
	const linksController = createLinksController(container)
	const analyticsController = createAnalyticsController(container)
	const redirectController = createRedirectController(container)

	app.route('/api/metrics', metricsController)
	app.route('/api/auth', authController)
	app.route('/api/links', linksController)
	app.route('/api/analytics', analyticsController)
	app.route('/', redirectController)

	app.onError(errorHandler)

	return app
}
