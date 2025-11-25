export class Id {
	private constructor(private readonly value: number | null) {
		if (value !== null && (!Number.isInteger(value) || value <= 0)) {
			throw new Error('ID must be a positive integer')
		}
	}

	public static create(value: number): Id {
		return new Id(value)
	}

	public static createNew(): Id {
		return new Id(null)
	}

	public getValue(): number {
		if (this.value === null) {
			throw new Error('Cannot get value of unsaved entity ID')
		}
		return this.value
	}
}
