import * as schema from '../persistence/postgres/schema'

import { linksActiveGauge, authTokensActiveGauge } from '../../shared'
import type { Database } from '../persistence/postgres/database'
import { eq, count } from 'drizzle-orm'

export class MetricsUpdateService {
	constructor(private readonly db: Database) {}

	public async updateGauges(): Promise<void> {
		const [activeLinksResult, activeTokensResult] = await Promise.all([
			this.db.select({ count: count() }).from(schema.links).where(eq(schema.links.isActive, true)),
			this.db.select({ count: count() }).from(schema.refreshTokens),
		])

		linksActiveGauge.set(activeLinksResult[0]?.count || 0)
		authTokensActiveGauge.set(activeTokensResult[0]?.count || 0)
	}
}
