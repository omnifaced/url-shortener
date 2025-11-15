import { HTTPException } from 'hono/http-exception'
import type { ErrorHandler, Context } from 'hono'

export const errorHandler: ErrorHandler = (error, c: Context) => {
	if (error instanceof HTTPException) {
		return c.json(
			{
				success: false,
				error: {
					message: error.message,
					...(error?.cause ? { details: error.cause } : {}),
				},
			},
			error.status
		)
	}

	return c.json(
		{
			success: false,
			error: {
				message: 'Internal server error',
			},
		},
		500
	)
}
