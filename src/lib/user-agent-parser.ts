import { UAParser } from 'ua-parser-js'

export function parseUserAgent(userAgentString: string | null | undefined) {
	if (!userAgentString) {
		return null
	}

	const parser = new UAParser(userAgentString)
	const result = parser.getResult()

	return {
		browser: result.browser.name || undefined,
		browserVersion: result.browser.version || undefined,
		os: result.os.name || undefined,
		osVersion: result.os.version || undefined,
		deviceType: result.device.type || undefined,
		deviceVendor: result.device.vendor || undefined,
		deviceModel: result.device.model || undefined,
	}
}
