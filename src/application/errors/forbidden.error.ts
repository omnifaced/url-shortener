import { ApplicationError } from './base.error'

export class ForbiddenError extends ApplicationError {
	constructor(message = 'Forbidden') {
		super(message, 'FORBIDDEN')
	}
}
