import { readdirSync, openSync, fstatSync, readFileSync, existsSync, closeSync } from 'node:fs'
import { getRelativePath, printValidatorErrors } from './utils'
import { createContext, runInContext } from 'node:vm'
import { parseDocument } from 'yaml'
import { consola } from 'consola'
import { join } from 'node:path'
import { Ajv } from 'ajv'

interface PureConfigOptions {
	configsDirPath: string
	configsSchemaDirPath: string
}

class PureConfig<T = Record<string, unknown>> {
	private readonly logger = consola
	private readonly ajv: Ajv

	constructor(private readonly options: PureConfigOptions) {
		this.ajv = new Ajv()
	}

	public load(): T {
		return this.loadAndValidateFiles(this.options.configsDirPath, this.options.configsSchemaDirPath) as T
	}

	private loadAndValidateFiles(dirPath: string, schemaDirPath = '') {
		const isDirPathExists = existsSync(dirPath)

		if (!isDirPathExists) {
			this.logger.error(`Configuration directory not found: "${getRelativePath(dirPath)}"`)

			process.exit(1)
		}

		/* node:coverage disable */

		const filesPaths = readdirSync(dirPath)
		const result: Record<string, unknown> = {}

		for (const filePath of filesPaths) {
			const fileFullPath = join(dirPath, filePath)

			let fd: number | undefined

			try {
				fd = openSync(fileFullPath, 'r')

				if (fstatSync(fd).isDirectory()) {
					closeSync(fd)
					continue
				}

				if (filePath.endsWith('.example')) {
					closeSync(fd)
					continue
				}

				const fileContent = readFileSync(fd, 'utf-8')

				/* node:coverage enable */

				closeSync(fd)
				fd = undefined

				const fileParsed = parseDocument(fileContent)
				const fileSchemaPath = join(schemaDirPath, filePath)

				let fileSchemaContent: string
				try {
					fileSchemaContent = readFileSync(fileSchemaPath, 'utf-8')
				} catch (error) {
					this.logger.error(
						`Schema file not found or cannot be read: "${getRelativePath(fileSchemaPath)}:"`,
						error instanceof Error ? error.message : JSON.stringify(error, null, 2)
					)

					process.exit(1)
				}

				const fileSchemaParsed = parseDocument(fileSchemaContent)

				try {
					const validate = this.ajv.compile(fileSchemaParsed.toJSON())
					const fileKey = filePath.replace(/\.[^/.]+$/, '')

					const requiredFields = this.getRequiredFields(fileSchemaParsed.toJSON())

					result[fileKey] = this.resolveReferences(fileParsed.toJSON(), filePath, requiredFields)

					if (!validate(result[fileKey])) {
						printValidatorErrors(validate.errors || [], getRelativePath(fileFullPath), this.logger)

						process.exit(1)
					}
				} catch (error) {
					this.logger.error(
						`Failed to load or parse schema: "${getRelativePath(fileSchemaPath)}":`,
						error instanceof Error ? error.message : JSON.stringify(error, null, 2)
					)

					process.exit(1)
				}
			} catch (error) {
				if (fd !== undefined) {
					closeSync(fd)
				}

				this.logger.error(
					`Failed to read config file: "${getRelativePath(fileFullPath)}":`,
					error instanceof Error ? error.message : JSON.stringify(error, null, 2)
				)

				process.exit(1)
			}
		}

		return result
	}

	private getRequiredFields(schema: Record<string, unknown>): string[] {
		if (typeof schema !== 'object' || schema === null) {
			return []
		}

		const required = Array.isArray(schema.required) ? schema.required : []
		const properties = schema.properties || {}

		for (const [key, value] of Object.entries(properties)) {
			if (typeof value === 'object' && value !== null) {
				const nestedRequired = this.getRequiredFields(value)

				nestedRequired.forEach((nestedKey) => {
					required.push(`${key}.${nestedKey}`)
				})
			}
		}

		return required
	}

	private resolveReferences(
		object: Record<string, unknown>,
		filePath: string,
		requiredFields: string[] = [],
		path = ''
	) {
		const resolvedObject: Record<string, unknown> = {}

		const resolveValue = (key: string, value: unknown, currentKeyPath: string): unknown => {
			const keyPath = currentKeyPath ? `${currentKeyPath}.${key}` : key

			if (Array.isArray(value)) {
				return value.map((item, index) => {
					if (typeof item === 'object' && item !== null) {
						return this.resolveReferences(
							item as Record<string, unknown>,
							filePath,
							requiredFields,
							`${keyPath}[${index}]`
						)
					}

					return resolveValue(key, item, currentKeyPath)
				})
			}

			if (typeof value === 'string' && value.startsWith('=>')) {
				const expression = value.slice(2).trim()

				const isRequired = requiredFields.some((field) => field === keyPath || field.startsWith(`${keyPath}.`))

				return this.evaluateExpression(expression, resolvedObject, filePath, keyPath, isRequired)
			}

			if (typeof value === 'object' && value !== null) {
				return this.resolveReferences(value as Record<string, unknown>, filePath, requiredFields, keyPath)
			}

			return value
		}

		for (const [key, value] of Object.entries(object)) {
			resolvedObject[key] = resolveValue(key, value, path)
		}

		return resolvedObject
	}

	private evaluateExpression(
		expression: string,
		object: Record<string, unknown>,
		filePath: string,
		keyPath: string,
		isRequired = false
	) {
		const context = createContext({
			self: object,
			env: process.env,
		})

		try {
			const result = runInContext(expression, context)

			if (result === undefined && isRequired) {
				throw new Error(`Expression "${expression}" returned undefined`)
			}

			return result
		} catch (error) {
			if (
				!isRequired &&
				error &&
				typeof error === 'object' &&
				'message' in error &&
				typeof error.message === 'string' &&
				error.message.includes('is not defined')
			) {
				return undefined
			}

			this.logger.error(
				`Expression evaluation error for ${isRequired ? 'required field' : 'field'} '${filePath}/${keyPath}':`,
				error
			)

			process.exit(1)
		}
	}
}

export { PureConfig, type PureConfigOptions }
