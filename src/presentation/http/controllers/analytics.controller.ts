import { createAuthMiddleware, responseMiddleware } from '../middleware'
import { linkStatsRoute, overviewRoute } from '../../openapi'
import { validationErrorWrapperHook } from '../hooks'
import { OpenAPIHono } from '@hono/zod-openapi'
import { HTTP_STATUS } from '../../../shared'
import type { Container } from '../../../di'

type Variables = {
	userId: number
	username: string
}

export function createAnalyticsController(container: Container): OpenAPIHono<{ Variables: Variables }> {
	const router = new OpenAPIHono<{ Variables: Variables }>({
		defaultHook: validationErrorWrapperHook,
	})
	const authMiddleware = createAuthMiddleware(container.jwtPort, container.tokenBlacklistPort)

	router.use('/*', authMiddleware)
	router.use('*', responseMiddleware)

	router.openapi(overviewRoute, async (c) => {
		const userId = c.get('userId')

		const result = await container.getOverviewUseCase.execute(userId)

		return c.json({ success: true, data: result }, HTTP_STATUS.OK)
	})

	router.openapi(linkStatsRoute, async (c) => {
		const { id } = c.req.valid('param')
		const userId = c.get('userId')

		const result = await container.getLinkStatsUseCase.execute(userId, id)

		return c.json({ success: true, data: result }, HTTP_STATUS.OK)
	})

	return router
}
