import { ApplicationError } from './base.error'

export class ConflictError extends ApplicationError {
	constructor(message: string) {
		super(message, 'CONFLICT')
	}
}
