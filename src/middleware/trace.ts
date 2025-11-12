import { generateTraceId, withTrace } from '../lib'
import type { Context, Next } from 'hono'

export async function traceMiddleware(c: Context, next: Next) {
	const traceId = c.req.header('x-trace-id') || generateTraceId()

	c.header('x-trace-id', traceId)

	await withTrace(traceId, async () => {
		await next()
	})
}
