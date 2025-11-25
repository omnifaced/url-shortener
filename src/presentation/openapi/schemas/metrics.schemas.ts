import { createRoute } from '@hono/zod-openapi'
import { HTTP_STATUS } from '../../../shared'
import { z } from 'zod'

export const metricsRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Metrics'],
	responses: {
		[HTTP_STATUS.OK]: {
			content: {
				'text/plain': {
					schema: z.string().openapi({
						description: 'Prometheus metrics in text format',
						example: '# HELP url_shortener_http_requests_total Total number of HTTP requests',
					}),
				},
			},
			description: 'Prometheus metrics',
		},
	},
})
