import { LRUCache } from 'lru-cache'

interface LinkCacheData {
	id: number
	originalUrl: string
	isActive: boolean
	expiresAt: Date | null
}

const cache = new LRUCache<string, LinkCacheData>({
	max: 10000,
	ttl: 1000 * 60 * 5,
	updateAgeOnGet: true,
	updateAgeOnHas: true,
})

export function getLinkFromCache(shortCode: string): LinkCacheData | undefined {
	return cache.get(shortCode)
}

export function setLinkToCache(shortCode: string, data: LinkCacheData): void {
	cache.set(shortCode, data)
}

export function deleteLinkFromCache(shortCode: string): void {
	cache.delete(shortCode)
}
