import { Id, type LinkRepository, type ClickRepository } from '../../../domain'
import type { OverviewResponseDto } from '../../dto'

export class GetOverviewUseCase {
	constructor(
		private readonly linkRepository: LinkRepository,
		private readonly clickRepository: ClickRepository
	) {}

	public async execute(userId: number): Promise<OverviewResponseDto> {
		const userIdValue = Id.create(userId)

		const [totalLinks, totalClicks, links, clickCounts] = await Promise.all([
			this.linkRepository.countByUserId(userIdValue),
			this.clickRepository.countByUserId(userIdValue),
			this.linkRepository.findByUserId(userIdValue, { limit: 100 }),
			this.clickRepository.getClickCountsByUserId(userIdValue),
		])

		const clickCountMap = new Map(clickCounts.map((item) => [item.linkId.getValue(), item.count]))

		const linksWithClicks = links.map((link) => ({
			id: link.getId().getValue(),
			originalUrl: link.getOriginalUrl().getValue(),
			shortCode: link.getShortCode().getValue(),
			title: link.getTitle(),
			clickCount: clickCountMap.get(link.getId().getValue()) || 0,
		}))

		const topLinks = linksWithClicks.sort((a, b) => b.clickCount - a.clickCount).slice(0, 10)

		return {
			totalLinks,
			totalClicks,
			topLinks,
		}
	}
}
