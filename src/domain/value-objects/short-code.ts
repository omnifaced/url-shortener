import { randomBytes } from 'node:crypto'

const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export class ShortCode {
	private static length = 6
	private static maxLength = 10

	private constructor(private readonly value: string) {
		if (value.length === 0 || value.length > ShortCode.maxLength) {
			throw new Error(`Short code must be between 1 and ${ShortCode.maxLength} characters`)
		}
	}

	public static configure(length: number, maxLength: number): void {
		ShortCode.length = length
		ShortCode.maxLength = maxLength
	}

	public static create(value: string): ShortCode {
		return new ShortCode(value)
	}

	public static generate(): ShortCode {
		const bytes = randomBytes(ShortCode.length)
		let code = ''

		for (const byte of bytes) {
			code += CHARACTERS[byte % CHARACTERS.length]
		}

		return new ShortCode(code)
	}

	public getValue(): string {
		return this.value
	}
}
