import type { ListAnalyticsLinksQueryDto, ListAnalyticsLinksResponseDto } from '../../dto'
import { Id, type LinkRepository } from '../../../domain'

export class ListAnalyticsLinksUseCase {
	constructor(private readonly linkRepository: LinkRepository) {}

	public async execute(userId: number, query: ListAnalyticsLinksQueryDto): Promise<ListAnalyticsLinksResponseDto> {
		const userIdValue = Id.create(userId)
		const { sort, page, limit } = query

		const offset = (page - 1) * limit

		const [linksWithClicks, total, totalClicks] = await Promise.all([
			this.linkRepository.findByUserIdWithClickCount(userIdValue, sort, { limit, offset }),
			this.linkRepository.countByUserId(userIdValue),
			this.linkRepository.getTotalClicksByUserId(userIdValue),
		])

		return {
			type: sort,
			links: linksWithClicks.map((item) => ({
				id: item.link.getId().getValue(),
				originalUrl: item.link.getOriginalUrl().getValue(),
				shortCode: item.link.getShortCode().getValue(),
				title: item.link.getTitle(),
				clickCount: item.clickCount,
				createdAt: item.link.getCreatedAt().toISOString(),
			})),
			totalClicks,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		}
	}
}
