import { Id, Link, Url, type LinkRepository, type ShortCodeService } from '../../../domain'
import type { CreateLinkDto, LinkResponseDto } from '../../dto'
import { linksCreatedTotal } from '../../../shared'

export class CreateLinkUseCase {
	constructor(
		private readonly linkRepository: LinkRepository,
		private readonly shortCodeService: ShortCodeService
	) {}

	public async execute(userId: number, data: CreateLinkDto): Promise<LinkResponseDto> {
		const originalUrl = Url.create(data.originalUrl)
		const shortCode = await this.shortCodeService.generateUniqueCode()

		const link = Link.createNew(
			Id.create(userId),
			originalUrl,
			shortCode,
			data.title,
			data.expiresAt ? new Date(data.expiresAt) : undefined
		)

		const savedLink = await this.linkRepository.save(link)

		linksCreatedTotal.inc({ user_id: userId.toString() })

		return {
			id: savedLink.getId().getValue(),
			originalUrl: savedLink.getOriginalUrl().getValue(),
			shortCode: savedLink.getShortCode().getValue(),
			title: savedLink.getTitle(),
			isActive: savedLink.getIsActive(),
			createdAt: savedLink.getCreatedAt().toISOString(),
			expiresAt: savedLink.getExpiresAt()?.toISOString() ?? null,
		}
	}
}
