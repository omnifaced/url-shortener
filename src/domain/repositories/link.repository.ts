import type { Id, ShortCode } from '../value-objects'
import type { Link } from '../entities'

export interface LinkListOptions {
	limit?: number
	offset?: number
}

export interface LinkWithClickCount {
	link: Link
	clickCount: number
}

export interface LinkRepository {
	findById(id: Id): Promise<Link | null>
	findByShortCode(shortCode: ShortCode): Promise<Link | null>
	findByUserId(userId: Id, options?: LinkListOptions): Promise<Link[]>
	findByUserIdWithClickCount(
		userId: Id,
		sortBy: 'top' | 'recent',
		options: LinkListOptions
	): Promise<LinkWithClickCount[]>
	save(link: Link): Promise<Link>
	update(link: Link): Promise<void>
	delete(id: Id): Promise<void>
	countByUserId(userId: Id): Promise<number>
	getTotalClicksByUserId(userId: Id): Promise<number>
	findExpiredLinks(): Promise<Link[]>
}
