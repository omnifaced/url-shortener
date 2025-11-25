import { ApplicationError } from './base.error'

export class NotFoundError extends ApplicationError {
	constructor(resource: string, identifier?: string | number) {
		const message = identifier ? `${resource} with identifier '${identifier}' not found` : `${resource} not found`
		super(message, 'NOT_FOUND')
	}
}
