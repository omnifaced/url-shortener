import { Id, type LinkRepository, type ClickRepository } from '../../../domain'
import type { ClicksByDateQueryDto, ClicksByDateResponseDto } from '../../dto'
import { NotFoundError, ForbiddenError } from '../../errors'

export class GetClicksByDateUseCase {
	constructor(
		private readonly linkRepository: LinkRepository,
		private readonly clickRepository: ClickRepository
	) {}

	public async execute(
		userId: number,
		linkId: number,
		query: ClicksByDateQueryDto
	): Promise<ClicksByDateResponseDto> {
		const linkIdValue = Id.create(linkId)
		const userIdValue = Id.create(userId)

		const link = await this.linkRepository.findById(linkIdValue)

		if (!link) {
			throw new NotFoundError('Link', linkId)
		}

		if (link.getUserId().getValue() !== userIdValue.getValue()) {
			throw new ForbiddenError('You do not have permission to access this link')
		}

		const { days, page, limit } = query
		const offset = (page - 1) * limit

		const allClicksByDate = await this.clickRepository.getClicksByDate(link.getId(), days)

		const items = allClicksByDate.slice(offset, offset + limit)
		const total = allClicksByDate.length

		return {
			items,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		}
	}
}
