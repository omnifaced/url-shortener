import type { OpenAPIHono } from '@hono/zod-openapi'
import { existsSync, readFileSync } from 'node:fs'
import { createSecureServer } from 'node:http2'
import { serve } from '@hono/node-server'
import { logger } from '../lib'

const certPath = './certificates/cert.pem'
const keyPath = './certificates/key.pem'

const hasCertificates = existsSync(certPath) && existsSync(keyPath)

export function startServer(app: OpenAPIHono, port: number): void {
	if (hasCertificates) {
		serve({
			fetch: app.fetch,
			createServer: createSecureServer,
			port,
			serverOptions: {
				key: readFileSync(keyPath),
				cert: readFileSync(certPath),
				allowHTTP1: true,
			},
		})

		logger.success(`Server is running on https://localhost:${port}`)
	} else {
		serve({
			fetch: app.fetch,
			port,
		})

		logger.success(`Server is running on http://localhost:${port}`)
	}
}

export function hasCerts(): boolean {
	return hasCertificates
}
