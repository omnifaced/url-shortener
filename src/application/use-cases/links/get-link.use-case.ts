import type { LinkOwnershipService } from '../../services'
import type { LinkResponseDto } from '../../dto'

export class GetLinkUseCase {
	constructor(private readonly linkOwnershipService: LinkOwnershipService) {}

	public async execute(userId: number, linkId: number): Promise<LinkResponseDto> {
		const link = await this.linkOwnershipService.validateAndGetLink(userId, linkId)

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
