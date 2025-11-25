import type { LinkRepository } from '../repositories'
import { ShortCode } from '../value-objects'

export class ShortCodeService {
	constructor(
		private readonly linkRepository: LinkRepository,
		private readonly maxAttempts: number
	) {}

	public async generateUniqueCode(): Promise<ShortCode> {
		for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
			const shortCode = ShortCode.generate()
			const existingLink = await this.linkRepository.findByShortCode(shortCode)

			if (!existingLink) {
				return shortCode
			}
		}

		throw new Error('Failed to generate unique short code after maximum attempts')
	}
}
