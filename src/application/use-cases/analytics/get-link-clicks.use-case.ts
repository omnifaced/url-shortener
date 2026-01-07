import type { LinkClicksQueryDto, LinkClicksResponseDto } from '../../dto'
import type { LinkOwnershipService } from '../../services'
import type { ClickRepository } from '../../../domain'

export class GetLinkClicksUseCase {
	constructor(
		private readonly linkOwnershipService: LinkOwnershipService,
		private readonly clickRepository: ClickRepository
	) {}

	public async execute(userId: number, linkId: number, query: LinkClicksQueryDto): Promise<LinkClicksResponseDto> {
		const link = await this.linkOwnershipService.validateAndGetLink(userId, linkId)

		const { type, page, limit } = query
		const offset = (page - 1) * limit

		if (type === 'recent') {
			const result = await this.clickRepository.findByLinkIdPaginated(link.getId(), limit, offset)

			return {
				type: 'recent',
				clicks: result.items.map((click) => ({
					id: click.getId().getValue(),
					clickedAt: click.getClickedAt().toISOString(),
					ip: click.getIp(),
					userAgent: click.getUserAgent(),
					referer: click.getReferer(),
				})),
				pagination: {
					page,
					limit,
					total: result.total,
					totalPages: Math.ceil(result.total / limit),
				},
			}
		}

		const result = await this.clickRepository.getTopReferersPaginated(link.getId(), limit, offset)

		return {
			type: 'referers',
			referers: result.items,
			pagination: {
				page,
				limit,
				total: result.total,
				totalPages: Math.ceil(result.total / limit),
			},
		}
	}
}
