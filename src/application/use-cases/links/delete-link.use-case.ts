import type { LinkOwnershipService } from '../../services'
import { Id, type LinkRepository } from '../../../domain'

export class DeleteLinkUseCase {
	constructor(
		private readonly linkOwnershipService: LinkOwnershipService,
		private readonly linkRepository: LinkRepository
	) {}

	public async execute(userId: number, linkId: number): Promise<void> {
		await this.linkOwnershipService.validateAndGetLink(userId, linkId)
		await this.linkRepository.delete(Id.create(linkId))
	}
}
