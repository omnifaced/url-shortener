import { Click, ShortCode, type LinkRepository, type ClickRepository } from '../../../domain'
import type { UserAgentParserPort } from '../../ports'
import { clicksTotal } from '../../../shared'
import { NotFoundError } from '../../errors'

export class RedirectUseCase {
	constructor(
		private readonly linkRepository: LinkRepository,
		private readonly clickRepository: ClickRepository,
		private readonly userAgentParser: UserAgentParserPort
	) {}

	public async execute(shortCode: string, ip?: string, userAgent?: string, referer?: string): Promise<string> {
		const link = await this.linkRepository.findByShortCode(ShortCode.create(shortCode))
		if (!link) {
			throw new NotFoundError('Link')
		}

		if (!link.canBeAccessed()) {
			throw new NotFoundError('Link')
		}

		const deviceInfo = userAgent ? this.userAgentParser.parse(userAgent) : undefined

		const click = Click.createNew(link.getId(), ip, userAgent, referer, deviceInfo)

		await this.clickRepository.save(click)

		clicksTotal.inc({ short_code: shortCode })

		return link.getOriginalUrl().getValue()
	}
}
