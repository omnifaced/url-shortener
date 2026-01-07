import {
	type UserRepository,
	type LinkRepository,
	type ClickRepository,
	type RefreshTokenRepository,
	type ShortCodeService,
	ShortCode,
} from '../domain'

import type {
	PasswordPort,
	JwtPort,
	QrPort,
	UserAgentParserPort,
	TokenBlacklistPort,
	CreateLinkUseCase,
	DeleteLinkUseCase,
	GenerateQrUseCase,
	GetClicksByDateUseCase,
	GetLinkClicksUseCase,
	GetLinkStatsUseCase,
	GetLinkUseCase,
	ListAnalyticsLinksUseCase,
	ListLinksUseCase,
	LoginUseCase,
	LogoutAllUseCase,
	LogoutUseCase,
	RedirectUseCase,
	RefreshUseCase,
	RegisterUseCase,
	UpdateLinkUseCase,
} from '../application'

import {
	createCoreModule,
	createCleanupModule,
	createRepositoriesModule,
	createAuthModule,
	createLinksModule,
	createAnalyticsModule,
} from './modules'

import type { Database } from '../infrastructure'
import type { RedisClientType } from 'redis'
import type { Config } from '../shared'
import { getBaseUrl } from '../shared'
import type { CronJob } from 'cron'

export interface Container {
	config: Config
	database: Database
	redis?: RedisClientType
	cleanupJob?: CronJob

	userRepository: UserRepository
	linkRepository: LinkRepository
	clickRepository: ClickRepository
	refreshTokenRepository: RefreshTokenRepository

	passwordPort: PasswordPort
	jwtPort: JwtPort
	qrPort: QrPort
	userAgentParserPort: UserAgentParserPort
	tokenBlacklistPort?: TokenBlacklistPort

	shortCodeService: ShortCodeService

	registerUseCase: RegisterUseCase
	loginUseCase: LoginUseCase
	refreshUseCase: RefreshUseCase
	logoutUseCase: LogoutUseCase
	logoutAllUseCase?: LogoutAllUseCase

	createLinkUseCase: CreateLinkUseCase
	getLinkUseCase: GetLinkUseCase
	listLinksUseCase: ListLinksUseCase
	updateLinkUseCase: UpdateLinkUseCase
	deleteLinkUseCase: DeleteLinkUseCase
	generateQrUseCase: GenerateQrUseCase

	getClicksByDateUseCase: GetClicksByDateUseCase
	getLinkClicksUseCase: GetLinkClicksUseCase
	getLinkStatsUseCase: GetLinkStatsUseCase
	listAnalyticsLinksUseCase: ListAnalyticsLinksUseCase

	redirectUseCase: RedirectUseCase
}

export async function createContainer(config: Config): Promise<Container> {
	ShortCode.configure(config.short_code.length, config.short_code.max_length)

	const core = await createCoreModule({
		config,
		accessTokenTtl: config.jwt.access_token_ttl,
	})

	const repositories = createRepositoriesModule({
		database: core.database,
		cacheMaxSize: config.cache.max_size,
		cacheTtl: config.cache.ttl,
	})

	const auth = createAuthModule({
		userRepository: repositories.userRepository,
		refreshTokenRepository: repositories.refreshTokenRepository,
		tokenBlacklistPort: core.tokenBlacklistPort,
		jwtSecret: config.jwt.secret,
		accessTokenTtl: config.jwt.access_token_ttl,
		refreshTokenTtl: config.jwt.refresh_token_ttl,
	})

	const baseUrl =
		config.app.redirect_url ||
		getBaseUrl(config.app.host, config.app.port, config.certificates.cert_path, config.certificates.key_path)

	const links = createLinksModule({
		linkRepository: repositories.linkRepository,
		clickRepository: repositories.clickRepository,
		baseUrl,
		shortCodeMaxAttempts: config.short_code.max_attempts,
	})

	const analytics = createAnalyticsModule({
		linkRepository: repositories.linkRepository,
		clickRepository: repositories.clickRepository,
		linkOwnershipService: links.linkOwnershipService,
	})

	let cleanupJob: CronJob | undefined

	if (core.redis) {
		cleanupJob = createCleanupModule({
			database: core.database,
			linkRepository: repositories.linkRepository,
			refreshTokenRepository: repositories.refreshTokenRepository,
		})
	}

	return {
		config: core.config,
		database: core.database,
		redis: core.redis,
		cleanupJob,
		tokenBlacklistPort: core.tokenBlacklistPort,

		...repositories,
		...auth,
		...analytics,

		qrPort: links.qrPort,
		userAgentParserPort: links.userAgentParserPort,
		shortCodeService: links.shortCodeService,
		createLinkUseCase: links.createLinkUseCase,
		getLinkUseCase: links.getLinkUseCase,
		listLinksUseCase: links.listLinksUseCase,
		updateLinkUseCase: links.updateLinkUseCase,
		deleteLinkUseCase: links.deleteLinkUseCase,
		generateQrUseCase: links.generateQrUseCase,
		redirectUseCase: links.redirectUseCase,
	}
}
