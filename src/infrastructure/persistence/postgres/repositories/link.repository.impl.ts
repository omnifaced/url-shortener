/* node:coverage disable */

import * as schema from '../schema'

import {
	Link,
	Id,
	Url,
	ShortCode,
	type LinkRepository,
	type LinkListOptions,
	type LinkWithClickCount,
} from '../../../../domain'

import { eq, desc, lt, and, isNotNull, sql } from 'drizzle-orm'
import type { Database } from '../database'

export class LinkRepositoryImpl implements LinkRepository {
	constructor(private readonly db: Database) {}

	public async findById(id: Id): Promise<Link | null> {
		const result = await this.db.select().from(schema.links).where(eq(schema.links.id, id.getValue())).limit(1)

		if (result.length === 0) {
			return null
		}

		return this.toDomain(result[0])
	}

	public async findByShortCode(shortCode: ShortCode): Promise<Link | null> {
		const result = await this.db
			.select()
			.from(schema.links)
			.where(eq(schema.links.shortCode, shortCode.getValue()))
			.limit(1)

		if (result.length === 0) {
			return null
		}

		return this.toDomain(result[0])
	}

	public async findByUserId(userId: Id, options?: LinkListOptions): Promise<Link[]> {
		let query = this.db
			.select()
			.from(schema.links)
			.where(eq(schema.links.userId, userId.getValue()))
			.orderBy(desc(schema.links.createdAt))

		if (options?.limit) {
			query = query.limit(options.limit) as typeof query
		}

		if (options?.offset) {
			query = query.offset(options.offset) as typeof query
		}

		const result = await query

		return result.map((row) => this.toDomain(row))
	}

	public async save(link: Link): Promise<Link> {
		const result = await this.db
			.insert(schema.links)
			.values({
				userId: link.getUserId().getValue(),
				originalUrl: link.getOriginalUrl().getValue(),
				shortCode: link.getShortCode().getValue(),
				title: link.getTitle(),
				isActive: link.getIsActive(),
				expiresAt: link.getExpiresAt(),
			})
			.returning()

		return this.toDomain(result[0])
	}

	public async update(link: Link): Promise<void> {
		await this.db
			.update(schema.links)
			.set({
				title: link.getTitle(),
				isActive: link.getIsActive(),
			})
			.where(eq(schema.links.id, link.getId().getValue()))
	}

	public async delete(id: Id): Promise<void> {
		await this.db.delete(schema.links).where(eq(schema.links.id, id.getValue()))
	}

	public async countByUserId(userId: Id): Promise<number> {
		const result = await this.db
			.select({ count: schema.links.id })
			.from(schema.links)
			.where(eq(schema.links.userId, userId.getValue()))

		return result.length
	}

	public async getTotalClicksByUserId(userId: Id): Promise<number> {
		const result = await this.db
			.select({ totalClicks: sql<number>`CAST(COUNT(${schema.clicks.id}) AS INTEGER)` })
			.from(schema.links)
			.leftJoin(schema.clicks, eq(schema.links.id, schema.clicks.linkId))
			.where(eq(schema.links.userId, userId.getValue()))

		return result[0]?.totalClicks ?? 0
	}

	public async findExpiredLinks(): Promise<Link[]> {
		const result = await this.db
			.select()
			.from(schema.links)
			.where(and(isNotNull(schema.links.expiresAt), lt(schema.links.expiresAt, new Date())))

		return result.map((row) => this.toDomain(row))
	}

	public async findByUserIdWithClickCount(
		userId: Id,
		sortBy: 'top' | 'recent',
		options: LinkListOptions
	): Promise<LinkWithClickCount[]> {
		const clickCount = sql<number>`CAST(COUNT(${schema.clicks.id}) AS INTEGER)`
		const lastClickedAt = sql<Date | null>`MAX(${schema.clicks.clickedAt})`

		let query = this.db
			.select({
				id: schema.links.id,
				userId: schema.links.userId,
				originalUrl: schema.links.originalUrl,
				shortCode: schema.links.shortCode,
				title: schema.links.title,
				isActive: schema.links.isActive,
				createdAt: schema.links.createdAt,
				expiresAt: schema.links.expiresAt,
				clickCount,
				lastClickedAt,
			})
			.from(schema.links)
			.leftJoin(schema.clicks, eq(schema.links.id, schema.clicks.linkId))
			.where(eq(schema.links.userId, userId.getValue()))
			.groupBy(schema.links.id)

		if (sortBy === 'top') {
			query = query.orderBy(desc(clickCount), desc(schema.links.createdAt)) as typeof query
		} else {
			query = query.orderBy(sql`${lastClickedAt} DESC NULLS LAST`, desc(schema.links.createdAt)) as typeof query
		}

		if (options.limit) {
			query = query.limit(options.limit) as typeof query
		}

		if (options.offset) {
			query = query.offset(options.offset) as typeof query
		}

		const result = await query

		return result.map((row) => ({
			link: this.toDomain({
				id: row.id,
				userId: row.userId,
				originalUrl: row.originalUrl,
				shortCode: row.shortCode,
				title: row.title,
				isActive: row.isActive,
				createdAt: row.createdAt,
				expiresAt: row.expiresAt,
			}),
			clickCount: row.clickCount,
		}))
	}

	private toDomain(row: typeof schema.links.$inferSelect): Link {
		return Link.create({
			id: Id.create(row.id),
			userId: Id.create(row.userId),
			originalUrl: Url.create(row.originalUrl),
			shortCode: ShortCode.create(row.shortCode),
			title: row.title,
			isActive: row.isActive,
			createdAt: row.createdAt,
			expiresAt: row.expiresAt,
		})
	}
}

/* node:coverage enable */
