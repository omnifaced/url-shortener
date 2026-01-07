import { ApplicationError, TooManyRequestsError } from '../../../application'
import { getTraceId, HTTP_STATUS, logger } from '../../../shared'
import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import { ZodError } from 'zod'

function mapErrorCodeToHttpStatus(code: string): number {
	const statusMap: Record<string, number> = {
		VALIDATION_ERROR: HTTP_STATUS.BAD_REQUEST,
		UNAUTHORIZED: HTTP_STATUS.UNAUTHORIZED,
		FORBIDDEN: HTTP_STATUS.FORBIDDEN,
		NOT_FOUND: HTTP_STATUS.NOT_FOUND,
		CONFLICT: HTTP_STATUS.CONFLICT,
		TOO_MANY_REQUESTS: HTTP_STATUS.TOO_MANY_REQUESTS,
	}

	return statusMap[code] ?? HTTP_STATUS.INTERNAL_SERVER_ERROR
}

function mapHttpStatusToErrorCode(status: number): string {
	const statusMap: Record<number, string> = {
		[HTTP_STATUS.BAD_REQUEST]: 'Bad Request',
		[HTTP_STATUS.UNAUTHORIZED]: 'Unauthorized',
		[HTTP_STATUS.FORBIDDEN]: 'Forbidden',
		[HTTP_STATUS.NOT_FOUND]: 'Not Found',
		[HTTP_STATUS.CONFLICT]: 'Conflict',
		[HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too Many Requests',
		[HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
	}

	return statusMap[status] ?? 'Unknown error'
}

export async function errorHandler(err: Error, c: Context) {
	if (err instanceof HTTPException) {
		const code = mapHttpStatusToErrorCode(err.status)

		return c.json(
			{
				error: {
					code: code.toUpperCase().replace(/ /g, '_'),
					message: err.message || code,
				},
			},
			err.status as never
		)
	}

	if (err instanceof TooManyRequestsError) {
		if (err.retryAfter) {
			c.header('Retry-After', String(err.retryAfter))
		}

		return c.json(
			{
				error: {
					code: err.code,
					message: err.message,
					...(err.retryAfter && {
						details: {
							retryAfter: err.retryAfter,
						},
					}),
				},
			},
			HTTP_STATUS.TOO_MANY_REQUESTS
		)
	}

	if (err instanceof ApplicationError) {
		const statusCode = mapErrorCodeToHttpStatus(err.code)

		return c.json(
			{
				error: {
					code: err.code,
					message: err.message,
				},
			},
			statusCode as never
		)
	}

	if (err instanceof ZodError) {
		return c.json(
			{
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Validation error',
					details: {
						issues: err.issues,
					},
				},
			},
			HTTP_STATUS.BAD_REQUEST
		)
	}

	const traceId = getTraceId()

	logger.error('Unhandled error', {
		error: err.message,
		stack: err.stack,
		...(traceId && { traceId }),
	})

	return c.json(
		{
			error: {
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Internal server error',
				...(traceId && {
					details: {
						traceId,
					},
				}),
			},
		},
		HTTP_STATUS.INTERNAL_SERVER_ERROR
	)
}
