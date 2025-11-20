import { createClient } from 'redis'
import { config } from '../config'
import { logger } from './logger'

export const redis = createClient({
	url: config.redis.url,
	username: config.redis.username,
	password: config.redis.password,
	socket: {
		reconnectStrategy: (retries) => {
			if (retries > 3) {
				logger.warn(`Redis retry attempts exhausted after ${retries} tries`)
				return new Error('Max retries reached')
			}

			return Math.min(retries * 200, 1000)
		},
	},
})

redis.on('error', (error) => {
	logger.error('Redis connection error', error)
})

redis.on('ready', () => {
	logger.success('Redis connected successfully')
})

redis.on('reconnecting', () => {
	logger.warn('Redis reconnecting...')
})

redis.on('end', () => {
	logger.warn('Redis connection closed')
})

await redis.connect()
