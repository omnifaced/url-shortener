import { Id, type LinkRepository, type ClickRepository } from '../../../domain'
import { NotFoundError, ForbiddenError } from '../../errors'
import type { LinkStatsResponseDto } from '../../dto'

export class GetLinkStatsUseCase {
	constructor(
		private readonly linkRepository: LinkRepository,
		private readonly clickRepository: ClickRepository
	) {}

	public async execute(userId: number, linkId: number): Promise<LinkStatsResponseDto> {
		const linkIdValue = Id.create(linkId)
		const userIdValue = Id.create(userId)

		const link = await this.linkRepository.findById(linkIdValue)

		if (!link) {
			throw new NotFoundError('Link', linkId)
		}

		if (link.getUserId().getValue() !== userIdValue.getValue()) {
			throw new ForbiddenError('You do not have permission to access this link')
		}

		const totalClicks = await this.clickRepository.countByLinkId(link.getId())
		const recentClicks = await this.clickRepository.findByLinkId(link.getId(), 10)
		const clicksByDate = await this.clickRepository.getClicksByDate(link.getId(), 30)
		const topReferers = await this.clickRepository.getTopReferers(link.getId(), 5)

		return {
			link: {
				id: link.getId().getValue(),
				originalUrl: link.getOriginalUrl().getValue(),
				shortCode: link.getShortCode().getValue(),
				title: link.getTitle(),
				createdAt: link.getCreatedAt().toISOString(),
			},
			totalClicks,
			recentClicks: recentClicks.map((click) => ({
				id: click.getId().getValue(),
				clickedAt: click.getClickedAt().toISOString(),
				ip: click.getIp(),
				userAgent: click.getUserAgent(),
				referer: click.getReferer(),
			})),
			clicksByDate,
			topReferers,
		}
	}
}
