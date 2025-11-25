export abstract class ApplicationError extends Error {
	protected constructor(
		message: string,
		public readonly code: string
	) {
		super(message)
		this.name = this.constructor.name
		Error.captureStackTrace(this, this.constructor)
	}
}
