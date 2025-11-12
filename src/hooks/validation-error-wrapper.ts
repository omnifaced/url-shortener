import type { $ZodIssue } from 'zod/v4/core'
import type { Context } from 'hono'
import { ZodError } from 'zod'

export const validationErrorWrapperHook = async (result: Record<string, unknown>, context: Context) => {
	if (!result.success && result.error instanceof ZodError) {
		let details: $ZodIssue | null = null

		for (const issue of result.error.issues) {
			details = issue
		}

		return context.json(
			{
				success: false,
				error: {
					message: 'Validation error',
					details,
				},
			},
			400
		)
	}
}
