import {
	GetClicksByDateUseCase,
	GetLinkClicksUseCase,
	GetLinkStatsUseCase,
	ListAnalyticsLinksUseCase,
	type LinkOwnershipService,
} from '../../application'

import type { LinkRepository, ClickRepository } from '../../domain'

export interface AnalyticsModule {
	getClicksByDateUseCase: GetClicksByDateUseCase
	getLinkClicksUseCase: GetLinkClicksUseCase
	getLinkStatsUseCase: GetLinkStatsUseCase
	listAnalyticsLinksUseCase: ListAnalyticsLinksUseCase
}

interface AnalyticsModuleDeps {
	linkRepository: LinkRepository
	clickRepository: ClickRepository
	linkOwnershipService: LinkOwnershipService
}

export function createAnalyticsModule(deps: AnalyticsModuleDeps): AnalyticsModule {
	const { linkRepository, clickRepository, linkOwnershipService } = deps

	const getClicksByDateUseCase = new GetClicksByDateUseCase(linkOwnershipService, clickRepository)
	const getLinkClicksUseCase = new GetLinkClicksUseCase(linkOwnershipService, clickRepository)
	const getLinkStatsUseCase = new GetLinkStatsUseCase(linkOwnershipService, clickRepository)
	const listAnalyticsLinksUseCase = new ListAnalyticsLinksUseCase(linkRepository)

	return {
		getClicksByDateUseCase,
		getLinkClicksUseCase,
		getLinkStatsUseCase,
		listAnalyticsLinksUseCase,
	}
}
