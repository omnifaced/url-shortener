import { Id, type LinkRepository, type ClickRepository } from '../../../domain'
import type { LinkClicksQueryDto, LinkClicksResponseDto } from '../../dto'
import { NotFoundError, ForbiddenError } from '../../errors'

export class GetLinkClicksUseCase {
	constructor(
		private readonly linkRepository: LinkRepository,
		private readonly clickRepository: ClickRepository
	) {}

	public async execute(userId: number, linkId: number, query: LinkClicksQueryDto): Promise<LinkClicksResponseDto> {
		const linkIdValue = Id.create(linkId)
		const userIdValue = Id.create(userId)

		const link = await this.linkRepository.findById(linkIdValue)

		if (!link) {
			throw new NotFoundError('Link', linkId)
		}

		if (link.getUserId().getValue() !== userIdValue.getValue()) {
			throw new ForbiddenError('You do not have permission to access this link')
		}

		const { type, page, limit } = query
		const offset = (page - 1) * limit

		if (type === 'recent') {
			const result = await this.clickRepository.findByLinkIdPaginated(linkIdValue, limit, offset)

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

		const result = await this.clickRepository.getTopReferersPaginated(linkIdValue, limit, offset)

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
