import {
	type QrPort,
	type UserAgentParserPort,
	CreateLinkUseCase,
	DeleteLinkUseCase,
	GenerateQrUseCase,
	GetLinkUseCase,
	ListLinksUseCase,
	UpdateLinkUseCase,
	RedirectUseCase,
	LinkOwnershipService,
} from '../../application'

import { type LinkRepository, type ClickRepository, ShortCodeService } from '../../domain'
import { QrAdapter, UserAgentParserAdapter } from '../../infrastructure'

export interface LinksModule {
	qrPort: QrPort
	userAgentParserPort: UserAgentParserPort
	shortCodeService: ShortCodeService
	linkOwnershipService: LinkOwnershipService

	createLinkUseCase: CreateLinkUseCase
	getLinkUseCase: GetLinkUseCase
	listLinksUseCase: ListLinksUseCase
	updateLinkUseCase: UpdateLinkUseCase
	deleteLinkUseCase: DeleteLinkUseCase
	generateQrUseCase: GenerateQrUseCase
	redirectUseCase: RedirectUseCase
}

interface LinksModuleDeps {
	linkRepository: LinkRepository
	clickRepository: ClickRepository
	baseUrl: string
	shortCodeMaxAttempts: number
}

export function createLinksModule(deps: LinksModuleDeps): LinksModule {
	const { linkRepository, clickRepository, baseUrl, shortCodeMaxAttempts } = deps

	const qrPort = new QrAdapter()
	const userAgentParserPort = new UserAgentParserAdapter()
	const shortCodeService = new ShortCodeService(linkRepository, shortCodeMaxAttempts)
	const linkOwnershipService = new LinkOwnershipService(linkRepository)

	const createLinkUseCase = new CreateLinkUseCase(linkRepository, shortCodeService)
	const getLinkUseCase = new GetLinkUseCase(linkOwnershipService)
	const listLinksUseCase = new ListLinksUseCase(linkRepository)
	const updateLinkUseCase = new UpdateLinkUseCase(linkOwnershipService, linkRepository)
	const deleteLinkUseCase = new DeleteLinkUseCase(linkOwnershipService, linkRepository)
	const generateQrUseCase = new GenerateQrUseCase(linkOwnershipService, qrPort, baseUrl)
	const redirectUseCase = new RedirectUseCase(linkRepository, clickRepository, userAgentParserPort)

	return {
		qrPort,
		userAgentParserPort,
		shortCodeService,
		linkOwnershipService,
		createLinkUseCase,
		getLinkUseCase,
		listLinksUseCase,
		updateLinkUseCase,
		deleteLinkUseCase,
		generateQrUseCase,
		redirectUseCase,
	}
}
