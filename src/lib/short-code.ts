import * as crypto from 'node:crypto'

const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const CODE_LENGTH = 6

export function generateShortCode(): string {
	const bytes = crypto.randomBytes(CODE_LENGTH)
	let code = ''

	for (const byte of bytes) {
		code += CHARACTERS[byte % CHARACTERS.length]
	}

	return code
}
