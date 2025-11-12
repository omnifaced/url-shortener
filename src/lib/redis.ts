import Redis from 'ioredis'

import { logger } from './logger'

const redisUrl = process.env.REDIS_URL

if (!redisUrl) {
	throw new Error('REDIS_URL environment variable is not set')
}

export const redis = new Redis(redisUrl, {
	username: process.env.REDIS_USERNAME,
	password: process.env.REDIS_PASSWORD,
	maxRetriesPerRequest: 3,
	retryStrategy: (times) => {
		if (times > 3) {
			logger.warn(`Redis retry attempts exhausted after ${times} tries`)
			return null
		}

		return Math.min(times * 200, 1000)
	},
})

redis.on('error', (error) => {
	logger.error('Redis connection error', error)
})

redis.on('connect', () => {
	logger.success('Redis connected successfully')
})

redis.on('reconnecting', () => {
	logger.warn('Redis reconnecting...')
})

redis.on('close', () => {
	logger.warn('Redis connection closed')
})
