import type { LinkOwnershipService } from '../../services'
import { qrCodesGeneratedTotal } from '../../../shared'
import type { QrPort, QrOptions } from '../../ports'

export class GenerateQrUseCase {
	constructor(
		private readonly linkOwnershipService: LinkOwnershipService,
		private readonly qrPort: QrPort,
		private readonly baseUrl: string
	) {}

	public async execute(userId: number, linkId: number, options: QrOptions): Promise<Buffer> {
		const link = await this.linkOwnershipService.validateAndGetLink(userId, linkId)

		const shortUrl = `${this.baseUrl}/${link.getShortCode().getValue()}`
		const qrCode = await this.qrPort.generate(shortUrl, options)

		qrCodesGeneratedTotal.inc({ format: options.format })

		return qrCode
	}
}
