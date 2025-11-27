/* node:coverage disable */

import * as schema from '../schema'

import { User, Id, Username, type UserRepository } from '../../../../domain'
import type { Database } from '../database'
import { eq } from 'drizzle-orm'

export class UserRepositoryImpl implements UserRepository {
	constructor(private readonly db: Database) {}

	public async findById(id: Id): Promise<User | null> {
		const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id.getValue())).limit(1)

		if (result.length === 0) {
			return null
		}

		const row = result[0]
		return User.create({
			id: Id.create(row.id),
			username: Username.create(row.username),
			passwordHash: row.password,
			createdAt: row.createdAt,
		})
	}

	public async findByUsername(username: Username): Promise<User | null> {
		const result = await this.db
			.select()
			.from(schema.users)
			.where(eq(schema.users.username, username.getValue()))
			.limit(1)

		if (result.length === 0) {
			return null
		}

		const row = result[0]
		return User.create({
			id: Id.create(row.id),
			username: Username.create(row.username),
			passwordHash: row.password,
			createdAt: row.createdAt,
		})
	}

	public async save(user: User): Promise<User> {
		const result = await this.db
			.insert(schema.users)
			.values({
				username: user.getUsername().getValue(),
				password: user.getPasswordHash(),
			})
			.returning()

		const row = result[0]
		return User.create({
			id: Id.create(row.id),
			username: Username.create(row.username),
			passwordHash: row.password,
			createdAt: row.createdAt,
		})
	}

	public async exists(username: Username): Promise<boolean> {
		const result = await this.db
			.select({ id: schema.users.id })
			.from(schema.users)
			.where(eq(schema.users.username, username.getValue()))
			.limit(1)

		return result.length > 0
	}
}

/* node:coverage enable */
