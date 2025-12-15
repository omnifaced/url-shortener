import { HTTP_STATUS } from '../../../shared'
import type { Context } from 'hono'
import { ZodError } from 'zod'

export const validationErrorWrapperHook = async (result: Record<string, unknown>, context: Context) => {
	if (!result.success && result.error instanceof ZodError) {
		const firstIssue = result.error.issues[0]

		return context.json(
			{
				success: false,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Validation error',
					details: firstIssue,
				},
			},
			HTTP_STATUS.BAD_REQUEST
		)
	}
}
