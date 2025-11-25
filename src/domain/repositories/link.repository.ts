import type { Id, ShortCode } from '../value-objects'
import type { Link } from '../entities'

export interface LinkListOptions {
	limit?: number
	offset?: number
}

export interface LinkRepository {
	findById(id: Id): Promise<Link | null>
	findByShortCode(shortCode: ShortCode): Promise<Link | null>
	findByUserId(userId: Id, options?: LinkListOptions): Promise<Link[]>
	save(link: Link): Promise<Link>
	update(link: Link): Promise<void>
	delete(id: Id): Promise<void>
	countByUserId(userId: Id): Promise<number>
	findExpiredLinks(): Promise<Link[]>
}
