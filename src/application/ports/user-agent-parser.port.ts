import type { DeviceInfo } from '../../domain'

export interface UserAgentParserPort {
	parse(userAgent: string): DeviceInfo
}
