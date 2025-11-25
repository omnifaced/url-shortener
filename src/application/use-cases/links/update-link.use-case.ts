import type { UpdateLinkDto, LinkResponseDto } from '../../dto'
import { NotFoundError, ForbiddenError } from '../../errors'
import { Id, type LinkRepository } from '../../../domain'

export class UpdateLinkUseCase {
	constructor(private readonly linkRepository: LinkRepository) {}

	public async execute(userId: number, linkId: number, data: UpdateLinkDto): Promise<LinkResponseDto> {
		const linkIdValue = Id.create(linkId)
		const userIdValue = Id.create(userId)

		const link = await this.linkRepository.findById(linkIdValue)
		if (!link) {
			throw new NotFoundError('Link', linkId)
		}

		if (link.getUserId().getValue() !== userIdValue.getValue()) {
			throw new ForbiddenError('You do not have permission to update this link')
		}

		if (data.title !== undefined) {
			link.updateTitle(data.title)
		}

		if (data.isActive !== undefined) {
			if (data.isActive) {
				link.activate()
			} else {
				link.deactivate()
			}
		}

		await this.linkRepository.update(link)

		return {
			id: link.getId().getValue(),
			originalUrl: link.getOriginalUrl().getValue(),
			shortCode: link.getShortCode().getValue(),
			title: link.getTitle(),
			isActive: link.getIsActive(),
			createdAt: link.getCreatedAt().toISOString(),
			expiresAt: link.getExpiresAt()?.toISOString() ?? null,
		}
	}
}
