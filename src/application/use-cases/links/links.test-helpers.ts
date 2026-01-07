import { Id, Link, ShortCode, Url } from '../../../domain'
import type { LinkOwnershipService } from '../../services'
import { mock } from 'node:test'

export const createMockLink = () => {
	return Link.create({
		id: Id.create(1),
		userId: Id.create(10),
		originalUrl: Url.create('https://github.com/omnifaced'),
		shortCode: ShortCode.create('abc123'),
		title: null,
		isActive: true,
		createdAt: new Date(),
		expiresAt: null,
	})
}

export const createMockOwnershipService = (link: Link | null, shouldThrow?: Error) => {
	return {
		validateAndGetLink: mock.fn(async () => {
			if (shouldThrow) {
				throw shouldThrow
			}

			return link
		}),
	} as unknown as LinkOwnershipService
}
