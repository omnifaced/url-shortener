import * as assert from 'node:assert'

import { Id, Url, ShortCode } from '../value-objects'
import { describe, test } from 'node:test'
import { Link } from './link.entity'

describe('Link', () => {
	describe('create', () => {
		test('should create Link from props', () => {
			const props = {
				id: Id.create(1),
				userId: Id.create(1),
				originalUrl: Url.create('https://example.com'),
				shortCode: ShortCode.create('abc123'),
				title: 'Test Link',
				isActive: true,
				createdAt: new Date(),
				expiresAt: null,
			}

			const link = Link.create(props)

			assert.strictEqual(link.getId().getValue(), 1)
			assert.strictEqual(link.getUserId().getValue(), 1)
			assert.strictEqual(link.getOriginalUrl().getValue(), 'https://example.com')
			assert.strictEqual(link.getShortCode().getValue(), 'abc123')
			assert.strictEqual(link.getTitle(), 'Test Link')
			assert.strictEqual(link.getIsActive(), true)
			assert.strictEqual(link.getExpiresAt(), null)
		})
	})

	describe('createNew', () => {
		test('should create new Link with required fields', () => {
			const userId = Id.create(1)
			const originalUrl = Url.create('https://example.com')
			const shortCode = ShortCode.create('abc123')

			const link = Link.createNew(userId, originalUrl, shortCode)

			assert.strictEqual(link.getUserId().getValue(), 1)
			assert.strictEqual(link.getOriginalUrl().getValue(), 'https://example.com')
			assert.strictEqual(link.getShortCode().getValue(), 'abc123')
			assert.strictEqual(link.getTitle(), null)
			assert.strictEqual(link.getIsActive(), true)
			assert.strictEqual(link.getExpiresAt(), null)
		})

		test('should create new Link with title', () => {
			const userId = Id.create(1)
			const originalUrl = Url.create('https://example.com')
			const shortCode = ShortCode.create('abc123')
			const title = 'My Link'

			const link = Link.createNew(userId, originalUrl, shortCode, title)

			assert.strictEqual(link.getTitle(), 'My Link')
		})

		test('should create new Link with expiresAt', () => {
			const userId = Id.create(1)
			const originalUrl = Url.create('https://example.com')
			const shortCode = ShortCode.create('abc123')
			const expiresAt = new Date('2025-12-31')

			const link = Link.createNew(userId, originalUrl, shortCode, undefined, expiresAt)

			assert.deepStrictEqual(link.getExpiresAt(), expiresAt)
		})

		test('should create new Link with both title and expiresAt', () => {
			const userId = Id.create(1)
			const originalUrl = Url.create('https://example.com')
			const shortCode = ShortCode.create('abc123')
			const title = 'My Link'
			const expiresAt = new Date('2025-12-31')

			const link = Link.createNew(userId, originalUrl, shortCode, title, expiresAt)

			assert.strictEqual(link.getTitle(), 'My Link')
			assert.deepStrictEqual(link.getExpiresAt(), expiresAt)
		})
	})

	describe('isExpired', () => {
		test('should return false when no expiresAt', () => {
			const link = Link.createNew(Id.create(1), Url.create('https://example.com'), ShortCode.create('abc123'))

			assert.strictEqual(link.isExpired(), false)
		})

		test('should return false when expiresAt is in future', () => {
			const futureDate = new Date()
			futureDate.setFullYear(futureDate.getFullYear() + 1)

			const link = Link.createNew(
				Id.create(1),
				Url.create('https://example.com'),
				ShortCode.create('abc123'),
				undefined,
				futureDate
			)

			assert.strictEqual(link.isExpired(), false)
		})

		test('should return true when expiresAt is in past', () => {
			const pastDate = new Date('2020-01-01')

			const link = Link.createNew(
				Id.create(1),
				Url.create('https://example.com'),
				ShortCode.create('abc123'),
				undefined,
				pastDate
			)

			assert.strictEqual(link.isExpired(), true)
		})
	})

	describe('canBeAccessed', () => {
		test('should return true when active and not expired', () => {
			const link = Link.createNew(Id.create(1), Url.create('https://example.com'), ShortCode.create('abc123'))

			assert.strictEqual(link.canBeAccessed(), true)
		})

		test('should return false when not active', () => {
			const link = Link.createNew(Id.create(1), Url.create('https://example.com'), ShortCode.create('abc123'))

			link.deactivate()

			assert.strictEqual(link.canBeAccessed(), false)
		})

		test('should return false when expired', () => {
			const pastDate = new Date('2020-01-01')

			const link = Link.createNew(
				Id.create(1),
				Url.create('https://example.com'),
				ShortCode.create('abc123'),
				undefined,
				pastDate
			)

			assert.strictEqual(link.canBeAccessed(), false)
		})

		test('should return false when not active and expired', () => {
			const pastDate = new Date('2020-01-01')

			const link = Link.createNew(
				Id.create(1),
				Url.create('https://example.com'),
				ShortCode.create('abc123'),
				undefined,
				pastDate
			)

			link.deactivate()

			assert.strictEqual(link.canBeAccessed(), false)
		})
	})

	describe('deactivate', () => {
		test('should deactivate link', () => {
			const link = Link.createNew(Id.create(1), Url.create('https://example.com'), ShortCode.create('abc123'))

			link.deactivate()

			assert.strictEqual(link.getIsActive(), false)
		})
	})

	describe('activate', () => {
		test('should activate link', () => {
			const link = Link.createNew(Id.create(1), Url.create('https://example.com'), ShortCode.create('abc123'))

			link.deactivate()
			link.activate()

			assert.strictEqual(link.getIsActive(), true)
		})
	})

	describe('updateTitle', () => {
		test('should update title', () => {
			const link = Link.createNew(Id.create(1), Url.create('https://example.com'), ShortCode.create('abc123'))

			link.updateTitle('New Title')

			assert.strictEqual(link.getTitle(), 'New Title')
		})

		test('should set title to null', () => {
			const link = Link.createNew(
				Id.create(1),
				Url.create('https://example.com'),
				ShortCode.create('abc123'),
				'Old Title'
			)

			link.updateTitle(null)

			assert.strictEqual(link.getTitle(), null)
		})
	})
})
