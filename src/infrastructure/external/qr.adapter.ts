import type { QrPort, QrOptions } from '../../application'
import encodeQR, { type ErrorCorrection } from 'qr'

const ECC_MAP: Record<string, 'L' | 'M' | 'Q' | 'H'> = {
	low: 'L',
	medium: 'M',
	quartile: 'Q',
	high: 'H',
}

export class QrAdapter implements QrPort {
	public async generate(url: string, options: QrOptions): Promise<Buffer> {
		const { format, size, ecc } = options

		const scale = Math.floor(size / 25)
		const eccLevel = ECC_MAP[ecc] as ErrorCorrection

		if (format === 'svg') {
			const svg = encodeQR(url, 'svg', { ecc: eccLevel, scale })
			return Buffer.from(svg)
		}

		const rawBytes = encodeQR(url, 'gif', { ecc: eccLevel, scale })
		return Buffer.from(rawBytes.buffer.slice(0) as ArrayBuffer)
	}
}
