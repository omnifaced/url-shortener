import type { Link } from '../../../domain'
import { LRUCache } from 'lru-cache'

interface LinkCacheData {
	id: number
	originalUrl: string
	isActive: boolean
	expiresAt: Date | null
}

export class LinkCacheAdapter {
	private readonly cache: LRUCache<string, LinkCacheData>

	constructor(maxSize: number, ttl: number) {
		this.cache = new LRUCache<string, LinkCacheData>({
			max: maxSize,
			ttl,
			updateAgeOnGet: true,
			updateAgeOnHas: true,
		})
	}

	public get(shortCode: string): LinkCacheData | undefined {
		return this.cache.get(shortCode)
	}

	public set(shortCode: string, link: Link): void {
		const data: LinkCacheData = {
			id: link.getId().getValue(),
			originalUrl: link.getOriginalUrl().getValue(),
			isActive: link.getIsActive(),
			expiresAt: link.getExpiresAt(),
		}

		this.cache.set(shortCode, data)
	}

	public delete(shortCode: string): void {
		this.cache.delete(shortCode)
	}
}
