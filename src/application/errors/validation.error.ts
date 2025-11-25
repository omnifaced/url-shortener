import { ApplicationError } from './base.error'

export class ValidationError extends ApplicationError {
	constructor(message: string) {
		super(message, 'VALIDATION_ERROR')
	}
}
