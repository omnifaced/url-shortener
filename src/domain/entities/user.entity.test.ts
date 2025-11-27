import * as assert from 'node:assert'

import { Id, Username } from '../value-objects'
import { describe, test } from 'node:test'
import { User } from './user.entity'

function assertUserFields(
	user: User,
	expected: {
		username: string
		passwordHash: string
	}
) {
	assert.strictEqual(user.getUsername().getValue(), expected.username)
	assert.strictEqual(user.getPasswordHash(), expected.passwordHash)
}

describe('User', () => {
	describe('create', () => {
		test('should create User from props', () => {
			const props = {
				id: Id.create(1),
				username: Username.create('john'),
				passwordHash: 'hashed_password',
				createdAt: new Date(),
			}

			const user = User.create(props)

			assert.strictEqual(user.getId().getValue(), 1)
			assertUserFields(user, {
				username: 'john',
				passwordHash: 'hashed_password',
			})
		})
	})

	describe('createNew', () => {
		test('should create new User with username and passwordHash', () => {
			const username = Username.create('john')
			const passwordHash = 'hashed_password'

			const user = User.createNew(username, passwordHash)

			assertUserFields(user, {
				username: 'john',
				passwordHash: 'hashed_password',
			})
		})
	})

	describe('getId', () => {
		test('should return correct Id', () => {
			const user = User.create({
				id: Id.create(42),
				username: Username.create('john'),
				passwordHash: 'hash',
				createdAt: new Date(),
			})

			assert.strictEqual(user.getId().getValue(), 42)
		})
	})

	describe('getUsername', () => {
		test('should return correct Username', () => {
			const user = User.createNew(Username.create('test_user'), 'hash')

			assert.strictEqual(user.getUsername().getValue(), 'test_user')
		})
	})

	describe('getPasswordHash', () => {
		test('should return correct password hash', () => {
			const user = User.createNew(Username.create('john'), 'secret_hash')

			assert.strictEqual(user.getPasswordHash(), 'secret_hash')
		})
	})
})
