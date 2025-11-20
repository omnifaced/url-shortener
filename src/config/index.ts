import { PureConfig } from './pure-config'
import type { Config } from './config'
import { join } from 'node:path'

export const configLoader = new PureConfig<Config>({
	configsDirPath: join(process.cwd(), 'config'),
	configsSchemaDirPath: join(process.cwd(), 'config', 'schemas'),
})

export const config = configLoader.load()
