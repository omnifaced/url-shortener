import { Id, type Link, type LinkRepository } from '../../domain'
import { NotFoundError, ForbiddenError } from '../errors'

export class LinkOwnershipService {
	constructor(private readonly linkRepository: LinkRepository) {}

	public async validateAndGetLink(userId: number, linkId: number): Promise<Link> {
		const linkIdValue = Id.create(linkId)
		const userIdValue = Id.create(userId)

		const link = await this.linkRepository.findById(linkIdValue)

		if (!link) {
			throw new NotFoundError('Link', linkId)
		}

		if (link.getUserId().getValue() !== userIdValue.getValue()) {
			throw new ForbiddenError('You do not have permission to access this link')
		}

		return link
	}
}
