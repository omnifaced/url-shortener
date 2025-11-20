import { analyticsRouter, authRouter, linksRouter, redirectRouter } from '../routes'
import { traceMiddleware, structuredLogger } from '../middleware'
import { serveStatic } from '@hono/node-server/serve-static'
import { OpenAPIHono } from '@hono/zod-openapi'
import { rateLimiter } from 'hono-rate-limiter'
import { errorHandler } from './error-handler'
import { swaggerUI } from '@hono/swagger-ui'
import { hasCerts } from './start-server'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { redis } from '../lib'

const limiter = rateLimiter({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: 'draft-7',
	keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'anonymous',
	store: {
		async increment(key: string) {
			const current = await redis.incr(key)

			if (current === 1) {
				await redis.expire(key, Math.ceil(15 * 60))
			}

			return { totalHits: current, resetTime: new Date(Date.now() + 15 * 60 * 1000) }
		},
		async decrement(key: string) {
			await redis.decr(key)
		},
		async resetKey(key: string) {
			await redis.del(key)
		},
	},
})

export function createApp(): OpenAPIHono {
	const app = new OpenAPIHono()

	app.use('*', cors())
	app.use('*', traceMiddleware)
	app.use('*', structuredLogger)
	app.use('*', limiter)
	app.use('*', csrf())

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
				url: `${hasCerts() ? 'https' : 'http'}://localhost:3000`,
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

	app.route('/api/auth', authRouter)
	app.route('/api/links', linksRouter)
	app.route('/api/analytics', analyticsRouter)
	app.route('/', redirectRouter)

	app.onError(errorHandler)

	return app
}
