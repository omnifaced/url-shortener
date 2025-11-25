import { NotFoundError, ForbiddenError } from '../../errors'
import { Id, type LinkRepository } from '../../../domain'
import { qrCodesGeneratedTotal } from '../../../shared'
import type { QrPort, QrOptions } from '../../ports'

export class GenerateQrUseCase {
	constructor(
		private readonly linkRepository: LinkRepository,
		private readonly qrPort: QrPort,
		private readonly baseUrl: string
	) {}

	public async execute(userId: number, linkId: number, options: QrOptions): Promise<Buffer> {
		const linkIdValue = Id.create(linkId)
		const userIdValue = Id.create(userId)

		const link = await this.linkRepository.findById(linkIdValue)
		if (!link) {
			throw new NotFoundError('Link', linkId)
		}

		if (link.getUserId().getValue() !== userIdValue.getValue()) {
			throw new ForbiddenError('You do not have permission to access this link')
		}

		const shortUrl = `${this.baseUrl}/${link.getShortCode().getValue()}`
		const qrCode = await this.qrPort.generate(shortUrl, options)

		qrCodesGeneratedTotal.inc({ format: options.format })

		return qrCode
	}
}
