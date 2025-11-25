import { validationErrorWrapperHook } from '../hooks'
import { OpenAPIHono } from '@hono/zod-openapi'
import { redirectRoute } from '../../openapi'
import { HTTP_STATUS } from '../../../shared'
import type { Container } from '../../../di'

export function createRedirectController(container: Container): OpenAPIHono {
	const router = new OpenAPIHono({
		defaultHook: validationErrorWrapperHook,
	})

	router.openapi(redirectRoute, async (c) => {
		const { shortCode } = c.req.valid('param')
		const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
		const userAgent = c.req.header('user-agent')
		const referer = c.req.header('referer')

		const originalUrl = await container.redirectUseCase.execute(shortCode, ip, userAgent, referer)

		return c.redirect(originalUrl, HTTP_STATUS.FOUND)
	})

	return router
}
