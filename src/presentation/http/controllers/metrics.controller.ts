import { metricsRegistry } from '../../../shared'
import { OpenAPIHono } from '@hono/zod-openapi'
import { HTTP_STATUS } from '../../../shared'
import { metricsRoute } from '../../openapi'

export function createMetricsController(): OpenAPIHono {
	const router = new OpenAPIHono()

	router.openapi(metricsRoute, async (c) => {
		const metrics = await metricsRegistry.metrics()

		return c.text(metrics, HTTP_STATUS.OK, {
			'Content-Type': metricsRegistry.contentType,
		})
	})

	return router
}
