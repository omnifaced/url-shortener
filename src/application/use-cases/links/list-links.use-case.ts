import type { ListLinksQueryDto, ListLinksResponseDto } from '../../dto'
import { Id, type LinkRepository } from '../../../domain'

export class ListLinksUseCase {
	constructor(private readonly linkRepository: LinkRepository) {}

	public async execute(userId: number, query: ListLinksQueryDto): Promise<ListLinksResponseDto> {
		const userIdValue = Id.create(userId)
		const offset = (query.page - 1) * query.limit

		const links = await this.linkRepository.findByUserId(userIdValue, {
			limit: query.limit,
			offset,
		})

		const total = await this.linkRepository.countByUserId(userIdValue)
		const totalPages = Math.ceil(total / query.limit)

		return {
			links: links.map((link) => ({
				id: link.getId().getValue(),
				originalUrl: link.getOriginalUrl().getValue(),
				shortCode: link.getShortCode().getValue(),
				title: link.getTitle(),
				isActive: link.getIsActive(),
				createdAt: link.getCreatedAt().toISOString(),
				expiresAt: link.getExpiresAt()?.toISOString() ?? null,
			})),
			pagination: {
				page: query.page,
				limit: query.limit,
				total,
				totalPages,
			},
		}
	}
}
