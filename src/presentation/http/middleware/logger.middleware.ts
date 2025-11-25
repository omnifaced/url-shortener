import { HTTP_STATUS, logger, getTraceId } from '../../../shared'
import type { Context, Next } from 'hono'

export async function structuredLogger(c: Context, next: Next) {
	const start = Date.now()
	const { method, path } = c.req

	try {
		await next()

		const duration = Date.now() - start
		const status = c.res.status
		const userId = c.get('userId')
		const traceId = getTraceId()

		const logData = {
			method,
			path,
			status,
			duration: `${duration}ms`,
			...(userId && { userId }),
			...(traceId && { traceId }),
		}

		if (status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
			logger.error('Request failed', logData)
		} else if (status >= HTTP_STATUS.BAD_REQUEST) {
			logger.warn('Request error', logData)
		} else {
			logger.info('Request', logData)
		}
	} catch (error) {
		const duration = Date.now() - start
		const traceId = getTraceId()

		logger.error('Request error', {
			method,
			path,
			duration: `${duration}ms`,
			error: error instanceof Error ? error.message : String(error),
			...(traceId && { traceId }),
		})

		throw error
	}
}
