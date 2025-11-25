import { randomBytes, timingSafeEqual, scrypt as scryptSync } from 'node:crypto'
import type { PasswordPort } from '../../application'
import { promisify } from 'node:util'

const scrypt = promisify(scryptSync)
const SALT_LENGTH = 16
const KEY_LENGTH = 64

export class PasswordAdapter implements PasswordPort {
	public async hash(password: string): Promise<string> {
		const salt = randomBytes(SALT_LENGTH).toString('hex')
		const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer

		return `${salt}:${derivedKey.toString('hex')}`
	}

	public async verify(password: string, hash: string): Promise<boolean> {
		const [salt, key] = hash.split(':')
		const keyBuffer = Buffer.from(key, 'hex')
		const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer

		return timingSafeEqual(keyBuffer, derivedKey)
	}
}
