import * as assert from 'node:assert'

import { getRelativePath } from './get-relative-path'
import { describe, test } from 'node:test'
import { join } from 'node:path'

describe('getRelativePath', () => {
	test('should return relative path from current directory', () => {
		const absolutePath = join(process.cwd(), 'config', 'config.yaml')
		const result = getRelativePath(absolutePath)

		assert.strictEqual(result, join('config', 'config.yaml'))
	})

	test('should return path as-is if already relative', () => {
		const absolutePath = process.cwd()
		const result = getRelativePath(absolutePath)

		assert.strictEqual(result, '')
	})
})
