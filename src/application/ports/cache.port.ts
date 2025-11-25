export interface CachePort<T> {
	get(key: string): Promise<T | null>
	set(key: string, value: T, ttl?: number): Promise<void>
	delete(key: string): Promise<void>
	clear(): Promise<void>
}
