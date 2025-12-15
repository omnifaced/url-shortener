import {
	type UserRepository,
	type LinkRepository,
	type ClickRepository,
	type RefreshTokenRepository,
	ShortCodeService,
} from '../domain'

import {
	type PasswordPort,
	type JwtPort,
	type QrPort,
	type UserAgentParserPort,
	type TokenBlacklistPort,
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
	createDatabase,
	type Database,
	UserRepositoryImpl,
	LinkRepositoryImpl,
	ClickRepositoryImpl,
	RefreshTokenRepositoryImpl,
	LinkCacheAdapter,
	CachedLinkRepository,
	createRedisClient,
	RedisTokenBlacklistAdapter,
	PasswordAdapter,
	JwtAdapter,
	QrAdapter,
	UserAgentParserAdapter,
	CleanupService,
	MetricsUpdateService,
	createCleanupJob,
} from '../infrastructure'

import type { RedisClientType } from 'redis'
import type { Config } from '../shared'
import { getBaseUrl } from '../shared'
import { ShortCode } from '../domain'
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
	const database = createDatabase(config.database.url)

	ShortCode.configure(config.short_code.length, config.short_code.max_length)

	const userRepository = new UserRepositoryImpl(database)
	const baseLinkRepository = new LinkRepositoryImpl(database)
	const linkCache = new LinkCacheAdapter(config.cache.max_size, config.cache.ttl)
	const linkRepository = new CachedLinkRepository(baseLinkRepository, linkCache)
	const clickRepository = new ClickRepositoryImpl(database)
	const refreshTokenRepository = new RefreshTokenRepositoryImpl(database)

	const passwordPort = new PasswordAdapter()
	const jwtPort = new JwtAdapter(config.jwt.secret, config.jwt.access_token_ttl)
	const qrPort = new QrAdapter()
	const userAgentParserPort = new UserAgentParserAdapter()

	const shortCodeService = new ShortCodeService(linkRepository, config.short_code.max_attempts)

	let redis: RedisClientType | undefined
	let tokenBlacklistPort: TokenBlacklistPort | undefined
	let logoutAllUseCase: LogoutAllUseCase | undefined
	let cleanupJob: CronJob | undefined

	if (config.redis) {
		redis = await createRedisClient(config.redis)

		tokenBlacklistPort = new RedisTokenBlacklistAdapter(
			redis,
			config.redis.blacklist_prefix,
			config.redis.user_tokens_prefix,
			config.jwt.access_token_ttl
		)

		logoutAllUseCase = new LogoutAllUseCase(refreshTokenRepository, tokenBlacklistPort)

		const cleanupService = new CleanupService(linkRepository, refreshTokenRepository)
		const metricsUpdateService = new MetricsUpdateService(database)

		cleanupJob = createCleanupJob(cleanupService, metricsUpdateService)
	}

	const registerUseCase = new RegisterUseCase(
		userRepository,
		refreshTokenRepository,
		passwordPort,
		jwtPort,
		config.jwt.refresh_token_ttl,
		tokenBlacklistPort
	)

	const loginUseCase = new LoginUseCase(
		userRepository,
		refreshTokenRepository,
		passwordPort,
		jwtPort,
		config.jwt.refresh_token_ttl,
		tokenBlacklistPort
	)

	const refreshUseCase = new RefreshUseCase(userRepository, refreshTokenRepository, jwtPort, tokenBlacklistPort)

	const logoutUseCase = new LogoutUseCase(refreshTokenRepository, tokenBlacklistPort)

	const createLinkUseCase = new CreateLinkUseCase(linkRepository, shortCodeService)

	const getLinkUseCase = new GetLinkUseCase(linkRepository)

	const listLinksUseCase = new ListLinksUseCase(linkRepository)

	const updateLinkUseCase = new UpdateLinkUseCase(linkRepository)

	const deleteLinkUseCase = new DeleteLinkUseCase(linkRepository)

	const baseUrl =
		config.app.redirect_url ||
		getBaseUrl(config.app.host, config.app.port, config.certificates.cert_path, config.certificates.key_path)

	const generateQrUseCase = new GenerateQrUseCase(linkRepository, qrPort, baseUrl)

	const getClicksByDateUseCase = new GetClicksByDateUseCase(linkRepository, clickRepository)

	const getLinkClicksUseCase = new GetLinkClicksUseCase(linkRepository, clickRepository)

	const getLinkStatsUseCase = new GetLinkStatsUseCase(linkRepository, clickRepository)

	const listAnalyticsLinksUseCase = new ListAnalyticsLinksUseCase(linkRepository)

	const redirectUseCase = new RedirectUseCase(linkRepository, clickRepository, userAgentParserPort)

	return {
		config,
		database,
		redis,
		cleanupJob,
		userRepository,
		linkRepository,
		clickRepository,
		refreshTokenRepository,
		passwordPort,
		jwtPort,
		qrPort,
		userAgentParserPort,
		tokenBlacklistPort,
		shortCodeService,
		registerUseCase,
		loginUseCase,
		refreshUseCase,
		logoutUseCase,
		logoutAllUseCase,
		createLinkUseCase,
		getLinkUseCase,
		listLinksUseCase,
		updateLinkUseCase,
		deleteLinkUseCase,
		generateQrUseCase,
		getClicksByDateUseCase,
		getLinkClicksUseCase,
		getLinkStatsUseCase,
		listAnalyticsLinksUseCase,
		redirectUseCase,
	}
}
