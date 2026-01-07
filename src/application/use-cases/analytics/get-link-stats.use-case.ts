import type { LinkOwnershipService } from '../../services'
import type { ClickRepository } from '../../../domain'
import type { LinkStatsResponseDto } from '../../dto'

export class GetLinkStatsUseCase {
	constructor(
		private readonly linkOwnershipService: LinkOwnershipService,
		private readonly clickRepository: ClickRepository
	) {}

	public async execute(userId: number, linkId: number): Promise<LinkStatsResponseDto> {
		const link = await this.linkOwnershipService.validateAndGetLink(userId, linkId)

		const totalClicks = await this.clickRepository.countByLinkId(link.getId())

		return {
			link: {
				id: link.getId().getValue(),
				originalUrl: link.getOriginalUrl().getValue(),
				shortCode: link.getShortCode().getValue(),
				title: link.getTitle(),
				isActive: link.getIsActive(),
				createdAt: link.getCreatedAt().toISOString(),
				expiresAt: link.getExpiresAt()?.toISOString() ?? null,
			},
			totalClicks,
		}
	}
}
