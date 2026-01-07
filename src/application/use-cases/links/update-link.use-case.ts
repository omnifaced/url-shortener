import type { UpdateLinkDto, LinkResponseDto } from '../../dto'
import type { LinkOwnershipService } from '../../services'
import type { LinkRepository } from '../../../domain'

export class UpdateLinkUseCase {
	constructor(
		private readonly linkOwnershipService: LinkOwnershipService,
		private readonly linkRepository: LinkRepository
	) {}

	public async execute(userId: number, linkId: number, data: UpdateLinkDto): Promise<LinkResponseDto> {
		const link = await this.linkOwnershipService.validateAndGetLink(userId, linkId)

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
