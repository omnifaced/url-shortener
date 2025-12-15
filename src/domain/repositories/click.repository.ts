import type { Id } from '../value-objects'
import type { Click } from '../entities'

export interface ClicksByDate {
	date: string
	count: number
}

export interface TopReferer {
	referer: string | null
	count: number
}

export interface LinkClickCount {
	linkId: Id
	count: number
}

export interface PaginatedClicks {
	items: Click[]
	total: number
}

export interface PaginatedReferers {
	items: TopReferer[]
	total: number
}

export interface ClickRepository {
	save(click: Click): Promise<Click>
	findByLinkId(linkId: Id, limit?: number): Promise<Click[]>
	findByLinkIdPaginated(linkId: Id, limit: number, offset: number): Promise<PaginatedClicks>
	countByLinkId(linkId: Id): Promise<number>
	getClicksByDate(linkId: Id, days?: number): Promise<ClicksByDate[]>
	getTopReferers(linkId: Id, limit?: number): Promise<TopReferer[]>
	getTopReferersPaginated(linkId: Id, limit: number, offset: number): Promise<PaginatedReferers>
	countByUserId(userId: Id): Promise<number>
	getClickCountsByUserId(userId: Id): Promise<LinkClickCount[]>
}
