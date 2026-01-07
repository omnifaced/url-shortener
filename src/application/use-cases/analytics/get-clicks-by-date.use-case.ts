import type { ClicksByDateQueryDto, ClicksByDateResponseDto } from '../../dto'
import type { LinkOwnershipService } from '../../services'
import type { ClickRepository } from '../../../domain'

export class GetClicksByDateUseCase {
	constructor(
		private readonly linkOwnershipService: LinkOwnershipService,
		private readonly clickRepository: ClickRepository
	) {}

	public async execute(
		userId: number,
		linkId: number,
		query: ClicksByDateQueryDto
	): Promise<ClicksByDateResponseDto> {
		const link = await this.linkOwnershipService.validateAndGetLink(userId, linkId)

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
