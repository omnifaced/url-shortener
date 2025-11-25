import { ApplicationError } from './base.error'

export class UnauthorizedError extends ApplicationError {
	constructor(message = 'Unauthorized') {
		super(message, 'UNAUTHORIZED')
	}
}
