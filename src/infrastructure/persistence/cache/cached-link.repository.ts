import { Id, type Link, type LinkRepository, type LinkListOptions, type ShortCode } from '../../../domain'
import { cacheHitsTotal, cacheMissesTotal } from '../../../shared'
import type { LinkCacheAdapter } from './link-cache.adapter'

export class CachedLinkRepository implements LinkRepository {
	constructor(
		private readonly linkRepository: LinkRepository,
		private readonly cache: LinkCacheAdapter
	) {}

	/* node:coverage disable */

	public async findById(id: Id): Promise<Link | null> {
		return this.linkRepository.findById(id)
	}

	public async findByShortCode(shortCode: ShortCode): Promise<Link | null> {
		const cached = this.cache.get(shortCode.getValue())

		if (cached) {
			const link = await this.linkRepository.findById(Id.create(cached.id))

			if (link) {
				cacheHitsTotal.inc({ cache_type: 'link' })
				return link
			}
		}

		cacheMissesTotal.inc({ cache_type: 'link' })

		const link = await this.linkRepository.findByShortCode(shortCode)

		if (link) {
			this.cache.set(shortCode.getValue(), link)
		}

		return link
	}

	/* node:coverage enable */

	public async findByUserId(userId: Id, options?: LinkListOptions): Promise<Link[]> {
		return this.linkRepository.findByUserId(userId, options)
	}

	public async save(link: Link): Promise<Link> {
		const savedLink = await this.linkRepository.save(link)
		this.cache.set(savedLink.getShortCode().getValue(), savedLink)
		return savedLink
	}

	public async update(link: Link): Promise<void> {
		await this.linkRepository.update(link)
		this.cache.set(link.getShortCode().getValue(), link)
	}
	public async delete(id: Id): Promise<void> {
		const link = await this.linkRepository.findById(id)
		if (link) {
			this.cache.delete(link.getShortCode().getValue())
		}
		await this.linkRepository.delete(id)
	}
	public async countByUserId(userId: Id): Promise<number> {
		return this.linkRepository.countByUserId(userId)
	}

	public async findExpiredLinks(): Promise<Link[]> {
		return this.linkRepository.findExpiredLinks()
	}
}
