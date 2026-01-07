import {
	createDatabase,
	type Database,
	createRedisClient,
	RedisTokenBlacklistAdapter,
	CleanupService,
	MetricsUpdateService,
	createCleanupJob,
} from '../../infrastructure'

import type { LinkRepository, RefreshTokenRepository } from '../../domain'
import type { TokenBlacklistPort } from '../../application'
import type { RedisClientType } from 'redis'
import type { Config } from '../../shared'
import type { CronJob } from 'cron'

export interface CoreModule {
	config: Config
	database: Database
	redis?: RedisClientType
	tokenBlacklistPort?: TokenBlacklistPort
}

interface CoreModuleDeps {
	config: Config
	accessTokenTtl: number
}

export async function createCoreModule(deps: CoreModuleDeps): Promise<CoreModule> {
	const { config, accessTokenTtl } = deps

	const database = createDatabase(config.database.url)

	let redis: RedisClientType | undefined
	let tokenBlacklistPort: TokenBlacklistPort | undefined

	if (config.redis) {
		redis = await createRedisClient(config.redis)

		tokenBlacklistPort = new RedisTokenBlacklistAdapter(
			redis,
			config.redis.blacklist_prefix,
			config.redis.user_tokens_prefix,
			accessTokenTtl
		)
	}

	return {
		config,
		database,
		redis,
		tokenBlacklistPort,
	}
}

interface CleanupModuleDeps {
	database: Database
	linkRepository: LinkRepository
	refreshTokenRepository: RefreshTokenRepository
}

export function createCleanupModule(deps: CleanupModuleDeps): CronJob {
	const cleanupService = new CleanupService(deps.linkRepository, deps.refreshTokenRepository)
	const metricsUpdateService = new MetricsUpdateService(deps.database)

	return createCleanupJob(cleanupService, metricsUpdateService)
}
