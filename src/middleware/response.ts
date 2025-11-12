import type { Context, Next } from 'hono'

export async function responseMiddleware(c: Context, next: Next) {
	await next()

	if (c.res.status >= 300 && c.res.status < 400) {
		return
	}

	const contentType = c.res.headers.get('content-type')

	if (!contentType?.includes('application/json')) {
		return
	}

	const clonedResponse = c.res.clone()
	const originalJson = await clonedResponse.json()

	if ('error' in originalJson && !('success' in originalJson)) {
		c.res = new Response(
			JSON.stringify({
				success: false,
				...originalJson,
			}),
			{
				status: c.res.status,
				headers: c.res.headers,
			}
		)
		return
	}

	if (!('success' in originalJson) && !('error' in originalJson)) {
		c.res = new Response(
			JSON.stringify({
				success: true,
				data: originalJson,
			}),
			{
				status: c.res.status,
				headers: c.res.headers,
			}
		)
	}
}
