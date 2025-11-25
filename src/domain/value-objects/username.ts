const MIN_LENGTH = 3
const MAX_LENGTH = 255

export class Username {
	private constructor(private readonly value: string) {
		if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) {
			throw new Error(`Username must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`)
		}
	}

	public static create(value: string): Username {
		return new Username(value)
	}

	public getValue(): string {
		return this.value
	}
}
