import { loginRoute, logoutAllRoute, logoutRoute, refreshRoute, registerRoute } from '../../openapi'
import { createAuthMiddleware, responseMiddleware } from '../middleware'
import { validationErrorWrapperHook } from '../hooks'
import { OpenAPIHono } from '@hono/zod-openapi'
import { HTTP_STATUS } from '../../../shared'
import type { Container } from '../../../di'

type Variables = {
	userId: number
	username: string
}

const ACCESS_TOKEN_TTL = 60 * 60

export function createAuthController(container: Container): OpenAPIHono {
	const router = new OpenAPIHono({
		defaultHook: validationErrorWrapperHook,
	})

	router.use('*', responseMiddleware)

	router.openapi(registerRoute, async (c) => {
		const data = c.req.valid('json')
		const userAgent = c.req.header('user-agent')
		const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')

		const result = await container.registerUseCase.execute(data, userAgent, ip)

		return c.json({ success: true, data: result }, HTTP_STATUS.CREATED)
	})

	router.openapi(loginRoute, async (c) => {
		const data = c.req.valid('json')
		const userAgent = c.req.header('user-agent')
		const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')

		const result = await container.loginUseCase.execute(data, userAgent, ip)

		return c.json({ success: true, data: result }, HTTP_STATUS.OK)
	})

	router.openapi(refreshRoute, async (c) => {
		const data = c.req.valid('json')

		const result = await container.refreshUseCase.execute(data)

		return c.json({ success: true, data: result }, HTTP_STATUS.OK)
	})

	const authenticatedRouter = new OpenAPIHono<{ Variables: Variables }>({
		defaultHook: validationErrorWrapperHook,
	})
	const authMiddleware = createAuthMiddleware(container.jwtPort, container.tokenBlacklistPort)

	authenticatedRouter.use('/*', authMiddleware)

	authenticatedRouter.openapi(logoutRoute, async (c) => {
		const data = c.req.valid('json')

		const authHeader = c.req.header('Authorization')
		const accessToken = authHeader?.substring(7)

		await container.logoutUseCase.execute(data, accessToken, ACCESS_TOKEN_TTL)

		return c.json({ success: true, data: { message: 'Logged out successfully' } }, HTTP_STATUS.OK)
	})

	authenticatedRouter.openapi(logoutAllRoute, async (c) => {
		const userId = c.get('userId')

		if (container.logoutAllUseCase) {
			await container.logoutAllUseCase.execute(userId)
		}

		return c.json({ success: true, data: { message: 'All sessions terminated successfully' } }, HTTP_STATUS.OK)
	})

	router.route('/', authenticatedRouter)

	return router
}
