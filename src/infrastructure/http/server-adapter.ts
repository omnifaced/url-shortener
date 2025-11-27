/* node:coverage disable */

import { hasCertificates, getCertificatePaths, logger } from '../../shared'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { createSecureServer } from 'node:http2'
import { serve } from '@hono/node-server'
import { readFileSync } from 'node:fs'

export function createServerAdapter(
	app: OpenAPIHono,
	port: number,
	hostname: string,
	certPath: string,
	keyPath: string
) {
	const useHttps = hasCertificates(certPath, keyPath)

	if (useHttps) {
		const { cert, key } = getCertificatePaths(certPath, keyPath)

		return serve(
			{
				fetch: app.fetch,
				createServer: createSecureServer,
				port,
				hostname,
				serverOptions: {
					key: readFileSync(key),
					cert: readFileSync(cert),
					allowHTTP1: true,
				},
			},
			(info) => {
				logger.success(`Server is running on https://${info.address}:${info.port}`)
			}
		)
	}

	return serve(
		{
			fetch: app.fetch,
			port,
			hostname,
		},
		(info) => {
			logger.success(`Server is running on http://${info.address}:${info.port}`)
		}
	)
}

/* node:coverage enable */
