import {
	type Database,
	UserRepositoryImpl,
	LinkRepositoryImpl,
	ClickRepositoryImpl,
	RefreshTokenRepositoryImpl,
	LinkCacheAdapter,
	CachedLinkRepository,
} from '../../infrastructure'

import type { UserRepository, LinkRepository, ClickRepository, RefreshTokenRepository } from '../../domain'

export interface RepositoriesModule {
	userRepository: UserRepository
	linkRepository: LinkRepository
	clickRepository: ClickRepository
	refreshTokenRepository: RefreshTokenRepository
}

interface RepositoriesModuleDeps {
	database: Database
	cacheMaxSize: number
	cacheTtl: number
}

export function createRepositoriesModule(deps: RepositoriesModuleDeps): RepositoriesModule {
	const { database, cacheMaxSize, cacheTtl } = deps

	const userRepository = new UserRepositoryImpl(database)

	const baseLinkRepository = new LinkRepositoryImpl(database)
	const linkCache = new LinkCacheAdapter(cacheMaxSize, cacheTtl)
	const linkRepository = new CachedLinkRepository(baseLinkRepository, linkCache)

	const clickRepository = new ClickRepositoryImpl(database)
	const refreshTokenRepository = new RefreshTokenRepositoryImpl(database)

	return {
		userRepository,
		linkRepository,
		clickRepository,
		refreshTokenRepository,
	}
}
