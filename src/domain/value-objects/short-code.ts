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
		const charsetLength = CHARACTERS.length;
		const maxValidByte = 256 - (256 % charsetLength);
		let code = '';

		while (code.length < ShortCode.length) {
			const byte = randomBytes(1)[0];
			if (byte < maxValidByte) {
				code += CHARACTERS[byte % charsetLength];
			}
		}

		return new ShortCode(code);
	}

	public getValue(): string {
		return this.value
	}
}
