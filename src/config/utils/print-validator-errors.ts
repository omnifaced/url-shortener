import { getValidationErrorMessage } from './get-validation-error-message'
import type { ConsolaInstance } from 'consola'
import type { ErrorObject } from 'ajv'

export function printValidatorErrors(errors: ErrorObject[], filePath: string, logger: ConsolaInstance) {
	const errorsMessages = errors?.map((error) => getValidationErrorMessage(error, filePath)) || []

	if (errorsMessages.length > 0) {
		logger.error(`Configuration validation failed for: ${filePath}`)

		for (const errorMessage of errorsMessages) {
			logger.warn(errorMessage)
		}

		logger.error(`Found ${errorsMessages.length} validation error(s)`)
	}
}
