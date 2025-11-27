import * as assert from 'node:assert'

import { responseMiddleware } from './response.middleware'
import { describe, mock, test } from 'node:test'
import type { Context } from 'hono'

const createResponse = (status: number, body: unknown, contentType = 'application/json') => {
	const text = contentType === 'application/json' ? JSON.stringify(body) : String(body)

	return new Response(text, {
		status,
		headers: { 'content-type': contentType },
	})
}

const createContext = (res: Response) =>
	({
		res,
	}) as unknown as Context

const next = mock.fn(async () => {})

describe('responseMiddleware', () => {
	test('skips 3xx responses', async () => {
		const res = createResponse(302, {})
		const ctx = createContext(res)

		await responseMiddleware(ctx, next)

		assert.strictEqual(ctx.res.status, 302)
	})

	test('skips non-json', async () => {
		const res = createResponse(200, 'OK', 'text/plain')
		const ctx = createContext(res)

		await responseMiddleware(ctx, next)

		assert.strictEqual(await ctx.res.text(), 'OK')
	})

	test('skips if already has success', async () => {
		const res = createResponse(200, { success: true })
		const ctx = createContext(res)

		await responseMiddleware(ctx, next)

		assert.strictEqual((await ctx.res.json()).success, true)
	})

	test('wraps normal JSON into success:true', async () => {
		const res = createResponse(200, { user: 1 })
		const ctx = createContext(res)

		await responseMiddleware(ctx, next)

		assert.deepStrictEqual(await ctx.res.json(), {
			success: true,
			data: { user: 1 },
		})
	})

	test('wraps error JSON into success:false', async () => {
		const res = createResponse(400, { error: { message: 'Bad' } })
		const ctx = createContext(res)

		await responseMiddleware(ctx, next)

		assert.deepStrictEqual(await ctx.res.json(), {
			success: false,
			error: { message: 'Bad' },
		})
	})
})
