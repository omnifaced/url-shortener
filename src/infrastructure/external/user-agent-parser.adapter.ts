import type { UserAgentParserPort } from '../../application'
import type { DeviceInfo } from '../../domain'
import { UAParser } from 'ua-parser-js'

export class UserAgentParserAdapter implements UserAgentParserPort {
	public parse(userAgent: string): DeviceInfo {
		const parser = new UAParser(userAgent)
		const result = parser.getResult()

		return {
			browser: result.browser.name,
			os: result.os.name,
			device: result.device.type || 'desktop',
		}
	}
}
