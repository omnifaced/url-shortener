export class Url {
	private constructor(private readonly value: string) {
		try {
			new URL(value)
		} catch {
			throw new Error('Invalid URL format')
		}
	}

	public static create(value: string): Url {
		return new Url(value)
	}

	public getValue(): string {
		return this.value
	}
}
