import * as assert from 'node:assert'

import { Link, Id, Url, ShortCode } from '../../../domain'
import { LinkCacheAdapter } from './link-cache.adapter'
import { describe, test } from 'node:test'

describe('LinkCacheAdapter', () => {
	test('should get cached link', () => {
		const adapter = new LinkCacheAdapter(100, 60000)
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(1),
			originalUrl: Url.create('https://example.com'),
			shortCode: ShortCode.create('abc123'),
			title: 'Test',
			isActive: true,
			createdAt: new Date(),
			expiresAt: null,
		})

		adapter.set('abc123', link)

		const cached = adapter.get('abc123')

		assert.ok(cached)
		assert.strictEqual(cached.id, 1)
		assert.strictEqual(cached.originalUrl, 'https://example.com')
		assert.strictEqual(cached.isActive, true)
		assert.strictEqual(cached.expiresAt, null)
	})

	test('should return undefined for non-existent key', () => {
		const adapter = new LinkCacheAdapter(100, 60000)

		const cached = adapter.get('non-existent')

		assert.strictEqual(cached, undefined)
	})

	test('should cache link with expiration date', () => {
		const adapter = new LinkCacheAdapter(100, 60000)
		const expiresAt = new Date('2025-12-31')
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(1),
			originalUrl: Url.create('https://example.com'),
			shortCode: ShortCode.create('abc123'),
			title: 'Test',
			isActive: true,
			createdAt: new Date(),
			expiresAt,
		})

		adapter.set('abc123', link)

		const cached = adapter.get('abc123')

		assert.ok(cached)
		assert.strictEqual(cached.expiresAt?.getTime(), expiresAt.getTime())
	})

	test('should delete cached link', () => {
		const adapter = new LinkCacheAdapter(100, 60000)
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(1),
			originalUrl: Url.create('https://example.com'),
			shortCode: ShortCode.create('abc123'),
			title: 'Test',
			isActive: true,
			createdAt: new Date(),
			expiresAt: null,
		})

		adapter.set('abc123', link)
		adapter.delete('abc123')

		const cached = adapter.get('abc123')

		assert.strictEqual(cached, undefined)
	})

	test('should cache inactive link', () => {
		const adapter = new LinkCacheAdapter(100, 60000)
		const link = Link.create({
			id: Id.create(1),
			userId: Id.create(1),
			originalUrl: Url.create('https://example.com'),
			shortCode: ShortCode.create('abc123'),
			title: 'Test',
			isActive: false,
			createdAt: new Date(),
			expiresAt: null,
		})

		adapter.set('abc123', link)

		const cached = adapter.get('abc123')

		assert.ok(cached)
		assert.strictEqual(cached.isActive, false)
	})
})
