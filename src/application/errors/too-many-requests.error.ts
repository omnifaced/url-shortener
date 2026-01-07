import { ApplicationError } from './base.error'

export class TooManyRequestsError extends ApplicationError {
	constructor(
		message: string,
		public readonly retryAfter?: number
	) {
		super(message, 'TOO_MANY_REQUESTS')
	}
}
