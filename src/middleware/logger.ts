import type { Context, Next } from 'hono'
import { logger } from '../lib'

export async function structuredLogger(c: Context, next: Next) {
	const start = Date.now()
	const { method, path } = c.req

	try {
		await next()

		const duration = Date.now() - start
		const status = c.res.status
		const auth = c.get('auth')

		const logData = {
			method,
			path,
			status,
			duration: `${duration}ms`,
			...(auth?.userId && { userId: auth.userId }),
		}

		if (status >= 500) {
			logger.error('Request failed', logData)
		} else if (status >= 400) {
			logger.warn('Request error', logData)
		} else {
			logger.info('Request', logData)
		}
	} catch (error) {
		const duration = Date.now() - start

		logger.error('Request error', {
			method,
			path,
			duration: `${duration}ms`,
			error: error instanceof Error ? error.message : String(error),
		})

		throw error
	}
}
