import * as assert from 'node:assert'

import { describe, test, mock, afterEach, after } from 'node:test'
import { rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { PureConfig } from './pure-config'
import { join } from 'node:path'

describe('PureConfig', () => {
	const baseTestDir = join(process.cwd(), 'src/shared/config/__test_temp__')
	const testConfigDir = join(process.cwd(), 'src/shared/config/__test_configs__')
	const testSchemaDir = join(process.cwd(), 'src/shared/config/__test_schemas__')

	afterEach(() => {
		mock.reset()
	})

	after(() => {
		rmSync(baseTestDir, { recursive: true, force: true })
	})

	const assertExitsWithError = (configDir: string, schemaDir: string) => {
		const exitMock = mock.method(process, 'exit', () => {
			throw new Error('process.exit called')
		})

		const config = new PureConfig({
			configsDirPath: configDir,
			configsSchemaDirPath: schemaDir,
		})

		try {
			assert.throws(() => config.load(), /process\.exit called/)
		} finally {
			exitMock.mock.restore()
		}

		assert.strictEqual(exitMock.mock.calls[0].arguments[0], 1)
	}

	test('should load and validate config successfully', () => {
		const config = new PureConfig({
			configsDirPath: testConfigDir,
			configsSchemaDirPath: testSchemaDir,
		})

		const result = config.load()

		assert.strictEqual(typeof result, 'object')
		assert.strictEqual((result as { app: { port: number } }).app.port, 3000)
		assert.strictEqual((result as { app: { host: string } }).app.host, 'localhost')
	})

	test('should skip .example files', () => {
		const tempConfigDir = join(baseTestDir, 'example_config')
		const tempSchemaDir = join(baseTestDir, 'example_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(join(tempConfigDir, 'test.yaml.example'), 'port: 4000')
		writeFileSync(join(tempConfigDir, 'test.yaml'), 'port: 3000')
		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
properties:
  port:
    type: number
`
		)

		const config = new PureConfig({
			configsDirPath: tempConfigDir,
			configsSchemaDirPath: tempSchemaDir,
		})

		const result = config.load()

		assert.strictEqual((result as { test: { port: number } }).test.port, 3000)
	})

	test('should handle multiple config files', () => {
		const tempConfigDir = join(baseTestDir, 'multi_config')
		const tempSchemaDir = join(baseTestDir, 'multi_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(join(tempConfigDir, 'app.yaml'), 'port: 3000\nhost: localhost')
		writeFileSync(join(tempConfigDir, 'db.yaml'), 'host: db.local\nport: 5432')

		writeFileSync(
			join(tempSchemaDir, 'app.yaml'),
			`
type: object
properties:
  port:
    type: number
  host:
    type: string
`
		)

		writeFileSync(
			join(tempSchemaDir, 'db.yaml'),
			`
type: object
properties:
  host:
    type: string
  port:
    type: number
`
		)

		const config = new PureConfig({
			configsDirPath: tempConfigDir,
			configsSchemaDirPath: tempSchemaDir,
		})

		const result = config.load()

		assert.strictEqual((result as { app: { port: number } }).app.port, 3000)
		assert.strictEqual((result as { db: { port: number } }).db.port, 5432)
	})

	test('should exit when config directory does not exist', () => {
		const exitMock = mock.method(process, 'exit', () => {
			throw new Error('process.exit called')
		})

		const config = new PureConfig({
			configsDirPath: '/non/existent/path',
			configsSchemaDirPath: testSchemaDir,
		})

		assert.throws(() => config.load(), /process\.exit called/)
		assert.strictEqual(exitMock.mock.calls.length, 1)
		assert.strictEqual(exitMock.mock.calls[0].arguments[0], 1)
	})

	test('should exit when validation fails', () => {
		const tempConfigDir = join(baseTestDir, 'invalid_config')
		const tempSchemaDir = join(baseTestDir, 'invalid_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(join(tempConfigDir, 'test.yaml'), 'port: "not a number"')
		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
properties:
  port:
    type: number
`
		)

		assertExitsWithError(tempConfigDir, tempSchemaDir)
	})

	test('should skip directories in config folder', () => {
		const tempConfigDir = join(baseTestDir, 'with_dirs')
		const tempSchemaDir = join(baseTestDir, 'with_dirs_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })
		mkdirSync(join(tempConfigDir, 'subdir'), { recursive: true })

		writeFileSync(join(tempConfigDir, 'test.yaml'), 'port: 3000')
		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
properties:
  port:
    type: number
`
		)

		const config = new PureConfig({
			configsDirPath: tempConfigDir,
			configsSchemaDirPath: tempSchemaDir,
		})

		const result = config.load()

		assert.strictEqual((result as { test: { port: number } }).test.port, 3000)
	})

	test('should handle nested required fields', () => {
		const tempConfigDir = join(baseTestDir, 'nested')
		const tempSchemaDir = join(baseTestDir, 'nested_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(
			join(tempConfigDir, 'test.yaml'),
			`
server:
  host: localhost
  port: 3000
database:
  host: db.local
  port: 5432
`
		)

		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
properties:
  server:
    type: object
    properties:
      host:
        type: string
      port:
        type: number
    required:
      - host
      - port
  database:
    type: object
    properties:
      host:
        type: string
      port:
        type: number
    required:
      - host
required:
  - server
`
		)

		interface TestConfig {
			server: {
				port: number
			}
			database: {
				port: number
			}
		}

		const config = new PureConfig<{ test: TestConfig }>({
			configsDirPath: tempConfigDir,
			configsSchemaDirPath: tempSchemaDir,
		})

		const result = config.load()

		assert.strictEqual(result.test.server.port, 3000)
		assert.strictEqual(result.test.database.port, 5432)
	})

	test('should resolve expressions in config', () => {
		const tempConfigDir = join(baseTestDir, 'expressions')
		const tempSchemaDir = join(baseTestDir, 'expressions_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(
			join(tempConfigDir, 'test.yaml'),
			`
port: 3000
url: "=> 'http://localhost:' + self.port"
`
		)

		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
properties:
  port:
    type: number
  url:
    type: string
`
		)

		interface TestConfig {
			url: string
		}

		const config = new PureConfig<{ test: TestConfig }>({
			configsDirPath: tempConfigDir,
			configsSchemaDirPath: tempSchemaDir,
		})

		const result = config.load()

		assert.strictEqual(result.test.url, 'http://localhost:3000')
	})

	test('should handle arrays with objects in config', () => {
		const tempConfigDir = join(baseTestDir, 'arrays')
		const tempSchemaDir = join(baseTestDir, 'arrays_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(
			join(tempConfigDir, 'test.yaml'),
			`
servers:
  - host: server1
    port: 3000
  - host: server2
    port: 3001
`
		)

		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
properties:
  servers:
    type: array
    items:
      type: object
      properties:
        host:
          type: string
        port:
          type: number
`
		)

		interface TestConfig {
			servers: {
				port: number
				host: string
			}[]
		}

		const config = new PureConfig<{ test: TestConfig }>({
			configsDirPath: tempConfigDir,
			configsSchemaDirPath: tempSchemaDir,
		})

		const result = config.load()

		assert.strictEqual(result.test.servers[0].port, 3000)
		assert.strictEqual(result.test.servers[1].host, 'server2')
	})

	test('should exit when required expression returns undefined', () => {
		const tempConfigDir = join(baseTestDir, 'expr_undef')
		const tempSchemaDir = join(baseTestDir, 'expr_undef_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(
			join(tempConfigDir, 'test.yaml'),
			`
url: "=> undefined"
`
		)

		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
properties:
  url:
    type: string
required:
  - url
`
		)

		assertExitsWithError(tempConfigDir, tempSchemaDir)
	})

	test('should exit when expression has error in required field', () => {
		const tempConfigDir = join(baseTestDir, 'expr_error')
		const tempSchemaDir = join(baseTestDir, 'expr_error_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(
			join(tempConfigDir, 'test.yaml'),
			`
url: "=> self.nonexistent.property"
`
		)

		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
properties:
  url:
    type: string
required:
  - url
`
		)

		assertExitsWithError(tempConfigDir, tempSchemaDir)
	})

	test('should return undefined for optional field with undefined variable', () => {
		const tempConfigDir = join(baseTestDir, 'optional_undef')
		const tempSchemaDir = join(baseTestDir, 'optional_undef_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(
			join(tempConfigDir, 'test.yaml'),
			`
url: "=> nonexistent"
`
		)

		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
properties:
  url:
    type: string
`
		)

		interface TestConfig {
			url: string
		}

		const config = new PureConfig<{ test: TestConfig }>({
			configsDirPath: tempConfigDir,
			configsSchemaDirPath: tempSchemaDir,
		})

		const result = config.load()

		assert.strictEqual(result.test.url, undefined)
	})
	test('should handle arrays with primitive values', () => {
		const tempConfigDir = join(baseTestDir, 'arrays_primitives')
		const tempSchemaDir = join(baseTestDir, 'arrays_primitives_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(
			join(tempConfigDir, 'test.yaml'),
			`
tags:
  - tag1
  - tag2
  - tag3
ports:
  - 3000
  - 3001
`
		)

		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
properties:
  tags:
    type: array
    items:
      type: string
  ports:
    type: array
    items:
      type: number
`
		)

		interface TestConfig {
			tags: string[]
			ports: number[]
		}

		const config = new PureConfig<{ test: TestConfig }>({
			configsDirPath: tempConfigDir,
			configsSchemaDirPath: tempSchemaDir,
		})

		const result = config.load()

		assert.deepStrictEqual(result.test.tags, ['tag1', 'tag2', 'tag3'])
		assert.deepStrictEqual(result.test.ports, [3000, 3001])
	})

	test('should handle arrays with expressions in primitive values', () => {
		const tempConfigDir = join(baseTestDir, 'arrays_expr')
		const tempSchemaDir = join(baseTestDir, 'arrays_expr_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(
			join(tempConfigDir, 'test.yaml'),
			`
basePort: 3000
ports:
  - "=> self.basePort"
  - "=> self.basePort + 1"
  - "=> self.basePort + 2"
`
		)

		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
properties:
  basePort:
    type: number
  ports:
    type: array
    items:
      type: number
`
		)

		interface TestConfig {
			ports: number[]
		}

		const config = new PureConfig<{ test: TestConfig }>({
			configsDirPath: tempConfigDir,
			configsSchemaDirPath: tempSchemaDir,
		})

		const result = config.load()

		assert.deepStrictEqual(result.test.ports, [3000, 3001, 3002])
	})

	test('should handle schema without properties field', () => {
		const tempConfigDir = join(baseTestDir, 'no_props')
		const tempSchemaDir = join(baseTestDir, 'no_props_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(join(tempConfigDir, 'test.yaml'), 'port: 3000')

		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
required:
  - port
`
		)

		const config = new PureConfig({
			configsDirPath: tempConfigDir,
			configsSchemaDirPath: tempSchemaDir,
		})

		const result = config.load()

		assert.strictEqual(typeof result, 'object')
	})

	test('should handle schema with null value in properties', () => {
		const tempConfigDir = join(baseTestDir, 'null_prop')
		const tempSchemaDir = join(baseTestDir, 'null_prop_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(join(tempConfigDir, 'test.yaml'), 'port: 3000')

		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
properties:
  port:
    type: number
`
		)

		const config = new PureConfig({
			configsDirPath: tempConfigDir,
			configsSchemaDirPath: tempSchemaDir,
		})

		const result = config.load()

		assert.strictEqual(typeof result, 'object')
	})

	test('should handle arrays with mixed types', () => {
		const tempConfigDir = join(baseTestDir, 'mixed_array')
		const tempSchemaDir = join(baseTestDir, 'mixed_array_schema')

		mkdirSync(tempConfigDir, { recursive: true })
		mkdirSync(tempSchemaDir, { recursive: true })

		writeFileSync(
			join(tempConfigDir, 'test.yaml'),
			`
items:
  - value: 1
  - 2
  - value: 3
`
		)

		writeFileSync(
			join(tempSchemaDir, 'test.yaml'),
			`
type: object
properties:
  items:
    type: array
`
		)

		const config = new PureConfig({
			configsDirPath: tempConfigDir,
			configsSchemaDirPath: tempSchemaDir,
		})

		const result = config.load()

		assert.strictEqual(typeof result, 'object')
		assert.ok(Array.isArray((result as { test: { items: unknown[] } }).test.items))
	})

	test('getRequiredFields should return [] for non-object schema', () => {
		const config = new PureConfig({ configsDirPath: 'x', configsSchemaDirPath: 'y' })

		// @ts-expect-error private field
		const result1 = config.getRequiredFields('not-object')
		// @ts-expect-error private field
		const result2 = config.getRequiredFields(null)

		assert.deepStrictEqual(result1, [])
		assert.deepStrictEqual(result2, [])
	})
})
