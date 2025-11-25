import {
	createLinkRoute,
	deleteLinkRoute,
	getLinkRoute,
	getQrCodeRoute,
	listLinksRoute,
	updateLinkRoute,
} from '../../openapi'

import { createAuthMiddleware, responseMiddleware } from '../middleware'
import { validationErrorWrapperHook } from '../hooks'
import { OpenAPIHono } from '@hono/zod-openapi'
import { HTTP_STATUS } from '../../../shared'
import type { Container } from '../../../di'

type Variables = {
	userId: number
	username: string
}

export function createLinksController(container: Container): OpenAPIHono<{ Variables: Variables }> {
	const router = new OpenAPIHono<{ Variables: Variables }>({
		defaultHook: validationErrorWrapperHook,
	})
	const authMiddleware = createAuthMiddleware(container.jwtPort, container.tokenBlacklistPort)

	router.use('/*', authMiddleware)
	router.use('*', responseMiddleware)

	router.openapi(createLinkRoute, async (c) => {
		const data = c.req.valid('json')
		const userId = c.get('userId')

		const result = await container.createLinkUseCase.execute(userId, data)

		return c.json({ success: true, data: result }, HTTP_STATUS.CREATED)
	})

	router.openapi(listLinksRoute, async (c) => {
		const query = c.req.valid('query')
		const userId = c.get('userId')

		const result = await container.listLinksUseCase.execute(userId, query)

		return c.json({ success: true, data: result }, HTTP_STATUS.OK)
	})

	router.openapi(getLinkRoute, async (c) => {
		const { id } = c.req.valid('param')
		const userId = c.get('userId')

		const result = await container.getLinkUseCase.execute(userId, id)

		return c.json({ success: true, data: result }, HTTP_STATUS.OK)
	})

	router.openapi(updateLinkRoute, async (c) => {
		const { id } = c.req.valid('param')
		const data = c.req.valid('json')
		const userId = c.get('userId')

		const result = await container.updateLinkUseCase.execute(userId, id, data)

		return c.json({ success: true, data: result }, HTTP_STATUS.OK)
	})

	router.openapi(deleteLinkRoute, async (c) => {
		const { id } = c.req.valid('param')
		const userId = c.get('userId')

		await container.deleteLinkUseCase.execute(userId, id)

		return c.json({ success: true, data: { message: 'Link deleted successfully' } }, HTTP_STATUS.OK)
	})

	router.openapi(getQrCodeRoute, async (c) => {
		const { id } = c.req.valid('param')
		const query = c.req.valid('query')
		const userId = c.get('userId')

		const qrCode = await container.generateQrUseCase.execute(userId, id, query)

		const contentType = query.format === 'svg' ? 'image/svg+xml' : 'image/png'

		return new Response(new Uint8Array(qrCode), {
			status: HTTP_STATUS.OK,
			headers: {
				'Content-Type': contentType,
			},
		})
	})

	return router
}
