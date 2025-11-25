import { existsSync } from 'node:fs'

export function hasCertificates(certPath: string, keyPath: string): boolean {
	return existsSync(certPath) && existsSync(keyPath)
}

export function getCertificatePaths(certPath: string, keyPath: string) {
	return {
		cert: certPath,
		key: keyPath,
	}
}

export function getBaseUrl(host: string, port: number, certPath: string, keyPath: string): string {
	const useHttps = hasCertificates(certPath, keyPath)
	const protocol = useHttps ? 'https' : 'http'

	return `${protocol}://${host}:${port}`
}
