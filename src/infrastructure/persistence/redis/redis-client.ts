import { createClient, type RedisClientType } from 'redis'
import { logger } from '../../../shared'

export async function createRedisClient(config: {
	url: string
	username?: string
	password?: string
}): Promise<RedisClientType> {
	const client = createClient({
		url: config.url,
		username: config.username,
		password: config.password,
		socket: {
			reconnectStrategy: (retries) => {
				if (retries > 3) {
					console.warn(`Redis retry attempts exhausted after ${retries} tries`)
					return new Error('Max retries reached')
				}

				return Math.min(retries * 200, 1000)
			},
		},
	})

	client.on('error', (error) => {
		logger.error('Redis connection error:', error)
	})

	client.on('ready', () => {
		logger.info('Redis connected successfully')
	})

	client.on('reconnecting', () => {
		logger.warn('Redis reconnecting...')
	})

	client.on('end', () => {
		logger.warn('Redis connection closed')
	})

	await client.connect()

	return client as RedisClientType
}
