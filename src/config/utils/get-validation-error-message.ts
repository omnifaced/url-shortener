import type { ErrorObject } from 'ajv'

export function getValidationErrorMessage(error: ErrorObject, filePath: string) {
	const keyPath = `${error.instancePath}/${error.params.missingProperty}`

	switch (error.keyword) {
		case 'required':
			return `Missing required field '${keyPath}' in ${filePath}`
		case 'type':
			return `Field '${keyPath}' in ${filePath} must be of type ${error.params.type}, but found ${typeof error.data}`
		case 'additionalProperties':
			return `Field '${keyPath}' in ${filePath} contains additional properties not allowed by the schema`
		case 'enum':
			return `Field '${keyPath}' in ${filePath} must be one of: ${error.params.allowedValues.join(', ')}`
		case 'pattern':
			return `Field '${keyPath}' in ${filePath} does not match the required pattern '${error.params.pattern}'`
		case 'minimum':
			return `Field '${keyPath}' in ${filePath} must be greater than or equal to ${error.params.limit}`
		case 'maximum':
			return `Field '${keyPath}' in ${filePath} must be less than or equal to ${error.params.limit}`
		default:
			return `Invalid value for field '${keyPath}' in ${filePath}: ${error.message || 'Unknown error'}`
	}
}
