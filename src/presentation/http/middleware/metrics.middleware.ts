import { httpRequestDuration, httpRequestsTotal } from '../../../shared'
import type { Context, Next } from 'hono'

export async function metricsMiddleware(c: Context, next: Next) {
	const start = Date.now()
	const { method, path } = c.req

	try {
		await next()

		const duration = (Date.now() - start) / 1000
		const status = String(c.res.status)

		httpRequestsTotal.inc({ method, path, status })
		httpRequestDuration.observe({ method, path, status }, duration)
	} catch (error) {
		const duration = (Date.now() - start) / 1000
		const status = '400'

		httpRequestsTotal.inc({ method, path, status })
		httpRequestDuration.observe({ method, path, status }, duration)

		throw error
	}
}
