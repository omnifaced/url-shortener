import { NotFoundError, ForbiddenError } from '../../errors'
import { Id, type LinkRepository } from '../../../domain'

export class DeleteLinkUseCase {
	constructor(private readonly linkRepository: LinkRepository) {}

	public async execute(userId: number, linkId: number): Promise<void> {
		const linkIdValue = Id.create(linkId)
		const userIdValue = Id.create(userId)

		const link = await this.linkRepository.findById(linkIdValue)
		if (!link) {
			throw new NotFoundError('Link', linkId)
		}

		if (link.getUserId().getValue() !== userIdValue.getValue()) {
			throw new ForbiddenError('You do not have permission to delete this link')
		}

		await this.linkRepository.delete(linkIdValue)
	}
}
