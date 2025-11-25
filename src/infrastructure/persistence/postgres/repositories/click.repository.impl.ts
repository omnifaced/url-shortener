import * as schema from '../schema'

import {
	Click,
	Id,
	type ClickRepository,
	type ClicksByDate,
	type TopReferer,
	type LinkClickCount,
	type DeviceInfo,
} from '../../../../domain'

import { eq, sql, desc } from 'drizzle-orm'
import type { Database } from '../database'

export class ClickRepositoryImpl implements ClickRepository {
	constructor(private readonly db: Database) {}

	public async save(click: Click): Promise<Click> {
		const result = await this.db
			.insert(schema.clicks)
			.values({
				linkId: click.getLinkId().getValue(),
				clickedAt: click.getClickedAt(),
				ip: click.getIp(),
				userAgent: click.getUserAgent(),
				referer: click.getReferer(),
				deviceInfo: click.getDeviceInfo(),
			})
			.returning()

		return this.toDomain(result[0])
	}

	public async findByLinkId(linkId: Id, limit = 10): Promise<Click[]> {
		const result = await this.db
			.select()
			.from(schema.clicks)
			.where(eq(schema.clicks.linkId, linkId.getValue()))
			.orderBy(desc(schema.clicks.clickedAt))
			.limit(limit)

		return result.map((row) => this.toDomain(row))
	}

	public async countByLinkId(linkId: Id): Promise<number> {
		const result = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(schema.clicks)
			.where(eq(schema.clicks.linkId, linkId.getValue()))

		return Number(result[0].count)
	}

	public async getClicksByDate(linkId: Id, days = 30): Promise<ClicksByDate[]> {
		const startDate = new Date()
		startDate.setDate(startDate.getDate() - days)

		const result = await this.db
			.select({
				date: sql<string>`DATE(${schema.clicks.clickedAt})`,
				count: sql<number>`count(*)`,
			})
			.from(schema.clicks)
			.where(sql`${schema.clicks.linkId} = ${linkId.getValue()} AND ${schema.clicks.clickedAt} >= ${startDate}`)
			.groupBy(sql`DATE(${schema.clicks.clickedAt})`)
			.orderBy(sql`DATE(${schema.clicks.clickedAt})`)

		return result.map((row) => ({
			date: row.date,
			count: Number(row.count),
		}))
	}

	public async getTopReferers(linkId: Id, limit = 5): Promise<TopReferer[]> {
		const result = await this.db
			.select({
				referer: schema.clicks.referer,
				count: sql<number>`count(*)`,
			})
			.from(schema.clicks)
			.where(eq(schema.clicks.linkId, linkId.getValue()))
			.groupBy(schema.clicks.referer)
			.orderBy(desc(sql`count(*)`))
			.limit(limit)

		return result.map((row) => ({
			referer: row.referer,
			count: Number(row.count),
		}))
	}

	public async countByUserId(userId: Id): Promise<number> {
		const result = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(schema.clicks)
			.innerJoin(schema.links, eq(schema.clicks.linkId, schema.links.id))
			.where(eq(schema.links.userId, userId.getValue()))

		return Number(result[0].count)
	}

	public async getClickCountsByUserId(userId: Id): Promise<LinkClickCount[]> {
		const result = await this.db
			.select({
				linkId: schema.clicks.linkId,
				count: sql<number>`count(*)`,
			})
			.from(schema.clicks)
			.innerJoin(schema.links, eq(schema.clicks.linkId, schema.links.id))
			.where(eq(schema.links.userId, userId.getValue()))
			.groupBy(schema.clicks.linkId)
			.orderBy(desc(sql`count(*)`))

		return result.map((row) => ({
			linkId: Id.create(row.linkId),
			count: Number(row.count),
		}))
	}

	private toDomain(row: typeof schema.clicks.$inferSelect): Click {
		return Click.create({
			id: Id.create(row.id),
			linkId: Id.create(row.linkId),
			clickedAt: row.clickedAt,
			ip: row.ip,
			userAgent: row.userAgent,
			referer: row.referer,
			deviceInfo: row.deviceInfo as DeviceInfo,
		})
	}
}
