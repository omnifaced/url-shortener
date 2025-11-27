/* node:coverage disable */

import * as schema from '../schema'

import { Link, Id, Url, ShortCode, type LinkRepository, type LinkListOptions } from '../../../../domain'
import { eq, desc, lt, and, isNotNull } from 'drizzle-orm'
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

	public async findExpiredLinks(): Promise<Link[]> {
		const result = await this.db
			.select()
			.from(schema.links)
			.where(and(isNotNull(schema.links.expiresAt), lt(schema.links.expiresAt, new Date())))

		return result.map((row) => this.toDomain(row))
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
